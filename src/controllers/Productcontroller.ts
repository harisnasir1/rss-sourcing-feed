import { Request, Response } from "express";
import { listing_repo } from "../repositories/listing_repo";
import { uuid } from "aws-sdk/clients/customerprofiles";
import { getListingSchema } from "../data_validation_schemas/Listing_validation";
const lr=new listing_repo()

export const getqrcode=()=>{
    
}
export const getlistings = async(req:Request , res:Response)=>{
  try {
    const parsed = getListingSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
    }
    const { wts, brand, search, page, limit } = parsed.data;
    const iswts = wts !== 'false';
    const offset = (page - 1) * limit;
    const k = await lr.getlisting(search, page, limit, offset, iswts, brand);
    res.status(200).json({ data: k })
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