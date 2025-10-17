import {
    WASocket,
    downloadMediaMessage,
    WAMessage
} from '@whiskeysockets/baileys';
import P from 'pino'
import { VendorRepo } from '../../repositories/vendors_repo';
import { MessageBuffer, Listing, Vendor, msgtype,AI_Response } from '../../types/Data_types';
import { listing_repo } from '../../repositories/listing_repo';
import { ImgProcessing } from './imgpros';
import {AI} from '../AI_Services/Ai'
import { Message_Buffer } from './msgbuff';
export class Message_processing {

    private _sock: WASocket;
    private groupMetadataCache: Map<string, { groupName: string, timestamp: number }>;
    private _rvendor: VendorRepo;
    private _rlist: listing_repo;
    private _imgpro: ImgProcessing;
    private _ai:AI;
    private _msgbuff:Message_Buffer;

    constructor(sock: WASocket) {
        this._sock = sock
        this.groupMetadataCache = new Map()
        this._rvendor = new VendorRepo()
        this._rlist = new listing_repo()
        this._imgpro = new ImgProcessing()
        this._ai=new AI()
        this._msgbuff=new Message_Buffer()
    }
    
    public async messageparser(msg: WAMessage) {
          if (!this.isValidMessage(msg)) return;
        //lets decide whiter it is image or text or mixed
        
        const venderifo = await this.extractVendorInfo(msg)
        console.log("get vendor information :->",venderifo)
        if (!venderifo) return

        //but first take care that the first vendor or message come we neeed to resgister them.
        // don't update them we will update when listing get created.

        //step-1:- get  image


        let imgcheck = msg.message?.imageMessage;
        let textcheck = msg.message?.extendedTextMessage?.text;
        if(!imgcheck && !textcheck) return null;
        let venderget =await this.vendor_handling(venderifo,msg)
        if(!venderget|| venderget?.length==0) return
        let vendor = Array.isArray(venderget) ? venderget[0] : venderget;
        if (imgcheck && !textcheck)
        {
            const img_url=await this.handle_image(msg)
            console.log("uploding completed url is ->",img_url)
            //Step 2:- check if there is caption or not
            if (imgcheck?.caption && imgcheck.caption.length > 0&&imgcheck.caption!="" &&Array.isArray(img_url)&& img_url.length>0) {
                //instead of message buffer create actual listing becasue we have both image and text.implement ai on it
                //we are not storing all the albumb we are only getting firs image for now in future we need to add images with caption in the
                //buffer as well
                   await this.creates_listings(msg, vendor,img_url)
                }
             else {
            if(Array.isArray(img_url)&& img_url.length>0)
            {
             //here add message buffer with type image
              let gname = await this.getgroupname(msg.key.remoteJid || "");
              if(!gname||gname=="")return null
             await this._msgbuff.addimagetobuffer(vendor,msg,gname,"image",img_url)
            }}
        }
        else if (!imgcheck && textcheck && textcheck.length > 0) {
              let desc=await this.getdescription(msg)
              //write here check duplicates ------------------->
              if(!desc) return null
              const re:MessageBuffer|null|undefined = await this._msgbuff.addtexttobuffer(vendor,msg,"text",desc)
              if(!re || (!Array.isArray(re.images))||(Array.isArray(re.images)&&re.images.length==0)  ) return null
            //create listing from here if we have messagebuffer which says shouldcombine false and isprocessed true
              await this.creates_listings(msg,vendor,re.images)
            //!!!IMOPRTANT LOOK AT THIS ASAP
            //GET THE BUFFER ALSO ON GROUPID WHICH WILL HELP YOU TO JOIN TEXT AND DESCRIPTION EVEN IF THE LISITNG HAPPEN IN DIFFERENT GROUPS.


            // step3:- check here in message buffer with the whatsapp number or id and check if the last message buffer is image.
            //1-> if the last isProcessed is true then ignore that message.
            //2->if the last message of that vendor is image then add text to it (after ai) and then create the listing from that data.
            //3->delete that messagebuffer.
        }

    }
    
    //need to add ai on this function
    public async creates_listings(msg: WAMessage, vinfo: any,imgs:string[]) {
        try{
            
        const gid = this.getgroupid(msg)
        let gname = await this.getgroupname(msg.key.remoteJid || "");
        const gt = msg.key.remoteJid
        if (gid == null || gname == null) return null
        const pdesc= this.getdescription(msg) || ""
        //check here for dublicate because every end point wil come here
        if(!pdesc||pdesc=="")return null
        const duplicate=await this._rlist.checkdublicate(pdesc.trim(),vinfo.id)
        if(duplicate){
            //if we have the dublicate dublicate is true and we reutrn that
            console.log("dublicate detected with description =>",pdesc)
            return null
        } 
        const aidata:AI_Response =await this._ai.extractProductInfo(pdesc)
        if(!aidata ||(aidata && (aidata.iswtb==aidata.iswts))) throw new Error(aidata?JSON.stringify(aidata):"something wrong with data")
         console.log(aidata)
        const list: Listing = {
            vendorId: vinfo.id,
            groupId: gid,
            groupName: gname,
            rawMessage: msg,
            description:pdesc,
            images: imgs,
            price: aidata.price,//ai
            brand: aidata.brand,//ai
            productType: aidata.productType,//ai
            gender: aidata.gender||"",//ai
            size: aidata.size,//ai
            condition: aidata.condition,//ai
            viewCount: 0,
            likeCount: 0,
            messageCount: 0,
            status: 'active',//ai
            isWTB: aidata.iswtb ?? false,//ai,
            isWTS:aidata.iswts ?? true
        }
    
       console.log("Listing trying to be created with ->",list)
       const re= await this._rlist.create_listing(list)
        
        //now update the vendor
        const d = {
                       totallistings: (vinfo.totallistings || 0) + 1,
                       lastmessageat: 
                       msg.messageTimestamp != null
                         ? new Date(Number(msg.messageTimestamp) * 1000)
                         : new Date()
                      }
               
        let venderget =   await this._rvendor.updateVendor(vinfo.phonenumber,d)
      return re;
        }
        catch(e)
        {
            console.log("Error on creating :->",e)
        }
    }
    
