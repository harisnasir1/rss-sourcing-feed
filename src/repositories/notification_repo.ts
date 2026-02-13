import { query } from '../utils/db_connection';

export class NotificationRepo {

  async create(vendorId: string): Promise<boolean> {
    const result = await query(
      `INSERT INTO notifications (vendor_id)
       VALUES ($1)
       ON CONFLICT (vendor_id) DO NOTHING
       RETURNING id`,
      [vendorId]
    );
    return result.length > 0;
  }

  async markWtsSent(whatsappId: string): Promise<void> {
    await query(
      `UPDATE notifications n
       SET wts_sent = true, wts_sent_at = now(), updated_at = now()
       FROM "Vendor" v
       WHERE v.id = n.vendor_id AND v.whatsappid = $1`,
      [whatsappId]
    );
  }

  async isWtsSent(whatsappId: string): Promise<boolean> {
    const result = await query(
      `SELECT n.wts_sent FROM notifications n
       JOIN "Vendor" v ON v.id = n.vendor_id
       WHERE v.whatsappid = $1`,
      [whatsappId]
    );
    if (result.length === 0) return false;
    return result[0]?.wts_sent;
  }
}