const cron = require('node-cron');
import { Message_Buffer } from "../services/Message_processing/msgbuff"; 

let msg_buff=new Message_Buffer();

// 🕒 Every 10 minutes: delete old unprocessed messages
cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('[Cron] Deleting old unprocessed messages...');
    const deletedCount = await msg_buff.deleteghostdata();
    console.log(`[Cron] Deleted ${deletedCount} old messages`);
  } catch (err) {
    console.error('[Cron] Error deleting old messages:', err);
  }
});