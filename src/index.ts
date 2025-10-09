import express from "express";
import allroutes from "./utils/all.routes";
import dotenv from 'dotenv';
dotenv.config();

//file imports 
import {query} from './utils/db_connection'
import {WhatsAppClient} from './services/whatsapp_services/whatsapp.service'
import {AI} from './services/AI_Services/Ai'
const app = express();
const PORT = 4000;
async function test()
{
  const ai=new AI()
  ai.extractProductInfo("BRAND NEW 2025 HERMES KELLY DEPECHE 25 AZELAN AVAILABLE TO ORDER NOW £7400")
}

app.use(express.json());
app.use("/api",allroutes)
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
try {
    let k=await query('SELECT NOW()');
    if(k){
    console.log('✅ PostgreSQL connected successfully');
    const whatsapp=new WhatsAppClient()
    await whatsapp.initialize()
   
  }
  } catch (err) {
    // console.error('❌ Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
});