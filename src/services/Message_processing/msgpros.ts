import {
    WASocket,
    downloadMediaMessage,
    WAMessage
} from '@whiskeysockets/baileys';
import P from 'pino'
import { VendorRepo } from '../../repositories/vendors_repo';
import { MessageBuffer, Listing, Vendor, msgtype } from '../../types/Data_types';
import { listing_repo } from '../../repositories/listing_repo';
import { ImgProcessing } from './imgpros';
export class Message_processing {

    private _sock: WASocket;
    private groupMetadataCache: Map<string, { groupName: string, timestamp: number }>;
    private _rvendor: VendorRepo;
    private _rlist: listing_repo;
    private _imgpro: ImgProcessing;
    constructor(sock: WASocket) {
        this._sock = sock
        this.groupMetadataCache = new Map()
        this._rvendor = new VendorRepo()
        this._rlist = new listing_repo()
        this._imgpro = new ImgProcessing()
    }


    public async messageparser(msg: WAMessage) {
        //lets decide whiter it is image or text or mixed
        const venderifo = await this.extractVendorInfo(msg)
        console.log("get vendor information :->",venderifo)
        if (!venderifo) return

        //but first take care that the first vendor or message come we neeed to resgister them.
        // don't update them we will update when listing get created.

        //step-1:- get  image


        let imgcheck = msg.message?.imageMessage;
        let textcheck = msg.message?.extendedTextMessage?.text;
        if (imgcheck && !textcheck) {
           console.log("passed image + caption:-> moving to download image")
            let imgbuff: Buffer | null = await this.downloadimage(msg)
            
            if (!imgbuff) return
            console.log("downloadedimage passed:-> uploading it")
           const img_url= await this._imgpro.upload_image(imgbuff)

            console.log("uploding completed url is ->",img_url)
            //Step 2:- check if there is caption or not
            if (imgcheck?.caption && imgcheck.caption.length > 0 && img_url) {
                //instead of message buffer create actual listing becasue we have both image and text.implement ai on it
                //we are not storing all the albumb we are only getting firs image for now in future we need to add images with caption in the
                //buffer as well
                console.log("Vendor update or created step:->")
                let venderget = await this._rvendor.getVendorByPhone(venderifo.vdata.phoneNumber);
                console.log("vendor info from db->",venderget)
                if (!venderget || venderget.length === 0) {
                console.log("new vendor created with ->",venderifo.vdata)
                venderget = await this._rvendor.createVendor(venderifo.vdata)
                }
                else
                {
                const d = {
                           totallistings: venderifo.vdata.totalListings + 1,
                           lastmessageat: 
                           msg.messageTimestamp != null
                             ? new Date(Number(msg.messageTimestamp) * 1000)
                             : new Date()
                          }
                console.log("vendor update which is get from query ->",venderget)
                console.log("update vendor created with ->",d)
               
              venderget =   await this._rvendor.updateVendor(venderifo.vdata.phoneNumber,d)
                }
                   await this.creates_listings(msg, venderget[0], "mixed")
                }
                else {
                    //here add message buffer with type image
                }
        }
        else if (!imgcheck && textcheck && textcheck.length > 0) {
            // step3:- check here in message buffer with the whatsapp number or id and check if the last message buffer is image.
            //1-> if the last isProcessed is falsed then ignore that message.
            //2->if the last message of that vendor is image then add text to it (after ai) and then create the listing from that data.
            //3->delete that messagebuffer.
        }

    }


    //need to add ai on this function
    public async creates_listings(msg: WAMessage, vinfo: Vendor, msg_type: msgtype) {
        const gid = this.getgroupid(msg)
        let gname = await this.getgroupname(msg.key.remoteJid || "");
      
        const gt = msg.key.remoteJid
        if (gid == null || gname == null) return
        const list: Listing = {
            vendorId: vinfo.id,
            groupId: gid,
            groupName: gname,
            rawMessage: msg,
            description: this.getdescription(msg) || "",
            images: [""],
            price: 0,//ai
            brand: "",//ai
            productType: "",//ai
            gender: "men",//ai
            size: "",//ai
            condition: "new",//ai
            viewCount: 0,
            likeCount: 0,
            messageCount: 0,
            status: 'active',//ai
            isWTB: true,//ai
        }
       console.log("Listing trying to be created with ->",list)
       await this._rlist.create_listing(list)

        //now update the vendor

       







        //  const mb:MessageBuffer={ 
        //        vendorId: vinfo.id,
        //        groupId: this.getgroupid(msg), 
        //        messageType: msg_type ,
        //        description: this.getdescription(msg),
        //        images: [""], 
        //        isProcessed:true,
        //        shouldCombine: true,
        //        whatsappMessageId: "",
        //  }
    }



    private async extractVendorInfo(msg: WAMessage) {
        const isGroup = msg.key.remoteJid?.endsWith('@g.us')
         console.log("is group or not -> ",isGroup )
        if(!isGroup) return
       
        let vendorWhatsappId: string = ""
        let vendorPhoneNumber: string = ""
        let groupname: string = ""
        let groupid: string | null = ""
        let vendorName = msg.pushName || 'Unknown'
        if (isGroup) {
            groupid = this.getgroupid(msg);
             console.log("groupid -> ",groupid )
            if (groupid == null) return
            let k = await this.getgroupname(msg.key.remoteJid||"")
            if (k == "" || k == null) return
            groupname = k;
            vendorWhatsappId = msg.key.participant ? msg.key.participant.split("@")[0] : ""
            console.log("vendorWhatsappId -> ",vendorWhatsappId )
            if (vendorName == "") return
            if (msg.key.participantAlt) {
                vendorPhoneNumber = msg.key.participantAlt.split(':')[0]
                  console.log("vendorPhoneNumber -> ",vendorPhoneNumber )
            }
        }
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
        // const cached = this.getGroupMetadata(groupid);
        // if (cached) {
        //     return cached.groupName
        // }
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
        return msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption
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
}