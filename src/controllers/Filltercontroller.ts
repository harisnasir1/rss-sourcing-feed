import { Request, Response } from "express";
import { GetTrueBrands } from "../utils/Brands";
import { listing_repo } from "../repositories/listing_repo";

const lr=new listing_repo()
export const getAllBrands = async(req:Request , res:Response)=>{
  try {

     const brands=await lr.GetDistinctBrands();
     const brandStrings = (brands || []).map((item: { brand: string }) => item.brand);
    
     const ubrands=GetTrueBrands(brandStrings);
    
     if(! ubrands) return res.status(500).json("somehitng is wrong")

        res.status(200).json({success:true,data:ubrands})

  }
   catch(e)
  {
      res.status(500).json("somehitng is wrong")
  }
}
