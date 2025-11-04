import { Request, Response } from "express";
import {usertype,SignupDto, LoginDto,status_update} from "../types/User_types"
import {userRepository} from "../repositories/users_repo"
import {generateToken} from "../utils/jwt" 
import { tooEarly } from "@hapi/boom";
export const getUsers =async (req: Request, res: Response) => {
  try{
 
    const users=await userRepository.findAll();
    if(users.length<=0)
    {
      throw Error("No users to fetch")
    }
    return res.status(200).json({
      success: true,
      users: users,
      count:users.length
    });
  }
  catch(e)
  {
    return res.status(500).json({
      success: false,
      message: 'error fetching users',
      count:0
    });
  }
};

export const login=async(req:Request , res:Response)=>{
 try
 {
  
  const udata:LoginDto=req.body;
 const user = await userRepository.login(udata);
        const token = generateToken({
      userId: user.id, // adjust based on what userRepository.login returns
      email: user.email,
      fullname: user.fullname
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {fullname:user.fullname , email:user.email},
      token:token
    });
 }
  catch(e)
  {  

   if (e instanceof Error && e.message === 'unauthorized')
  {
     return res.status(200).json({
      success: false,
      message: 'UnAuthorized'
    });
  }

   else {
     return res.status(200).json({
      success: false,
      message: 'Login unsuccessful'
    });}
  }
}

export const Signup=async(req:Request ,res:Response)=>{
  try{const udata:SignupDto=req.body;
    
 const user = await userRepository.signup(udata)
  const token = generateToken({
      userId: user.id, // adjust based on what userRepository.login returns
      email: user.email,
      fullname: user.fullname
    });
return res.status(200).json({
      success: true,
      message: 'Signup successful',
      data: {fullname:user.fullname , email:user.email},
      ghl:true,
      token:token
    });
}
  catch(e)
  {
   if (e instanceof Error && e.message === 'User with this email already exists')
    {
return res.status(409).json({
      success: false,
      message: e.message,
      ghl:true
    });
    }
    else if(e instanceof Error && e.message === 'User is not in ghl won stage')
    {
      return res.status(409).json({
      success: false,
      message: e.message,
      ghl:false
    });
    }
   
    else{
    console.warn("error in signup",e)
    return res.status(500).json({
      success: false,
      message: 'sign unsuccessful',
      ghl:true
    });}
  }
}


export const update_status=async(req:Request,res:Response)=>{
  try{

    const udata:status_update=req.body;
   
    const user=await userRepository.Change_active_status(udata.id,udata.is_active);

    if(!user)
    {
      return res.status(500).json({
      success: false,
      message: 'status update unsuccessful',
    });}
    
    return res.status(500).json({
      success: true,
      message: 'status updated successfully',
    });

  }
  catch(e)
  {
       console.warn("error in udating status",e)
    return res.status(500).json({
      success: false,
      message: 'status update unsuccessful',
    });}
  }
