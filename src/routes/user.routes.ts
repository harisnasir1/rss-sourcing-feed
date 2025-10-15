import { Router } from "express";
import { getUsers,login,Signup } from "../controllers/user.controller";

const router = Router();

router.get("/", getUsers);
router.post("/Register",Signup)
router.post("/Login",login)

export default router;
