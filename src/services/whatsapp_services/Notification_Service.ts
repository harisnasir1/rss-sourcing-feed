import { NotificationRepo } from "../../repositories/notification_repo";
import { wscontainer } from "../Container/ws_container";
import { Listing, Vendor } from "../../types/Data_types";
export class NotificationManager {

    private _notirepo: NotificationRepo | null = null;
    private _webhookurl: string | null = null;
    constructor() {
        this._notirepo = new NotificationRepo();
        if (process.env.WebHookurl) {
            this._webhookurl = process.env.WebHookurl;
        }
    }

    async SendWtsnotifications(vendor: Vendor, listing: Listing,) //jid is whatsappid in our db.
    {
        if (listing && listing.isWTS  && vendor.id && this._webhookurl) {
            await this._notirepo?.create(vendor.id);
            let wid = (vendor as any).whatsappid+ "@lid"
            console.log("notification get vendor:",vendor)
            var isincommuity = wscontainer.groupManager.isParticipant("120363295018117451@g.us", wid);
            if (isincommuity) {
                console.log(`this person with vendorid :${(vendor as any).phonenumber} is in RR community`)
            }
            else {
              
                const alreadySent = await this._notirepo?.isWtsSent((vendor as any).whatsappid)
                 if (alreadySent) {
                console.log("already sent")
                    return
                }
                  console.log(`sending webhook to  person with vendorid :${vendor.id}`)
               
                     try {
                    const res = await fetch(this._webhookurl!, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                             vendor: {
                               name: (vendor as any).displayname,
                               phone: (vendor as any).phonenumber
                             },
                             listing 
                           })
                       
                    })

                    if (res.ok) {
                        await this._notirepo?.markWtsSent((vendor as any).whatsappid)
                    } else {
                        console.error('Webhook failed:', res.status)
                    }
                } catch (err) {
                    console.error('Webhook error:', err)
                }
              
            }
        }
        else {
            console.log("something is not configured for notification to work")
            console.log("listing=>",listing)
            console.log("vendor:",vendor)
           
            console.log("webhookurl:",this._webhookurl);
        }
    }
}