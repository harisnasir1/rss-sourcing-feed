import { query } from '../utils/db_connection';
import { Vendor } from '../types/Data_types';

export class VendorRepo {

  
  public async getVendorByName(vendorName: string): Promise<Vendor[]> {
    return await query(`SELECT * FROM "Vendor" WHERE displayname = $1`, [vendorName]);
  }

  
  public async getVendorById(id: string): Promise<Vendor[]> {
    return await query(`SELECT * FROM "Vendor" WHERE id = $1`, [id]);
  }

 
  public async getVendorByPhone(phone: string): Promise<Vendor[]> {
    console.log("phone number which its getting ->", phone)
    return await query(`SELECT * FROM "Vendor" WHERE phonenumber = $1`, [phone]);
  }

  
  public async createVendor(vendata: Vendor): Promise<Vendor[]> {
    await query(
      `INSERT INTO "Vendor" (
         whatsappid,
         phonenumber,
         displayname,
         totallistings,
         avgrating,
         totalratings,
         isblocked,
         lastmessageat,
         createdat,
         updatedat
       ) VALUES (
         $1, $2, $3, 0, 0, 0, false, NOW(), NOW(), NOW()
       )`,
      [
        vendata.whatsappId,
        vendata.phoneNumber,
        vendata.displayName
      ]
    );

    return await this.getVendorByPhone(vendata.phoneNumber);
  }

  public async updateVendor(phone: string, data:{totallistings:number,lastmessageat:Date}): Promise<Vendor[]> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
   
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'createdat') continue;
      fields.push(`"${key}" = $${idx}`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) return []; 
   
    fields.push(`"updatedat" = NOW()`);
    
    const sql = `UPDATE "Vendor" SET ${fields.join(', ')} WHERE phonenumber = $${idx}`;
    values.push(phone);

    console.log("update query ->",sql)


    await query(sql, values);

    return await this.getVendorByPhone(phone);
  }
}
