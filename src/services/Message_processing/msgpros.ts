import  {
    WASocket
} from '@whiskeysockets/baileys';
import { VendorRepo } from '../../repositories/vendors_repo';
import { WhatsAppMessage,MessageBuffer,Listing, Vendor,msgtype } from '../../types/Data_types';
import { listing_repo } from '../../repositories/listing_repo';
export class Message_processing {

    private _sock: WASocket;
    private groupMetadataCache: Map<string, { groupName: string, timestamp: number }>;
    private _rvendor:VendorRepo;
    private _rlist:listing_repo;
    constructor(sock: WASocket) {
        this._sock = sock
        this.groupMetadataCache = new Map()
        this._rvendor=new VendorRepo()
        this._rlist=new listing_repo()
    }


    public async messageparser(msg: WhatsAppMessage) {
        //lets decide whiter it is image or text or mixed
        const venderifo = await this.extractVendorInfo(msg)
        if (venderifo.isGroup == false)
           return 

        let venderget=await this._rvendor.getVendorByPhone(venderifo.vdata.phoneNumber);
        if(venderget)
        {
            venderget= await this._rvendor.createVendor(venderifo.vdata)

        
        }

        //but first take care that the first vendor or message come we neeed to resgister them.
        // don't update them we will update when listing get created.
        
        //step-1:- get  image
        let imgcheck = msg.message?.imageMessage;
        let textcheck = msg.message?.extendedTextMessage?.text;
        if (imgcheck && !textcheck) {
            //Step 2:- check if there is caption or not
            if (imgcheck?.caption && imgcheck.caption.length > 0) {
                //instead of message buffer create actual listing becasue we have both image and text.implement ai on it
                //we are not storing all the albumb we are only getting firs image for now in future we need to add images with caption in the
                //buffer as well
                this.creates_listings(msg,venderget[0],"mixed")
            }
            else {
                //here add message buffer with type image
            }
        }
        else if (!imgcheck &&textcheck && textcheck.length > 0) {
            // step3:- check here in message buffer with the whatsapp number or id and check if the last message buffer is image.
            //1-> if the last isProcessed is falsed then ignore that message.
            //2->if the last message of that vendor is image then add text to it (after ai) and then create the listing from that data.
            //3->delete that messagebuffer.
        }

    }


  //need to add ai on this function
    public async creates_listings(msg:WhatsAppMessage,vinfo:Vendor,msg_type:msgtype)
    { 
         const gid=this.getgroupid(msg)

         const list:Listing={
            vendorId:vinfo.id,
            groupId: gid,
            groupName:await this.getgroupname(gid),
            rawMessage:msg,
            description:this.getdescription(msg),
            images: [""], 
            price: 0,//ai
            brand:"",//ai
            productType:"",//ai
            gender:"men",//ai
            size:"",//ai
            condition:"new",//ai
            viewCount:0,
            likeCount:0,
            messageCount:0,
            status:'active',//ai
            isWTB:true,//ai
        }

        this._rlist.create_listing(list)
        
        //now update the vendor

        const d={
               totalListings:vinfo.totalListings+1 ,
               messageTimestamp:msg.messageTimestamp  
         }
        await this._rvendor.updateVendor(vinfo.phoneNumber,d)
        console.log("listing created :-",list.description)




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



    private async extractVendorInfo(msg: any) {
        const isGroup = msg.key.remoteJid?.endsWith('@g.us')

        let vendorWhatsappId: string = ""
        let vendorPhoneNumber: string = ""
        let groupname: string = ""
        let groupid: string = ""
        let vendorName = msg.pushName || 'Unknown'
        if (isGroup) {
            groupid = this.getgroupid(msg);
            groupname = await this.getgroupname(groupid)
            vendorWhatsappId = msg.key.participant.split("@")[0]

            if (msg.key.participantAlt) {
                vendorPhoneNumber = msg.key.participantAlt.split(':')[0]
            }
        }
        const vdata={
            whatsappId:vendorWhatsappId,
            phoneNumber:vendorPhoneNumber,
            displayName:vendorName, 
            totalListings:0,
            avgRating:0,
            totalRatings:0,
            isBlocked:false, 
        }

        return {vdata,isGroup}
    }

    private getgroupid(msg:WhatsAppMessage)
    {
        return msg.key.remoteJid.split("@")[0];
    }

    private async getgroupname(groupid: string):Promise<string> {
        const cached = this.getGroupMetadata(groupid);
        if (cached) {
            return cached.groupName
        }
        const metadata = await this._sock.groupMetadata(groupid)
        const groupname = metadata?.subject;
        this.addGroupMetadata(groupid, groupname, Date.now())

        return groupname.toString()
    }
    
    private getdescription(msg:WhatsAppMessage)
    {
        return msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption
    }

    private addGroupMetadata(id: string, groupName: string, timestamp: number) {
        this.groupMetadataCache.set(id, { groupName, timestamp });
    }

    private getGroupMetadata(id: string) {
        return this.groupMetadataCache.get(id);
    }
}