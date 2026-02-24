import { Request, Response } from "express";
import {Monitored_Group_Repo} from '../repositories/MonitoredGroup_repo'
import { Grouppagination, GroupStatus } from "../data_validation_schemas/Group_validation";
const moint_group=new Monitored_Group_Repo();

export const getallgroups = async (req: Request, res: Response) => {
    try {
        const parsed=  Grouppagination.safeParse(req.query);
         if (!parsed.success) {
         return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
        }
        const {limit,page,search}=parsed.data;
        const offset=(page-1)*limit;

        const re=await moint_group.GetAllGroups(limit,offset,search);
        if(!re) 
         return res.status(500).json({ error: 'Failed to fetch groups' });

        return res.status(200).json({ success: true,
      data: re.data,
      total: re.total,
      active:re.active,
      blocked:re.inactive,
      page,
      limit,})

    }
    catch (error) {
      
          res.status(500).json(`❌ Failed to Get Group ${error}`)
    }
}

export const ToogleGroupStatus=async(req:Request,res:Response)=>{
    try{
        const parsed=GroupStatus.safeParse(req.body);
        if (!parsed.success) {
         return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
        }
        const {id,status}=parsed.data;

        const re=await moint_group.ChangeStatus(id,status);
       
        if(re==false) return  res.status(500).json({success:false,message:`❌ Failed to Get Group ${re}`})
          
      return  res.status(200).json( {success:true , message:"toogle sucessfull"} )
    }
     catch (error) {
      
          res.status(500).json({success:false,message:`❌ Failed to Get Group ${error}`})
    }
}