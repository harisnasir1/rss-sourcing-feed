import { Router } from "express";
import {getlistings, getqrcode} from "../controllers/Productcontroller"

const router = Router();


router.get("/getlisting",getlistings)
export default router;