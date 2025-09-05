import Donation from "../models/Donation.js";
import sendDonationEmail from "../services/emailService.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import DonorUser from "../models/DonorUser.js";
import donorAccountTemplate from "../templates/donorAccountTemplate.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createDonation = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt,
      notes,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      donationData,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const donation = new Donation({
      ...donationData,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isVerified: true,
    });

    await donation.save();

    // if (donation.frequency === "once") {
    //   await sendDonationEmail({
    //     type: "donation",
    //     data: donation,
    //   });

    //   await sendDonationEmail({
    //     type: "admin",
    //     data: donation,
    //   });
    // } else {
    let user = await DonorUser.findOne({ email: donation.email });
    const password = donation.firstName;

    if (!user) {
      user = new DonorUser({
        firstName: donation.firstName,
        lastName: donation.lastName,
        email: donation.email,
        phone: donation.phone,
        password: password,
        donorType: donation.donorType || "Regular",
      });

      await user.save();
    }

    donation.userId = user._id;
    await donation.save();

    user.donations.push(donation._id);
    await user.save();

    if (user.donorType == "Regular" && donation.frequency == "once") {
      await sendDonationEmail({
        type: "admin",
        data: donation,
      });
    } else {
      await sendDonationEmail({
        type: "account",
        data: donation,
        password,
      });

      await sendDonationEmail({
        type: "admin",
        data: donation,
      });
    }

    // }

    res.status(201).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

export const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }
    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation",
    });
  }
};

export const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find();
    res.status(200).json({ success: true, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOneDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }
    res.status(200).json({ success: true, data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
