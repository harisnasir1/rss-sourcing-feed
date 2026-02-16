import { Router } from "express";
import { getvendorphonenumber,ToogleVendorAccess,GetAllVendors } from "../controllers/Vendorcontroller";
import {authenticateJWT, isAdmin} from "../middleware/auth.middleware"
const router = Router();

router.post("/getnumber",authenticateJWT,getvendorphonenumber);
router.post("/toogleaccess",ToogleVendorAccess);
router.get("/getallvendors",authenticateJWT,isAdmin,GetAllVendors);

export default router