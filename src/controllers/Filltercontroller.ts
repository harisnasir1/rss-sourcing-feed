import { Request, Response } from "express";
import { GetTrueBrands } from "../utils/Brands";
import { listing_repo } from "../repositories/listing_repo";

const lr=new listing_repo()
type brcache={
  brands:string[],
  expiry_time:Date,
}
let brand_promise:Promise<string[]>|null=null;
let brand_cache: brcache | null = null as brcache | null;

export const getAllBrands = async(req:Request , res:Response)=>{
  try {
    const currentCache = brand_cache;

    if (currentCache && currentCache.expiry_time > new Date()) {
      return res.status(200).json({ success: true, data: currentCache.brands });
    }

    if(brand_promise)
    {
      const brand=await brand_promise;
      return res.status(200).json({ success: true, data: brand });
    }


    brand_promise = new Promise(async(resolve,reject)=>{
    const brands = await lr.GetDistinctBrands();
    const brandStrings = (brands || []).map((item: { brand: string }) => item.brand);

    const ubrands = GetTrueBrands(brandStrings);
     if (!ubrands) return reject("somehting went wrong")
       brand_cache= {
        brands:ubrands as string[],
        expiry_time:new Date(new Date().setHours(new Date().getHours()+2))
    }
    resolve( ubrands);
    })
    try{
    const ubrands=await brand_promise;



     if (!ubrands) return res.status(500).json("somehitng is wrong")
   
 brand_promise=null
    res.status(200).json({ success: true, data: ubrands })
}
   catch(e)
  {
     brand_promise=null
      res.status(500).json("somehitng is wrong")
  }
  }
   catch(e)
  {
    brand_promise=null
      res.status(500).json("somehitng is wrong")
  }
}
