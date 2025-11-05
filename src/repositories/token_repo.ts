import { query } from '../utils/db_connection';
import {forget_token} from "../types/User_types"
import bycrypt from "bcrypt"

 class Token_Repo{
    async getTokenByUserId(userid:string):Promise<forget_token|null>{
     let sql='Select * from forget_token where uid=$1';
     let params=[];
     params.push(userid);
     const toke= await query(sql,params)
     if(toke.length<1) return null
     return toke[0]
    }
    async updateusertoken(userid:string,token:string,expiresAt:Date):Promise<forget_token|null>{
        let sql='update forget_token SET token = $1 , expires_at =$2 where uid=$3 RETURNING *';
        let params=[];
        params.push(token);
        params.push(expiresAt);
         params.push(userid);
        const data=await query(sql,params);
        if(data.length<1) return null
        return data[0]
    }
  async createToken(userid: string, token: string, expiresAt: Date): Promise<forget_token | null> {
    const sql = `
      INSERT INTO forget_token (uid, token, expires_at) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const params = [userid, token, expiresAt];
    const data = await query(sql, params);
    
    if (data.length < 1) return null;
    return data[0];
  }
    async deleteToken(userid: string): Promise<boolean> {
    const sql = 'DELETE FROM forget_token WHERE uid = $1';
    const params = [userid];
    await query(sql, params);
    return true;
  }
  async validateToken(userid: string,token:string): Promise<boolean> {
  const sql = `
    SELECT * FROM forget_token 
    WHERE uid = $1 AND expires_at > CURRENT_TIMESTAMP
  `;
  const params = [userid];
  const result = await query(sql, params);
 
  if (result.length < 1) return false;
   let check=bycrypt.compare(token,result[0].token)
   if(!check) throw Error("Unauthrized")
  return true;
}

} 
export const token_repo=new Token_Repo()