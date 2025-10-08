import { query } from '../utils/db_connection';
import { Listing } from '../types/Data_types';

export class listing_repo{

    public async create_listing(listing:Listing): Promise<Listing[]>
    {
     const sql = `
    INSERT INTO listing (
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
    
}