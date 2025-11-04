import { Router } from "express";
import { getUsers,login,Signup,update_status } from "../controllers/user.controller";

const router = Router();

router.get("/", getUsers);
router.post("/Register",Signup)
router.post("/Login",login)
router.post("/status_update",update_status)

export default router;
