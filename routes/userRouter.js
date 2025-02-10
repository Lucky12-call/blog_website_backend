import express from "express";
import {
  getAllAuthors,
  getMyProfile,
  logIn,
  logOut,
  register,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", logIn);
router.get("/logout", isAuthenticated, logOut);
router.get("/my_profile", isAuthenticated, getMyProfile);
router.get("/authors", getAllAuthors);

export default router;