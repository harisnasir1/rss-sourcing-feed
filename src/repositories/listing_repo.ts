import { query } from '../utils/db_connection';
import { Listing } from '../types/Data_types';

export class listing_repo{

    public async create_listing(listing:Listing): Promise<Listing[]>
    {
     const sql = `
    INSERT INTO "Listing" (
      id, vendorid, groupid, groupname, rawmessage, description,
      images, price, currency, brand, producttype, gender, size,
      condition, viewcount, likecount, messagecount, status,
      iswtb, createdat, updatedat
    )
    VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )
    RETURNING *;
  `;
  const values = [
    listing.vendorId,
    listing.groupId,
    listing.groupName,
    listing.rawMessage,
    listing.description,
    listing.images,
    listing.price,
    listing.currency ?? 'GBP',
    listing.brand,
    listing.productType,
    listing.gender,
    listing.size,
    listing.condition,
    listing.viewCount ?? 0,
    listing.likeCount ?? 0,
    listing.messageCount ?? 0,
    listing.status,
    listing.isWTB ?? false,
    listing.createdAt ?? new Date(),
    listing.updatedAt ?? new Date(),
  ];
    const res = await query(sql, values);
  return res;
    } 
    public async getlisting(searchTerm:string,page:number,limit:number,offset:number)
    {
      
       try {
        let sql = `
            SELECT 
                l.id,
                l.vendorid AS "vendorId",
                l.groupid AS "groupId",
                l.groupname AS "groupName",
                l.description,
                l.images,
                l.price,
                l.brand,
                l.producttype AS "productType",
                l.gender,
                l.size,
                l.condition,
                l.status,
                l.createdat AS "createdAt",
                v.displayname AS "vendorName",
                v.phonenumber AS "vendorPhone"
            FROM "Listing" l
            INNER JOIN "Vendor" v ON l.vendorid = v.id
            WHERE l.status = 'active' 
            
        `;

        const params: any[] = [];

        
        if (searchTerm.trim()) {
            sql += ` AND (
                l.brand ILIKE $1 OR
                l.size ILIKE $1 OR
                l.producttype ILIKE $1 OR
                l.description ILIKE $1 OR
                v.displayname ILIKE $1
            )`;
            params.push(`%${searchTerm.trim()}%`);
        }

        
        sql += ` ORDER BY l.createdat DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        console.log(sql)

        const result = await query(sql, params);

       return({
            success: true,
            data: result,
            count: result.length
        });

    } catch (error) {
        console.error('Error fetching listings:', error);
    }

    }
}