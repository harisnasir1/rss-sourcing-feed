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
}

export type LoginDto = {
  email: string;
  password: string;
}
export type SafeUser = Omit<usertype, 'password'>;