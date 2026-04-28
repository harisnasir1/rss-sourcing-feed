import { Pool } from 'pg';

// Initialize the pool using the individual environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test the connection immediately on startup
pool.query('SELECT 1')
  .then(() => console.log('Successfully connected to Postgres on', process.env.DB_HOST))
  .catch(err => {
    console.error('Database connection error details:');
    console.error('Host:', process.env.DB_HOST);
    console.error('User:', process.env.DB_USER);
    console.error('Error:', err.message);
  });

/**
 * Global query function
 */
export const query = async <T = any>(text: string, params?: any[]): Promise<T[]> => {
  const result = await pool.query(text, params);
  return result.rows as T[];
};