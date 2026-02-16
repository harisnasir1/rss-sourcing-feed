export type usertype={
    id:string,
    fullname:string,
    email:string,
    password:string,
    role:string,
    phone:string,
    is_active?:boolean
}
export type SignupDto = {
  fullname: string;
  email: string;
  password: string;
  role?: string;
  have_site?:boolean;
  have_stock?:boolean;
  phone:string,
  inventory_value?:string;
  is_active?:boolean;
}
export type LoginDto = {
  email: string;
  password: string;
}
export interface JwtPayload {
  userId: string;
  email: string;
  fullname: string;
  role:string;
}
export type status_update={
  id:string;
  is_active?:boolean;
  blocked?: boolean;
}
export type SafeUser = Omit<usertype, 'password'>;

export type forget_token={
  id:string,
  uid:string,
  token:string,
  created_at:Date,
  updated_at:Date,
  expires_at:Date,
}