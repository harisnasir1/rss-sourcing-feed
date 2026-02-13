import sql from 'mssql';

const config: sql.config = {
  user:  process.env.MS_DB_USER,
  password: process.env.MS_DB_PASSWORD,
  server:process.env.MS_DB_HOST || "",
  database:process.env.MS_DB_NAME,
  port:Number(process.env.MS_DB_PORT)||14233,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,                // ✔ .NET default
    trustServerCertificate: true, // ✔ same as .NET
    enableArithAbort: true,
  }
};



let db: sql.ConnectionPool | null = null;

async function getDB() {
  if (!db) {
    db = await sql.connect(config);
  }
  return db;
}


export async function b2bquery(text: string, params?: any) {
  const db = await getDB();
  const request = db.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  const result = await request.query(text);
  return result.recordset;
}