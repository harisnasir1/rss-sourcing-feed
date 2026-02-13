import { Request, Response } from "express";
import { listing_repo } from "../repositories/listing_repo";
import { uuid } from "aws-sdk/clients/customerprofiles";

const lr=new listing_repo()

export const getqrcode=()=>{
    
}
export const getlistings = async(req:Request , res:Response)=>{
  try{
      const searchTerm = req.query.search as string || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string);
        const offset = (page - 1) * limit;
       const k=  await  lr.getlisting(searchTerm,page,limit,offset);
       res.status(200).json({data:k})
  }
  catch(e)
  {
      res.status(500).json("somehitng is wrong")
  }
}

export const getproduct = async(req:Request , res:Response)=>{
  try{
     const { id } = req.params;
      if(!id )
      {   res.status(500).json("somehitng is wrong")
        return
      }
       const k=  await  lr.getListingById(id);
      
       res.status(200).json({data:k})
  }
  catch(e)
  {
      res.status(500).json("somehitng is wrong")
  }
}