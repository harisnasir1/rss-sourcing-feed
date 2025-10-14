import { query } from "../utils/db_connection";
import { MessageBuffer } from "../types/Data_types";

export class MessageBufferRepo {
  // ✅ Create a new message buffer record
  public async create(buffer: MessageBuffer): Promise<MessageBuffer | null> {
    const sql = `
      INSERT INTO "MessageBuffer" (
        id, vendorid, groupid, messagetype, description, images,
        isprocessed, shouldcombine, whatsappmessageid, whatsapptimestamp, createdat
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
      RETURNING *;
    `;

    const values = [
      buffer.vendorId ?? null,
      buffer.groupId ?? null,
      buffer.messageType ?? null,
      buffer.description ?? null,
      buffer.images ?? [],
      buffer.isProcessed ?? false,
      buffer.shouldCombine ?? true,
      buffer.whatsappMessageId ?? null,
      buffer.whatsappTimestamp ?? null,
    ];

    const res = await query(sql, values);
    return res.length > 0 ? res[0] : null;
  }

  // ✅ Get by ID
  public async getById(id: string): Promise<MessageBuffer | null> {
    const sql = `SELECT * FROM "MessageBuffer" WHERE id = $1`;
    const res = await query(sql, [id]);
    return res.length > 0 ? res[0] : null;
  }
  
  public async getByVendorId(id: string,groupid:string): Promise<MessageBuffer | null> {
    const sql = `SELECT * FROM "MessageBuffer" WHERE vendorid = $1 AND groupid=$2 AND shouldcombine = true AND isprocessed =false`;
    const res = await query(sql, [id,groupid]);
    return res.length > 0 ? res[0] : null;
  }


  public async getUnprocessed(limit = 50): Promise<MessageBuffer[]> {
    const sql = `
      SELECT * FROM "MessageBuffer"
      WHERE isprocessed = false
      ORDER BY createdat ASC
      LIMIT $1
    `;
    return await query(sql, [limit]);
  }


  public async update(id: string, fields: Partial<MessageBuffer>): Promise<MessageBuffer | null> {
    const keys = Object.keys(fields);
    if (keys.length === 0) return await this.getById(id);

    const setClause = keys
      .map((key, i) => `"${this.toSnakeCase(key)}" = $${i + 2}`)
      .join(", ");

    const sql = `
      UPDATE "MessageBuffer"
      SET ${setClause}, createdat = createdat
      WHERE id = $1
      RETURNING *;
    `;

    const values = [id, ...Object.values(fields)];
    const res = await query(sql, values);
    return res.length > 0 ? res[0] : null;
  }

  // ✅ Delete by ID
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "MessageBuffer" WHERE id = $1`;
    const res = await query(sql, [id]);
    return res.length > 0;
  }

 
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  
  public async appendImage(id: string, imageUrl: string[]): Promise<any> {
  try {
    const queryText = `
      UPDATE "MessageBuffer"
      SET images = array_append(images, $1)
      WHERE id = $2
      RETURNING *;
    `;
    const result = await query(queryText, [imageUrl, id]);
    return result[0];
  } catch (error) {
    console.error("Error appending image to MessageBuffer:", error);
    throw error;
  }
}
public async appendtext(id: string, desc: string): Promise<MessageBuffer> {
  try {
    const queryText = `
      UPDATE "MessageBuffer"
      SET description = $1 , shouldcombine =false , isprocessed =true 
      WHERE id = $2
      RETURNING *;
    `;
    const result = await query(queryText, [desc, id]);
    return result[0];
  } catch (error) {
    console.error("Error appending image to MessageBuffer:", error);
    throw error;
  }
}

  public async deleteOldUnprocessed(): Promise<void> {
    const sql = `
      DELETE FROM "MessageBuffer"
      WHERE  shouldcombine = false
        AND whatsapptimestamp < NOW() - INTERVAL '10 minutes'
    `;
    try {
      await query(sql);
      console.log("🧹 Old unprocessed messages cleaned up from MessageBuffer");
    } catch (error) {
      console.error("❌ Error cleaning MessageBuffer:", error);
    }
  }
}
