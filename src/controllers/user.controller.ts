import { Request, Response } from "express";
import {usertype,SignupDto, LoginDto} from "../types/User_types"
import {userRepository} from "../repositories/users_repo"

export const getUsers = (req: Request, res: Response) => {

};

export const login=async(req:Request , res:Response)=>{
 try
 {
  const udata:LoginDto=req.body;
 const user = await userRepository.login(udata);
    

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user
    });
 }
  catch(e)
  {
    console.warn("error in login",e)
     return res.status(200).json({
      success: true,
      message: 'Login unsuccessful',
    });
  }
}

export const Signup=async(req:Request ,res:Response)=>{
  try{const udata:SignupDto=req.body;
    console.log(udata)
 const user = await userRepository.signup(udata)
return res.status(200).json({
      success: true,
      message: 'Login successful',
    });
}
  catch(e)
  {
    console.warn("error in signup",e)
    return res.status(500).json({
      success: true,
      message: 'sign unsuccessful',
    });
  }
}
