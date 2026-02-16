import { Request, Response } from "express";
import {usertype,SignupDto, LoginDto,status_update} from "../types/User_types"
import {userRepository} from "../repositories/users_repo"
import {generateToken} from "../utils/jwt" 
import { tooEarly } from "@hapi/boom";
export const getUsers =async (req: Request, res: Response) => {
  try{
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string);
     const search = (req.query.search as string) || '';
    const offset = (page - 1) * limit;
    const users=await userRepository.findAll(limit, offset,search);
    if(users.data.length<=0)
    {
      throw Error("No users to fetch")
    }
    return res.status(200).json({
       success: true,
      users: users.data,
      total: users.total,
      active:users.active,
      inactive:users.inactive,
      page,
      limit,
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
      userId: user.id, 
      email: user.email,
      fullname: user.fullname,
      role:user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {fullname:user.fullname , email:user.email,role:user.role},
      token:token
    });
 }
  catch(e)
  {  

   if (e instanceof Error && e.message === 'unauthorized')
  {
     return res.status(401).json({
      success: false,
      message: 'UnAuthorized'
    });
  }

   else {
    console.log("error on login:->",e instanceof Error &&e.message)
     return res.status(500).json({
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
      fullname: user.fullname,
      role:user.role
    });
return res.status(200).json({
      success: true,
      message: 'Signup successful',
      data: {fullname:user.fullname , email:user.email, role:user.role},
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
    else if(e instanceof Error && e.message === 'User is not a Member')
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
    if(!udata.id || udata.is_active===undefined) 
        return res.status(500).json({
      success: true,
      message: 'status updated successfully',
    });

   
    const user=await userRepository.Change_active_status(udata.id,udata.is_active);

    if(!user)
    {
      return res.status(200).json({
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

export const Forget_password=async(req:Request,res:Response)=>{
  try
  {
     const user=req.body;
     if(!user.email) throw Error("not getting email")
     const k= await userRepository.Forget_pass_request(user.email);
     return res.status(200).json({
      success:true,
     })
  }
  catch(e)
  {
    console.log("problem on forgetting password",e)
     if (e instanceof Error)
     {
    return res.status(500).json({
      success:false,
      message:e.message
    })
     }
 return res.status(500).json({
      success:false,
      message:"Unknown Error"
    })
  }
}

export const Forgetnewpassword=async(req:Request,res:Response)=>{
  try{
      const {id,token,newPassword}=req.body;
      if(!id||!token||!newPassword) return res.status(500).json({
        sucesss:false,
        message:"something wrong with forget password!"
      }) 

      const k=await userRepository.Forget_change_pass(id,token,newPassword);

      if(!k) throw Error();

      return res.status(200).json({
        sucesss:true,
        message:"password changed !"
      })
  }
  catch(e){
     if (e instanceof Error && e.message === 'unauthorized'){
           return res.send(401).json({
        sucesss:false,
        message:"UnAuthorized!"
      }) ;
     }
     return res.status(500).json({
        sucesss:false,
        message:"something wrong with forget password!"
      }) 
  }
}
