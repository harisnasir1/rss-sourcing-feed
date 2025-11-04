import express from "express";
import userRoutes from "../routes/user.routes";
import productRoutes from "../routes/Product_routes"
import vendorRoutes from "../routes/Vendor_routes"
const allroutes = express.Router();

allroutes.use("/users",userRoutes);
allroutes.use("/product",productRoutes);
allroutes.use("/vendors",vendorRoutes)
export default allroutes
