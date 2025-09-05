import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getDonorDonations,
  createDonorDonation,
  verifyDonorDonation,
  getStudents
} from "../controllers/donorUserController.js";
import { protect } from "../middleware/authMiddleware.js";

const donorUserRoutes = express.Router();

// donorUserRoutes.post("/auth/register", register);
donorUserRoutes.post("/auth/login", login);
donorUserRoutes.get("/auth/logout", logout);
donorUserRoutes.get("/auth/me", protect, getMe);
donorUserRoutes.put("/auth/updatedetails", protect, updateDetails);
donorUserRoutes.put("/auth/updatepassword", protect, updatePassword);
donorUserRoutes.post("/auth/forgotpassword", forgotPassword);
donorUserRoutes.put("/auth/resetpassword/:resettoken", resetPassword);
donorUserRoutes.get('/donations', protect, getDonorDonations);
donorUserRoutes.post("/donate/create", protect, createDonorDonation);
donorUserRoutes.post("/donate/verify", protect, verifyDonorDonation);
donorUserRoutes.get("/students", protect, getStudents);

export default donorUserRoutes;
