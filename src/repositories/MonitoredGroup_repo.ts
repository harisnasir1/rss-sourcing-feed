import { query } from '../utils/db_connection';
import { MonitoredGroup  } from '../types/Data_types';
export interface GroupsResponse {
    data: MonitoredGroup[];
    total: number;
    active: number;
    inactive: number;
}
export class Monitored_Group_Repo {


    public async CreateGroup(group: MonitoredGroup) {
        try {
           
            let sql = `Insert INTO "MonitoredGroup"(
                id,whatsappgroupid,groupname,isactive,totallistings,lastmessageat,createdat,updatedat)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
                 RETURNING *; `

            const values = [
                group.whatsappgroupid,
                group.groupname,
                group.isactive,
                group.totallistings,
                new Date(),
                new Date(),
                new Date()
            ]
            let re = await query(sql, values)
            return re;
        }
        catch (error) {
            console.error('❌ Failed to create Group:', error);
            return false;
        }

    }
    public async UpsertGroup(groupid: string, groupname: string) {
        try {
            if (!groupid || !groupname) {
                console.error('❌ UpsertGroup: missing groupid or groupname');
                return null;
            }
            let sql = `INSERT INTO "MonitoredGroup" (whatsappgroupid, groupname, isactive, totallistings, lastmessageat, createdat, updatedat)
               VALUES ($1, $2, true, 1, now(), now(), now())
               ON CONFLICT (whatsappgroupid) 
               DO UPDATE SET totallistings = "MonitoredGroup".totallistings + 1, lastmessageat = now(), updatedat = now() Returning *`
            return await query(sql, [groupid, groupname]);
        } catch (error) {
            console.error('❌ Failed to upsert group:', error);
            return null;
        }
    }

    public async UpdateGroupName(groupid: string, groupname: string) {
        try {
            if (!groupid) return null;
            let sql = `Update  "MonitoredGroup" SET groupname=$1 WHERE whatsappgroupid =$2`
            return await query(sql, [groupname, groupid])

        }
        catch (error) {
            console.error('❌ Failed to Update Group:', error);
            return null;
        }
    }
    public async UpdateGroup(groupid: string) {
        try {
            if (!groupid) return false;
            let sql = `Update  "MonitoredGroup" SET totallistings=totallistings+1, lastmessageat = now(), updatedat = now() WHERE whatsappgroupid =$1`
            return await query(sql, [groupid])

        }
        catch (error) {
            console.error('❌ Failed to Update Group Name:', error);
            return false;
        }
    }

    public async GetGroup(groupid: string): Promise<boolean|null> {
        try {
            if (!groupid) return false;
            groupid = groupid.split('@')[0]
            let sql = `Select * From  "MonitoredGroup" WHERE whatsappgroupid =$1`
            const re = await query(sql, [groupid])

            if (!re || re.length === 0) return false;
            return true
        }
        catch (error) {
            console.error('❌ Failed to Get Group:', error);
            return null;
        }
    }

public async GetAllGroups(limit: number, offset: number, searchTerm: string): Promise<GroupsResponse | null> {
    try {
        let sql = `SELECT * FROM "MonitoredGroup"`;
        const params: any[] = [];

        // 1. Build Data Query
        if (searchTerm && searchTerm.trim()) {
            sql += ` WHERE groupname ILIKE $1`;
            params.push(`%${searchTerm.trim()}%`);
        }

        sql += ` ORDER BY totallistings DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const re = await query(sql, params);
        if (!re) throw new Error("Query failed");

        // 2. Build Count Query
        // Using WHERE 1=1 makes appending AND conditions much easier
        let countSql = `
            SELECT 
                COUNT(*)::INT as total,
                COUNT(*) FILTER (WHERE isactive = true)::INT as active,
                COUNT(*) FILTER (WHERE isactive = false)::INT as inactive
            FROM "MonitoredGroup"
            WHERE 1=1`;
            
        const countParams: any[] = [];
        if (searchTerm && searchTerm.trim()) {
            countSql += ` AND groupname ILIKE $1`;
            countParams.push(`%${searchTerm.trim()}%`);
        }

        const countResult = await query(countSql, countParams);
        
        // Postgres returns counts as strings/bigint, cast them or use ::INT in SQL
        const { total, active, inactive } = countResult[0];

        return { 
            data: re, 
            total: total || 0, 
            active: active || 0, 
            inactive: inactive || 0 
        };
    } catch (error) {
        console.error('❌ Failed to Get Groups:', error);
        return null;
    }
}

    public async ChangeStatus(mgroudid: string, status: boolean) {
        try {
            let sql = `
            UPDATE "MonitoredGroup" mg
            SET isactive = $1
            WHERE mg.id = $2
            Returning *
            `
           let k= await query(sql,[status,mgroudid])
           if(!k || k.length===0){
            return false;}
        
           return true
        }
        catch (error) {
            console.error('❌ Failed to Get Group:', error);
            return false;
        }
    }
}