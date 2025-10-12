
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
      try  {  console.log("getting in image to buffer class")
          if(!vinfo ||!vinfo.id || !msg || !groupname || !buffertype||!msg.key.remoteJid||!msg.messageTimestamp) return null;
          //first check if there is messagebuffer before using vendorid
          console.log("getting in image to buffer class passed first condition.")
          const pbuff=await this._buffrepo.getByVendorId(vinfo.id,msg.key.remoteJid)
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
          }}
          catch(e)
          {
            console.log("error while processing message buffer-> image: ->",e)
          }
    }

    public async addtexttobuffer(vinfo:Vendor,msg:WAMessage,buffertype:msgtype,desc:string)
    {
         try{ 
          if(!vinfo ||!vinfo.id || !msg || !buffertype||!msg.key.remoteJid||!msg.messageTimestamp) return null;
            console.log("getting in image to buffer class passed first condition.")
            const pbuff=await this._buffrepo.getByVendorId(vinfo.id,msg.key.remoteJid)
            console.log("getting buffer data=>",pbuff)
          if(pbuff && pbuff.id )
          {
            const k:MessageBuffer= await this._buffrepo.appendtext(pbuff.id,desc);
            if(!k) return null
            return k
          }}
          catch(e)
          {
            console.log("error while processing message buffer-> text: ->",e)
          }
    }
    
    public async deleteghostdata()
    {
      await this._buffrepo.deleteOldUnprocessed()
    }
}