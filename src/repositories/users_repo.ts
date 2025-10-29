import { query } from '../utils/db_connection';
import {SignupDto,LoginDto,usertype,SafeUser} from "../types/User_types"
import bcrypt from 'bcrypt';
export class UserRepository {
  private readonly SALT_ROUNDS=10;
  private readonly ghlkey=process.env.GHL_API_KEY


  async signup(dto: SignupDto): Promise<SafeUser> {
    let { fullname, email, password, role = 'member',have_site=0,have_stock=0,inventory_value='0' } = dto;
     email=email.toLowerCase().trim()
   
    const existingUser = await query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }
    const ghlcheck=await this.checkinghlwon(email)
    if(!ghlcheck)
     {
      throw new Error('User is not in ghl won stage');
    }
    
    
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    
   const sql = `
  INSERT INTO "User" (
    id, fullname, email, password,role,have_site,have_stock,inventory_value
  )
  VALUES (
    gen_random_uuid(), $1, $2, $3, $4,$5,$6,$7
  )
  RETURNING id, fullname, email, role, created_at, last_login;
`;

const values = [fullname, email, hashedPassword, role,have_site,have_stock,inventory_value];

const res = await query(sql, values);
return res[0];

  }

 
  async login(dto: LoginDto): Promise<SafeUser> {
    const { email, password } = dto;

    
    const User = await query(
      'SELECT * FROM "User" WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (User.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = User[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last_login
    await query(
      'UPDATE "User" SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  
  async findById(id: string): Promise<SafeUser | null> {
    const result = await query(
      `SELECT id, fullname, email, role, created_at, last_login
       FROM User
       WHERE id = $1`,
      [id]
    );

    return result[0] || null;
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const result = await query(
      `SELECT id, fullname, email, role, created_at, last_login
       FROM "User"
       WHERE email = $1`,
      [email]
    );

    return result[0] || null;
  }


  async findAll(): Promise<SafeUser[]> {
    const result = await query(
      `SELECT id, fullname, email, role, created_at, last_login
       FROM "User"
       ORDER BY created_at DESC`
    );

    return result;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await query(
      'UPDATE "User" SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
  }


  async updateProfile(userId: string, updates: Partial<Pick<usertype, 'fullname' | 'email'>>): Promise<SafeUser> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.fullname) {
      fields.push(`fullname = $${paramCount++}`);
      values.push(updates.fullname);
    }

    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);

    const result = await query(
      `UPDATE "User" 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, fullname, email, role, created_at, last_login`,
      values
    );

    if (result.length === 0) {
      throw new Error('User not found');
    }

    return result[0];
  }

  async delete(userId: string): Promise<void> {
    await query('DELETE FROM "User" WHERE id = $1', [userId]);
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const result = await query(
      'SELECT password FROM "User" WHERE id = $1',
      [userId]
    );
    
    if (result.length === 0) {
      return false;
    }

    return await bcrypt.compare(password, result[0].password);
  }


  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const isValid = await this.verifyPassword(userId, oldPassword);
    
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    await this.updatePassword(userId, newPassword);
  }

  private async checkinghlwon(email:string)
  {
     var url = "https://services.leadconnectorhq.com/opportunities/search"
    + "?location_id=0jUuoXuSJVQGki9cRwUx"
    + "&pipeline_id=xLLFc3s2wXBCu8Ms50eh"
    + "&pipeline_stage_id=00964150-abc3-4a57-923b-3799b165a06d"
    + `&q=${email}`
  
  var options = {
    method: "get",
    headers: {
      "Accept": "application/json",
      "Version": "2021-07-28",
      "Authorization":`Bearer ${this.ghlkey}`
        },
    muteHttpExceptions: true
  };

  var res =await fetch(url, options);
  const data=await res.json()
 
  if(data&&data.opportunities&&data.opportunities.length>0)
  {
   return 1
  }
  return 0 

  }
}


export const userRepository = new UserRepository();