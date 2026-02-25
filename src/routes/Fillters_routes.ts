import { Router } from "express";
import { getAllBrands } from "../controllers/Filltercontroller";
import {authenticateJWT} from "../middleware/auth.middleware"
const router = Router();

router.get("/brands",getAllBrands);


export default router;