import { Router } from "express";
import { getUsers,login,Signup,update_status,Forget_password } from "../controllers/user.controller";
import {authenticateJWT} from "../middleware/auth.middleware"
const router = Router();
router.get("/",authenticateJWT, getUsers);
router.post("/Register",Signup);
router.post("/Login",login);
router.post("/status_update",authenticateJWT,update_status)
router.post("/forgetpass",Forget_password)
export default router;