import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import allroutes from "./utils/all.routes";
import cors from 'cors'

//file imports 
import {query} from './utils/db_connection'
import {WhatsAppClient} from './services/whatsapp_services/whatsapp.service'
import "./cronjobs/bufferjobs"
const app = express();
const PORT = 4000;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
   'https://sourcing-feed-six.vercel.app',
   'https://ai-feed.resellersync.io',
    'http://localhost:5174'

];
app.use(cors({
  origin: (origin, callback) => {
   
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json());
app.get('/qr.png', (req, res) => {
  res.sendFile('qr.png', { root: '.' });
});
app.use("/api",allroutes)

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
try {
    let k=await query('SELECT NOW()');
    if(k){
    console.log('✅ PostgreSQL connected successfully');
    const whatsapp=new WhatsAppClient()
               try {
                await whatsapp.initialize();
                console.log('✅ WhatsApp initialized successfully');
            } catch (whatsappError) {
                console.error('❌ WhatsApp initialization failed:', whatsappError);
                console.log('⚠️ Server running but WhatsApp not connected');
                // Don't exit - server can still run
            }
   
  }
  } catch (err) {
     console.error('❌ Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
});