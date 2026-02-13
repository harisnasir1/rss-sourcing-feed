import { Router } from "express";
import {getlistings,getproduct} from "../controllers/Productcontroller"

const router = Router();


router.get("/getlisting",getlistings)
router.get("/getproduct/:id",getproduct)
export default router;