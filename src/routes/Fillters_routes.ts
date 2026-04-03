import { Router } from "express";
import { getAllBrands } from "../controllers/Filltercontroller";
import {authenticateJWT} from "../middleware/auth.middleware"
const router = Router();

router.get("/brands",authenticateJWT,getAllBrands);
router.get("/portal/brands",getAllBrands);


export default router;