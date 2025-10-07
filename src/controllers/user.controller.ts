import { Request, Response } from "express";
import { getAllUsers } from "../services/user.services";

export const getUsers = (req: Request, res: Response) => {
  const users = getAllUsers();
  res.json(users);
};

export const login=(req:Request , res:Response)=>{

}

export const Signup=(req:Request ,res:Response)=>{

}
