import { Request, Response } from "express";
import { vendorRepo } from "../repositories/vendors_repo";
import { status_update } from '../types/User_types';
export const getvendorphonenumber = async (req: Request, res: Response) => {

  try {
    const vendorid: string = req.body.vendorid;

    if (!vendorid) throw Error("invalid vendroid")
    const re = await vendorRepo.getvendornumber(vendorid)

    if (!re) throw Error("somehting wrong while vendor info")
    return res.status(200).json({
      success: true,
      Number: re[0].phonenumber
    });
  }
  catch (e) {
    console.error("Something wron while fetching vendor phone number", e)
    return res.status(500).json({
      success: false,
      message: "Something wron while fetching vendor phone number",
    });
  }
}

export const GetAllVendors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string);
    const offset = (page - 1) * limit;
    console.log(limit, offset)
    const re = await vendorRepo.Gelallvendors(limit, offset);

    if (!re) throw Error("somehting wrong while vendors info")

    return res.status(200).json({
      success: true,
      vendors: re
    })

  }
  catch (e) {
    console.error("Something wron while fetching vendor phone number", e)
    return res.status(500).json({
      success: false,
      message: "Something wrong while fetching vendors information",
    });
  }
}

export const ToogleVendorAccess = async (req: Request, res: Response) => {
  try {
    const udata: status_update = req.body;
   
    if (!udata.id || !udata.is_active) {
      throw Error("somehting wrong with reuest data ")
    }

    const re = await vendorRepo.ToogleBlockVendor(udata.id, udata.is_active);

    if (!re) { throw Error("somehting wrong while vendors info") }

    return res.status(200).json({
      success: true,
      vendors: re
    })
  }
  catch (e) {
    console.error("Something wron while fetching vendor phone number", e)
    return res.status(500).json({
      success: false,
      message: "Something wrong while Toogling vendors Access",
    });
  }
}