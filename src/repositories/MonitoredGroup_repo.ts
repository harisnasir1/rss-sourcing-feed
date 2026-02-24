import { query } from '../utils/db_connection';
import { MonitoredGroup } from '../types/Data_types';
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

    public async GetGroup(groupid: string): Promise<boolean> {
        try {
            if (!groupid) return false;
            groupid = groupid.split('@')[0]
            let sql = `Select * From  "MonitoredGroup" WHERE whatsappgroupid =$1`
            const re = await query(sql, [groupid])

            if (!re || re.length == 0) return false;
            return true
        }
        catch (error) {
            console.error('❌ Failed to Get Group:', error);
            return false;
        }
    }
}