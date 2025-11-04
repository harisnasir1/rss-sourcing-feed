import { Router } from "express";
import { getvendorphonenumber } from "../controllers/Vendorcontroller";
import {authenticateJWT} from "../middleware/auth.middleware"
const router = Router();

router.post("/getnumber",authenticateJWT,getvendorphonenumber);

export default router