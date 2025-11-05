import { query } from '../utils/db_connection';
import {SignupDto,LoginDto,usertype,SafeUser} from "../types/User_types"
import { token_repo } from './token_repo';
import bcrypt from 'bcrypt';
import crypto from "crypto"
import { email_service } from '../services/Email_Services/EmailService';
export class UserRepository {
  private readonly SALT_ROUNDS=10;
  private readonly ghlkey=process.env.GHL_API_KEY

  //auth logic

  async signup(dto: SignupDto): Promise<SafeUser> {
    let { fullname, email, password, role = 'member',have_site=0,have_stock=0,inventory_value='0',is_active=1 } = dto;
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

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    
   const sql = `
       INSERT INTO "User" (
         id, fullname, email, password,role,have_site,have_stock,inventory_value,is_active
       )
       VALUES (
         gen_random_uuid(), $1, $2, $3, $4,$5,$6,$7,$8
       )
       RETURNING id, fullname, email, role, created_at, last_login;
     `;
     const values = [fullname, email, hashedPassword, role,have_site,have_stock,inventory_value,0];
     
     const res = await query(sql, values);
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
      'SELECT id,email,password,role,created_at,fullname,is_active FROM "User" WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (User.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = User[0];
    if(!user.is_active)
    {
 throw new Error('unauthorized');
    }
  


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

  async Forget_pass_request(email:string){
    //check if user exists or not
    if(!email)throw Error("undefined id")
    const euser=await this.findByEmail(email);
    if(!euser) throw Error("Email does not exists")
    if(!euser.is_active) throw Error("UnAutharized")
    
    //check if token is there
    const userid=euser.id
    const token=crypto.randomBytes(32).toString('hex');

    const expires_at=new Date();
    expires_at.setHours(expires_at.getHours()+1);

    const existingtoken=await token_repo.getTokenByUserId(userid);

    let tokenrecord;
    const htoken=await this.hashtoken(token);
    if(existingtoken)
    {
      tokenrecord=await token_repo.updateusertoken(userid,htoken,expires_at);
    }
    else{
      tokenrecord=await token_repo.createToken(userid,htoken,expires_at);
    }
    const link=`${process.env.Client_Add}/reset-password?id=${userid}&token=${token}`
    if(!(await email_service.verifyConnection()))throw Error("Email service problem")
    await email_service.sendmail(euser.email,link,euser.fullname)
    return tokenrecord
  }

  async Forget_change_pass(userid:string,token:string,password:string):Promise<boolean>
  {
    //check if token is valid
   if(! await token_repo.validateToken(userid,token)) return false
     
   const k= await this.updatePassword(userid,password)
     if(!k) return false;
     token_repo.deleteToken(userid)
     return true
  }

   private async hashtoken(token:string){
    return await bcrypt.hash(token,4);
  }

  
  //users logic

  async findById(id: string): Promise<SafeUser | null> {
    
    const result = await query(
      `SELECT id, fullname, email, role, created_at, last_login
       FROM "User"
       WHERE id = $1`,
      [id]
    );
    

    return result[0] || null;
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const result = await query(
      `SELECT id, fullname, email, role,is_active, created_at, last_login
       FROM "User"
       WHERE email = $1`,
      [email]
    );

    return result[0] || null;
  }

  async findAll(): Promise<SafeUser[]> {
    const result = await query(
      `SELECT *
       FROM "User"
       ORDER BY created_at DESC`
    );

    return result;
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

   const data= await query(
      'UPDATE "User" SET password = $1 WHERE id = $2 RETURNING * ',
      [hashedPassword, userId]
    );
    if(data.length<1) return false

    return true;
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

  public async Change_active_status(userid:string,status:boolean)
  {
     if(!userid)
     {
      throw Error("User ID is required")
     }

    const re= await query(
      'SELECT id,email,password,role,created_at,fullname,is_active FROM "User" WHERE id = $1',
      [userid.trim()]
    );
    const user=re[0]
    

    if(!user)
    {
      throw Error("User not found")
    }
    if(user?.role=="admin")
    {
     throw Error("Cannot change the status of admin")
    }
        const values: any[] = [];
      values.push(status)
      values.push(userid)
   const result =  await query(
      `UPDATE "User" 
       SET is_active=$1
       WHERE id = $2
       RETURNING id, fullname, email, role, created_at, last_login`,
      values
    );
    if(!result || result.length<1)
    {
      throw Error("Failed to update user status");
    }
     
    return result[0]

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