import { query } from '../utils/db_connection';
import { Listing } from '../types/Data_types';
import { b2bquery } from '../utils/db_b2b_connection'
import { uuid } from 'aws-sdk/clients/customerprofiles';
import { resolveAliases } from '../utils/Brands'
export class listing_repo {

    public async create_listing(listing: Listing): Promise<Listing[]> {
        const sql = `
    INSERT INTO "Listing" (
      id, vendorid, groupid, groupname, rawmessage, description,
      images, price, currency, brand, producttype, gender, size,
      condition, viewcount, likecount, messagecount, status,
      iswtb,iswts, createdat, updatedat
    )
    VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,$21
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
            listing.isWTS ?? false,
            listing.createdAt ?? new Date(),
            listing.updatedAt ?? new Date(),
        ];
        const res = await query(sql, values);
        return res;
    }

    public async create_listing_b2b(listing: Listing, vinfo: any): Promise<boolean> {
        try {
            //console.log("MSSQl vin=>",vinfo)
            const sql = `
            INSERT INTO WAListing (
                Id,
                VendorPhoneNumber,
                VendorName,
                GroupName,
                RawMessage,
                Description,
                Images,
                Price,
                Currency,
                Brand,
                ProductType,
                Gender,
                Size,
                Condition,
                Status,
                IsWTB,
                IsWTS,
                CreatedAt,
                UpdatedAt
            )
            VALUES (
                NEWID(),
                @vendorPhone,
                @vendorName,
                @groupName,
                @rawMessage,
                @description,
                @images,
                @price,
                @currency,
                @brand,
                @productType,
                @gender,
                @size,
                @condition,
                @status,
                @isWTB,
                @isWTS,
                @createdAt,
                @updatedAt
            )
        `;

            // You'll need to get vendor phone and name from vendorId
            // Assuming you have a method to get vendor info
            // const vendorInfo = await this.getVendorInfo(listing.vendorId);

            const params = {
                vendorPhone: vinfo.phonenumber,
                vendorName: vinfo.displayname,
                groupName: listing.groupName,
                rawMessage: JSON.stringify(listing.rawMessage) || " ",
                description: listing.description || " ",
                images: JSON.stringify(listing.images), // Convert array to JSON string
                price: listing.price,
                currency: listing.currency || 'GBP',
                brand: listing.brand || "",
                productType: listing.productType || "",
                gender: listing.gender || "",
                size: listing.size || "",
                condition: listing.condition || "",
                status: listing.status || 'active',
                isWTB: listing.isWTB ? 1 : 0,
                isWTS: listing.isWTS ? 1 : 0,
                createdAt: listing.createdAt || new Date(),
                updatedAt: listing.updatedAt || new Date()
            };

            await b2bquery(sql, params);
            console.log('✅ Listing created in WAListings (B2B)');
            return true;

        } catch (error) {
            console.error('❌ Failed to create B2B listing:', error);
            return false;
        }
    }
    public async getlisting(searchTerm: string, page: number, limit: number, offset: number, iswts: boolean = true, brand: string = "") {


        try {
            let sql = `
            SELECT 
                l.id,
                l.vendorid AS "vendorId",
                l.groupid AS "groupId",
                l.groupname AS "groupName",
                l.description,
                l.images[1:1] AS images,
                l.price,
                l.brand,
                l.producttype AS "productType",
                l.gender,
                l.size,
                l.condition,
                l.status,
                l.createdat AS "createdAt",
                v.displayname AS "vendorName"
            FROM "Listing" l
            INNER JOIN "Vendor" v ON l.vendorid = v.id
            INNER JOIN "MonitoredGroup" m ON l.groupid=m.whatsappgroupid	
            WHERE l.status = 'active'  AND l.${iswts ? 'iswts' : 'iswtb'}=true AND v.isblocked=false AND m.isactive=True
            AND l.createdat > NOW() - INTERVAL '72 hours'
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
            if (brand.trim()) {
                const aliases = resolveAliases(brand);
                sql += `AND EXISTS(
              SELECT 1 FROM unnest($${params.length + 1}::text[]) AS alias
              Where similarity(l.brand,alias)>0.3
              )`
                params.push(aliases)
            }



            if (limit) {
                sql += ` ORDER BY l.createdat DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
                params.push(limit, offset);
            }
            else {
                sql += `ORDER BY l.createdat DESC`;
            }


            const result = await query(sql, params);

            return ({
                success: true,
                data: result,
                count: result.length
            });

        } catch (error) {
            console.error('Error fetching listings:', error);
        }

    }
    public async checkdublicate(des: string, vid: string): Promise<Boolean> {
        try {
            //console.log("description which they ", des)
            //console.log("vendor id ", vid)
            let sql = `
        SELECT COUNT(*)
        FROM "Listing"
        WHERE "status" = 'active'
          AND LOWER(TRIM("description")) = LOWER(TRIM($1))
          AND "vendorid" = $2
          AND "createdat" > NOW() - INTERVAL '10 minutes'
        `
            //createdat= > 11:07
            //now => 11:13
            //five min before now => 11:03  
            const params: any[] = [];
            params.push(des);
            params.push(vid)
            // console.log("params =>", params)
            const k = await query(sql, params);
            // console.log("dublicate query result", k)
            const count = parseInt(k[0].count, 10);
            return count > 0;
        }
        catch (e) {
            console.error('Error fetching listings:', e);
            return false
        }
    }
    public async getListingById(id: uuid) {
        try {

            const sql = `
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
                v.displayname AS "vendorName"
            FROM "Listing" l
            INNER JOIN "Vendor" v ON l.vendorid = v.id
            WHERE l.id = $1 
        `;

            const result = await query(sql, [id]);

            if (result.length === 0) {
                return { success: false, message: "Listing not found" };
            }

            return {
                success: true,
                data: result[0] // Return the single object, not an array
            };

        } catch (error) {
            console.error('Error fetching listing by ID:', error);
            throw error;
        }
    }
    public async Totallisting_per_group(groupid:string)
    {
        try{
            if(!groupid) return null
            let sql=`Select Count(*) FROM "Listing" WHERE groupid = $1`
            const re=await query(sql,[groupid]) 
            return re
        }
       catch (error) {
            console.error('Error fetching listing by ID:', error);
            throw error;
        }
    }
}