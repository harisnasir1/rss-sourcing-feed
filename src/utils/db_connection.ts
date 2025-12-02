
import { neon } from '@neondatabase/serverless';


const _sql = neon(process.env.DATABASE_URL!);

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  return _sql.query(text, params) as unknown as T[];
}