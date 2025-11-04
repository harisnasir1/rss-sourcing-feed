import { Router } from "express";
import { getUsers,login,Signup,update_status } from "../controllers/user.controller";
import {authenticateJWT} from "../middleware/auth.middleware"
const router = Router();
router.get("/",authenticateJWT, getUsers);
router.post("/Register",Signup);
router.post("/Login",login);
router.post("/status_update",authenticateJWT,update_status)

export default router;
