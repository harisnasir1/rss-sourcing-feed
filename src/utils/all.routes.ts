import express from "express";
import userRoutes from "../routes/user.routes";
import productRoutes from "../routes/Product_routes"
const allroutes = express.Router();

allroutes.use("/users",userRoutes);
allroutes.use("/product",productRoutes)


export default allroutes
