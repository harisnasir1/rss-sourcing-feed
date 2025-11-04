export type usertype={
    id:string,
    fullname:string,
    email:string,
    password:string,
    role:string
}
export type SignupDto = {
  fullname: string;
  email: string;
  password: string;
  role?: string;
  have_site?:boolean;
  have_stock?:boolean;
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
  is_active:boolean;
}
export type SafeUser = Omit<usertype, 'password'>;