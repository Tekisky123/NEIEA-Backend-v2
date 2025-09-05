import DonorUser from "../models/DonorUser.js";
import ErrorResponse from "../utils/errorResponse.js";
import sendEmail from "../services/emailService.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Donation from "../models/Donation.js";
import Razorpay from "razorpay";
import sendDonationEmail from "../services/emailService.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// @desc    Register donor user
// @route   POST /api/v1/donor/auth/register
// @access  Public

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, donorType } = req.body;

    // Create user
    const user = await DonorUser.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      donorType,
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(
        new ErrorResponse("Please provide an email and password", 400)
      );
    }

    // Check for user
    const user = await DonorUser.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Send token response
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    // Set cookie options
    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Send response
    res
      .status(200)
      .cookie("token", token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          donorType: user.donorType,
        },
      });
  } catch (err) {
    console.error("Login error:", err);
    next(new ErrorResponse("Server error during login", 500));
  }
};

// @desc    Logout donor user / clear cookie
// @route   GET /api/v1/donor/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Get current logged in donor user
// @route   GET /api/v1/donor/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await DonorUser.findById(req.user.id).populate("donations");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update donor user details
// @route   PUT /api/v1/donor/auth/updatedetails
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
    };

    const user = await DonorUser.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/v1/donor/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const user = await DonorUser.findById(req.user.id).select("+password");

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse("Password is incorrect", 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password
// @route   POST /api/v1/donor/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await DonorUser.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse("There is no user with that email", 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/donor/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      });

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password
// @route   PUT /api/v1/donor/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await DonorUser.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid token", 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all donor users (Admin)
// @route   GET /api/v1/donor/users
// @access  Private/Admin
export const getDonorUsers = async (req, res, next) => {
  try {
    res.status(200).json(res.advancedResults);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single donor user (Admin)
// @route   GET /api/v1/donor/users/:id
// @access  Private/Admin
export const getDonorUser = async (req, res, next) => {
  try {
    const user = await DonorUser.findById(req.params.id).populate("donations");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create donor user (Admin)
// @route   POST /api/v1/donor/users
// @access  Private/Admin
export const createDonorUser = async (req, res, next) => {
  try {
    const user = await DonorUser.create(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update donor user (Admin)
// @route   PUT /api/v1/donor/users/:id
// @access  Private/Admin
export const updateDonorUser = async (req, res, next) => {
  try {
    const user = await DonorUser.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete donor user (Admin)
// @route   DELETE /api/v1/donor/users/:id
// @access  Private/Admin
export const deleteDonorUser = async (req, res, next) => {
  try {
    await DonorUser.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        donorType: user.donorType,
      },
    });
};

export const getDonorDonations = async (req, res, next) => {
  try {
    // The donor's ID is available from req.user.id (set by auth middleware)
    const donations = await Donation.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .select("-razorpaySignature -__v"); // Exclude sensitive/uneeded fields

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    next(new ErrorResponse("Failed to fetch donations", 500));
  }
};

export const createDonorDonation = async (req, res, next) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;
    const userId = req.user.id;

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Store the order details temporarily in the session or return it to the client
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

export const verifyDonorDonation = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, donationData } = req.body;

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

    // Fetch donor details
    const donor = await DonorUser.findById(req.user.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // Use donor's existing donorType and frequency if available
    const donorType = donor.donorType || donationData.donorType || "Regular";
    const frequency = donationData.frequency || "once";

    // Create a new donation record with donor details
    const donation = new Donation({
      firstName: donor.firstName,
      lastName: donor.lastName,
      email: donor.email,
      phone: donor.phone,
      address: donor.address || 'N/A',
      city: donor.city || 'N/A',
      state: donor.state || 'N/A',
      zipCode: donor.zipCode || 'N/A',
      country: donor.country || 'N/A',
      amount: donationData.amount,
      donorType,
      frequency,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isVerified: true,
      userId: req.user.id,
    });

    await donation.save();

    // Add the donation to the user's donations array
    await DonorUser.findByIdAndUpdate(req.user.id, {
      $push: { donations: donation._id },
    });

    // Send confirmation emails
    await sendDonationEmail({
      type: "donation",
      data: donation,
    });

    await sendDonationEmail({
      type: "admin",
      data: donation,
    });

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


export const getStudents = async (req, res, next) => {
  try {
    const donorId = req.user.id;

    if (!donorId) {
      return next(new ErrorResponse("Unauthorized: No donor ID found", 401));
    }

    // Find donor and populate students
    const donor = await DonorUser.findById(donorId).populate({
      path: "students",
      model: "Student",
      select: "-__v", 
    });

    if (!donor) {
      return next(new ErrorResponse("Donor not found", 404));
    }

    res.status(200).json({
      success: true,
      data: donor.students || [],
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    next(new ErrorResponse("Server error while fetching students", 500));
  }
};