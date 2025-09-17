import Course from "../models/Course.js";
import Applicant from "../models/Applicant.js";
import validator from 'validator';
import Institution from "../models/Institution.js";
import ReferredBy from "../models/ReferredBy.js";
import Razorpay from "razorpay";
import crypto from "crypto";


export const getAllCoursesPublic = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("-applicants");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const applyToCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      phone,
      motherTongue,
      age,
      gender,
      isStudent,
      classStudying,
      state,
      city,
      whatsappNumber,
      referredBy,
      convenientTimeSlot,
      message
    } = req.body;

    // Basic validation for required fields
    if (
      !fullName || !email || !phone || !motherTongue || !age || !gender ||
      !isStudent || !state || !city || !whatsappNumber || !referredBy ||
      !convenientTimeSlot
    ) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email." });
    }

    // Validate phone number format
    if (!validator.isMobilePhone(phone)) {
      return res.status(400).json({ message: "Please provide a valid phone number." });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found or inactive" });
    }

    // Save application with all fields
    const applicant = new Applicant({
      course: course._id,
      fullName,
      email,
      phone,
      motherTongue,
      age,
      gender,
      isStudent,
      classStudying: isStudent === "Yes" ? classStudying : undefined,
      state,
      city,
      whatsappNumber,
      referredBy,
      convenientTimeSlot,
      message: message || "",
    });

    await applicant.save();

    // Optionally, push applicant to course.applicants array
    course.applicants.push(applicant._id);
    await course.save();

    res.status(201).json({ message: "Application submitted successfully", applicant });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({ message: "You have already applied to this course." });
    }
    res.status(500).json({ message: error.message });
  }
};

export const InstitutionApplyToCourse = async (req, res) => {
  try {

    // Files
    // req.files.studentList[0] and req.files.institutionLogo[0]
    const studentListFile = req.files.studentList ? req.files.studentList[0] : null;
    const institutionLogoFile = req.files.institutionLogo ? req.files.institutionLogo[0] : null;

    // S3 URLs
    const studentListUrl = studentListFile ? studentListFile.location : null;
    const institutionLogoUrl = institutionLogoFile ? institutionLogoFile.location : null;

    const {
      email,
      institutionName,
      howDidYouFindUs,
      referredBy,
      coordinatorName,
      coordinatorContactNumber1,
      coordinatorEmail,
      state,
      city,
      address,
      numberOfStudents,
      startMonth,
      suitableTime,
      courseIds // Array of course ObjectIds
    } = req.body;

    // Basic validation for required fields
    if (
      !email || !institutionName || !coordinatorName || !coordinatorContactNumber1 || !coordinatorEmail ||
      !address || !state || !city || !numberOfStudents || !startMonth || !suitableTime || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0
    ) {
      return res.status(400).json({ message: "All required fields must be filled, including at least one course." });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email." });
    }

    // Validate phone number format
    if (!validator.isMobilePhone(coordinatorContactNumber1)) {
      return res.status(400).json({ message: "Please provide a valid phone number." });
    }

    // Check all courseIds exist
    const foundCourses = await Course.find({ _id: { $in: courseIds } });
    if (foundCourses.length !== courseIds.length) {
      return res.status(404).json({ message: "One or more courses not found." });
    }

    // Save institution with appliedCourses
    const institution = new Institution({
      email,
      institutionName,
      howDidYouFindUs,
      referredBy,
      coordinatorName,
      coordinatorContactNumber1,
      coordinatorEmail,
      state,
      city,
      address,
      numberOfStudents,
      suitableTime,
      startMonth,
      appliedCourses: courseIds,
      studentList: studentListUrl,
      institutionLogo: institutionLogoUrl
    });

    await institution.save();

    // Add institution to each course's institutions array
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { institutions: institution._id } }
    );

    res.status(201).json({ message: "Institution submitted successfully", institution });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({ message: "You have already applied to this course." });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get the list of referred by options for the public course application form
export const getReferredByList = async (req, res) => {
  try {
    const referredByList = await ReferredBy.find();

    if (!referredByList) {
      return next(new ErrorResponse('No Referred By list found', 404));
    }

    res.status(200).json({
      success: true,
      data: referredByList
    });
  } catch (error) {
    next(error);
  }
};

export const verifyApplyCourseData = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      phone,
      motherTongue,
      age,
      gender,
      isStudent,
      classStudying,
      country,
      state,
      city,
      address,
      whatsappNumber,
      referredBy,
      convenientTimeSlot,
    } = req.body;

    // Updated validation for country-based requirements
    if (
      !fullName || !email || !phone || !motherTongue || !age || !gender ||
      !isStudent || !whatsappNumber || !referredBy || !convenientTimeSlot
    ) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }

    // Country-specific validation
    if (country === "India") {
      if (!state || !city) {
        return res.status(400).json({
          success: false,
          message: "State and City are required for Indian applicants."
        });
      }
    } else {
      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Address is required for international applicants."
        });
      }
    }

    // Additional phone number validation
    if (country === "India") {
      // For India, phone should be exactly 10 digits
      if (!/^\d{10}$/.test(phone) || !/^\d{10}$/.test(whatsappNumber)) {
        return res.status(400).json({
          success: false,
          message: "Phone and WhatsApp numbers must be 10 digits for Indian applicants."
        });
      }
    } else {
      // For international, phone should be digits only (country code will be added separately)
      if (!/^\d{6,15}$/.test(phone) || !/^\d{6,15}$/.test(whatsappNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format for international applicants."
        });
      }
    }

    // If student is "Yes", classStudying is required
    if (isStudent === "Yes" && !classStudying) {
      return res.status(400).json({
        success: false,
        message: "Class studying information is required when applicant is a student."
      });
    }


    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success:false,message: "Please provide a valid email." });
    }

    // Validate phone number format
    if (!validator.isMobilePhone(phone)) {
      return res.status(400).json({ success:false,message: "Please provide a valid phone number." });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success:false,message: "Course not found or inactive" });
    }

    res.status(200).json({ success:true, message: "Your Application is ready to procced to payment now!" });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({ success:false,message: "You have already applied to this course." });
    }
    res.status(500).json({ message: error.message });
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt,
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
      courseData,
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

    const applicant = new Applicant({
      ...courseData,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isVerified: true,
    });

    await applicant.save();

    const course = await Course.findById(courseData.course);
    course.applicants.push(applicant._id);
    await course.save();

    res.status(201).json({
      success: true,
      data: applicant,
      message: "Payment verification success"
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

