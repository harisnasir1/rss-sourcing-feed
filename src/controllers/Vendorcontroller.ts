import { Request, Response } from "express";
import { vendorRepo } from "../repositories/vendors_repo";

export const getvendorphonenumber=async(req:Request,res:Response)=>{
    
    try{
        const vendorid:string=req.body.vendorid;
      
     if(!vendorid) throw Error("invalid vendroid")
         const re=  await vendorRepo.getvendornumber(vendorid)
       
          if(!re ) throw Error("somehting wrong while vendor info")
            return res.status(200).json({
              success: true,
              Number:re[0].phonenumber
             });
        }
        catch(e)
        {
            console.error("Something wron while fetching vendor phone number",e)
            return res.status(500).json({
              success: false,
              message: "Something wron while fetching vendor phone number",
             });
        }
}