import express from "express";
import {
  createDonation,
  getAllDonations,
  getOneDonation,
  verifyPayment,
} from "../controllers/donationController.js";

const donationRoutes = express.Router();

donationRoutes.get("/getAllDonationDetails", getAllDonations);
donationRoutes.get("/getOneDonation/:id", getOneDonation);
donationRoutes.post("/create-donation", createDonation);

// Verify payment and create donation
donationRoutes.post("/verify-payment", verifyPayment);

export default donationRoutes;
