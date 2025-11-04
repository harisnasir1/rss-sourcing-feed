export type usertype={
    fullname:string,
    email:string,
    password:string,
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
export type status_update={
  id:string;
  is_active:boolean;
}
export type SafeUser = Omit<usertype, 'password'>;