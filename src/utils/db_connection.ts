
import { Pool } from 'pg';


const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mydatabase',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT) || 5432,
   ssl: { rejectUnauthorized: false },
   max:10,
   idleTimeoutMillis:30000,
   connectionTimeoutMillis:10000,
});


export const query=async(text:string,params?: any[])=>{

  const client=await pool.connect();
  try{
    const res=await client.query(text,params);
    return res.rows;
  }
   catch (err) {
    console.error('❌ Query error:', err);
    throw err;
  } 
  finally{
    client.release();
  }
}
