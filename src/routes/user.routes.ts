import { Router } from "express";
import { getUsers,login,Signup,update_status,Forget_password,Forgetnewpassword } from "../controllers/user.controller";
import {authenticateJWT,isAdmin} from "../middleware/auth.middleware"
const router = Router();
router.get("/",authenticateJWT,isAdmin,getUsers);
router.post("/Register",Signup);
router.post("/Login",login);
router.post("/status_update",authenticateJWT,update_status)
router.post("/forgetpass",Forget_password)
router.post("/forget_new_pass",Forgetnewpassword)
export default router;