    private async extractVendorInfo(msg: WAMessage) {
        const isGroup = msg.key.remoteJid?.endsWith('@g.us')
         console.log("is group or not -> ",isGroup )
        if(!isGroup) return null
        let vendorWhatsappId: string = ""
        let vendorPhoneNumber: string = ""
        let groupname: string = ""
        let groupid: string | null = ""
        let vendorName = msg.pushName || 'Unknown'
        if (isGroup) {
            groupid = this.getgroupid(msg);
             console.log("groupid -> ",groupid )
            if (!groupid||groupid=="") return null
            let k = await this.getgroupname(msg.key.remoteJid||"")
            if (k == "" || k == null) return null
            groupname = k;
            vendorWhatsappId = msg.key.participant ? msg.key.participant.split("@")[0] : ""
            console.log("vendorWhatsappId -> ",vendorWhatsappId )
            if (vendorName == "") return null
            if (msg.key.participantPn) {
                vendorPhoneNumber = msg.key.participantPn.split(':')[0]
                vendorPhoneNumber = vendorPhoneNumber.split("@")[0];
                console.log("vendorPhoneNumber -> ",vendorPhoneNumber)
            }
        }
        if(!vendorName  ||vendorName===''|| !vendorPhoneNumber||vendorPhoneNumber===""||!vendorWhatsappId || vendorWhatsappId=="" ) return null
        const vdata = {
            whatsappId: vendorWhatsappId,
            phoneNumber: vendorPhoneNumber,
            displayName: vendorName,
            totalListings: 0,
            avgRating: 0,
            totalRatings: 0,
            isBlocked: false,
        }

        return { vdata, isGroup }
    }
    
    private getgroupid(msg: WAMessage) {
        if (!msg.key.remoteJid) return null
        return msg.key.remoteJid.split("@")[0];
    }

    public async getgroupname(groupid: string): Promise<string | null> {
        if (groupid == null || groupid == "" || !this._sock){
          console.log(groupid)    
          if(!this._sock)
          {
            console.log("socket is not established yet")
          }
            return null
        }
        const cached = this.getGroupMetadata(groupid);
        if (cached) {
            return cached.groupName
        }
        try {
            const metadata = await this._sock.groupMetadata(groupid)
            const groupname = metadata?.subject;
            this.addGroupMetadata(groupid, groupname, Date.now())
              console.log("gorupname", groupname)
            return groupname
        }
        catch (e) {
           console.log("gorupname", e)
            return null
        }
    }

    private getdescription(msg: WAMessage) {
        return msg.message?.extendedTextMessage?.text?.trim() || msg.message?.imageMessage?.caption?.trim()
    }

    private addGroupMetadata(id: string, groupName: string, timestamp: number) {
        this.groupMetadataCache.set(id, { groupName, timestamp });
    }

    private getGroupMetadata(id: string) {
        return this.groupMetadataCache.get(id);
    }

    private async downloadimage(msg: WAMessage): Promise<Buffer | null> {
        try {
            const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                    logger: P({ level: 'silent' }),
                    reuploadRequest: this._sock.updateMediaMessage
                }
            ) as Buffer
            return buffer
        }
        catch (e) {
            console.error('Error downloading image:', e)
            return null
        }
    }

    private async handle_image(msg:WAMessage)
    {
 console.log("passed image + caption:-> moving to download image")
            let imgbuff: Buffer | null = await this.downloadimage(msg)
            
            if (!imgbuff) return
            console.log("downloadedimage passed:-> uploading it")
            return await this._imgpro.upload_image(imgbuff)
            
    }

    private isValidMessage(msg: WAMessage): boolean {
    if (msg.key.fromMe) {
        console.log('⏭️ Skipping own message');
        return false;
    }
    
    if ((msg as any).messageStubType) {
        console.log('⏭️ Skipping system message');
        return false;
    }
    if((msg as any).remoteJidAlt)
    {

    }
    
    const isGroup = msg.key.remoteJid?.endsWith('@g.us');
    if (!isGroup) {
        console.log('⏭️ Skipping non-group message');
        return false;
    }
    
    // Check message age
    const messageTimestamp = (msg.messageTimestamp as number) * 1000;
    const messageAge = Date.now() - messageTimestamp;
    const FIVE_MINUTES = 5 * 60 * 1000;
    
    if (messageAge > FIVE_MINUTES) {
        console.log('⏭️ Skipping old message');
        return false;
    }

    
    
    return true;
    }

    private async vendor_handling(venderifo:any,msg:WAMessage)
    {
        let venderget= await this._rvendor.getVendorByPhone(venderifo.vdata.phoneNumber);
            console.log("vendor info from db->",venderget)
            if (!venderget || venderget.length === 0) {
            console.log("new vendor created with ->",venderifo.vdata)
            venderget = await this._rvendor.createVendor(venderifo.vdata)
            }
         return venderget       
    }
    
}