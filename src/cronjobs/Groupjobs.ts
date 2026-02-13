const cron = require('node-cron');
import { wscontainer } from "../services/Container/ws_container";

let isRunning = false;

cron.schedule('0 * * * *', async () => {
  if (isRunning) {
    console.warn("⚠️ [Cron] Previous job still running. Skipping...");
    return;
  }
  if(! wscontainer.groupManager)
   {
    console.warn("⚠️ [Cron] Group Manager is not awake Yet. Skipping...");
    return;
   }
   if(!wscontainer.sock.user)
   {
     console.warn("⚠️ [Cron] Socket not connected. Skipping...");
     return;
   }
  isRunning = true;
  console.log("♻️ [Cron] Starting community cache refresh...");

  try {
    await wscontainer.groupManager.fetchAllGroups();
    console.log("✅ [Cron] Community cache refreshed successfully");
  } catch (err) {
    console.error("❌ [Cron] Error updating community subgroup cache:", err);
  } finally {
    isRunning = false;
  }
});
