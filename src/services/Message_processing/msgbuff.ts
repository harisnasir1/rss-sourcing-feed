
import {
    WAMessage
} from '@whiskeysockets/baileys';;
import { MessageBuffer,msgtype,Vendor } from "../../types/Data_types";
import { MessageBufferRepo } from '../../repositories/msgbuff_repo';
export class Message_Buffer{
    
    private _buffrepo:MessageBufferRepo;
    constructor()
    {
      this._buffrepo=new MessageBufferRepo()
    }
    public async addimagetobuffer(vinfo:Vendor,msg:WAMessage,groupname:string,buffertype:msgtype,img:string[])
    {
      console.log("getting in image to buffer class")
        if(!vinfo ||!vinfo.id || !msg || !groupname || !buffertype||!msg.key.remoteJid||!msg.messageTimestamp) return null;
        //first check if there is messagebuffer before using vendorid
          console.log("getting in image to buffer class passed first condition.")
          const pbuff=await this._buffrepo.getByVendorId(vinfo.id)
          console.log("getting buffer data=>",pbuff)
          if(pbuff && pbuff.id )
          {
             await this._buffrepo.appendImage(pbuff.id,img);
          }
          else{
            const mb:MessageBuffer={ 
               vendorId: vinfo.id,
               groupId:msg.key.remoteJid , 
               messageType: buffertype,
               description: "",
               images: img, 
               isProcessed:false,
               shouldCombine: true,
               whatsappMessageId: msg.key.id||"",
               whatsappTimestamp:new Date((Number(msg.messageTimestamp))*1000)||new Date()
             }
           await this._buffrepo.create(mb)
          }
          
        
    }
}