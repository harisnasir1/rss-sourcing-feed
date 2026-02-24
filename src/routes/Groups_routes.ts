import { Router } from "express";
import {getallgroups,ToogleGroupStatus} from '../controllers/Groupcontroller'
const router = Router();

router.get("/getgroups",getallgroups)
router.post("/ToogleGroup",ToogleGroupStatus)
export default router;