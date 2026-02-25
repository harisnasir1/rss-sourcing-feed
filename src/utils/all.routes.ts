import express from "express";
import userRoutes from "../routes/user.routes";
import productRoutes from "../routes/Product_routes"
import vendorRoutes from "../routes/Vendor_routes"
import GroupRoutes from "../routes/Groups_routes"
import FillterRoutes from "../routes/Fillters_routes"
const allroutes = express.Router();

allroutes.use("/users",userRoutes);
allroutes.use("/product",productRoutes);
allroutes.use("/vendors",vendorRoutes);
allroutes.use("/groups",GroupRoutes);
allroutes.use("/fillters",FillterRoutes);
export default allroutes
