import express from "express";
import allroutes from "./utils/all.routes";
import dotenv from 'dotenv';
dotenv.config();

//exports 
import {query} from './utils/db_connection'

const app = express();
const PORT = 4000;

app.use(express.json());
app.use("/api",allroutes)
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
try {
    await query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully');
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
});
