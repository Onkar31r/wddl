import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
} from "../controllers/user.controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Secured routes
router.post("/logout",  logoutUser);
router.post("/change-password",  changeCurrentPassword);

export default router;
