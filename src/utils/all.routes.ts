import express from "express";
import userRoutes from "../routes/user.routes";

const allroutes = express.Router();

allroutes.use("/users",userRoutes);



export default allroutes
