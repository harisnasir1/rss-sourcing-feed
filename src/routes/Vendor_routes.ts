import { Router } from "express";
import { getvendorphonenumber } from "../controllers/Vendorcontroller";
const router = Router();

router.post("/getnumber",getvendorphonenumber);

export default router