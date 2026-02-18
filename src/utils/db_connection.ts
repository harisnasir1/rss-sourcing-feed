import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

let queryFn: <T = any>(text: string, params?: any[]) => Promise<T[]>;

if (process.env.NODE_ENV === 'production') {
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1').then(() => console.log('DB pool warmed')).catch(console.error);
  
  queryFn = async <T>(text: string, params?: any[]) => {
    const result = await pool.query(text, params);
    return result.rows as T[];
  };
} else {
  const sql = neon(process.env.DATABASE_URL!);
  queryFn = async <T>(text: string, params?: any[]) => {
    const result = await sql.query(text, params);
    return result as T[];
  };
}

export const query = queryFn;