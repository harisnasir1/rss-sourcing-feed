import  {
    WASocket
} from '@whiskeysockets/baileys';

export class Message_processing {

    private _sock: WASocket;
    private groupMetadataCache: Map<string, { groupName: string, timestamp: number }>;

    constructor(sock: WASocket) {
        this._sock = sock
        this.groupMetadataCache = new Map()
    }


    public async messageparser(msg: any) {
        //lets decide whiter it is image or text or mixed
        const venderifo = await this.extractVendorInfo(msg)
        if (venderifo.isGroup == false)
            return

        //step-1:- get simple image
        let imgcheck = msg.messages?.imageMessage;
        let textcheck = msg.message?.extendedTextMessage?.text
        if (imgcheck && !textcheck) {
            //Step 2:- check if there is caption or not

            if (imgcheck?.caption && imgcheck.caption.length > 0) {
                //instead of message buffer create actual listing becasue we have both image and text.implement ai on it
            }
            else {
                //here add message buffer with type image
            }
        }
        else if (!imgcheck && textcheck.length > 0) {
            // step3:- check here in message buffer with the whatsapp number or id and check if the last message buffer is image.
            //1-> if the last isProcessed is falsed then ignore that message.
            //2->if the last message of that vendor is image then add text to it (after ai) and then create the listing from that data.
            //3->delete that messagebuffer.
        }

    }


    













    private async extractVendorInfo(msg: any) {
        const isGroup = msg.key.remoteJid?.endsWith('@g.us')

        let vendorWhatsappId: string = ""
        let vendorPhoneNumber: string = ""
        let groupname: string = ""
        let groupid: string = ""
        if (isGroup) {
            groupid = msg.key.remoteJid.split("@")[0];
            groupname = await this.getgroupname(groupid)
            vendorWhatsappId = msg.key.participant || msg.key.participantAlt || ''

            if (msg.key.participantAlt) {
                vendorPhoneNumber = msg.key.participantAlt.split(':')[0]
            } else if (msg.key.participant) {
                vendorPhoneNumber = msg.key.participant.split('@')[0]
            }
        }

        return {
            vendorWhatsappId,
            vendorPhoneNumber,
            groupname,
            isGroup
        }
    }

    private async getgroupname(groupid: string) {
        const cached = this.getGroupMetadata(groupid);
        if (cached) {
            return cached.groupName
        }
        const metadata = await this._sock.groupMetadata(groupid)
        const groupname = metadata?.subject;
        this.addGroupMetadata(groupid, groupname, Date.now())

        return ""
    }


    private addGroupMetadata(id: string, groupName: string, timestamp: number) {
        this.groupMetadataCache.set(id, { groupName, timestamp });
    }

    private getGroupMetadata(id: string) {
        return this.groupMetadataCache.get(id);
    }
}