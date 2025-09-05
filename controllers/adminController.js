import Admin from "../models/Admin.js";
import DonorUser from "../models/DonorUser.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Institution from '../models/Institution.js';
import Carousel from '../models/Carousel.js';
import sendDonationEmail from "../services/emailService.js";
import jwt from "jsonwebtoken";
import sendProgressTemplate from "../templates/sendProgressTemplate.js";
import assignStudentTemplate from "../templates/assignStudentTemplate.js";
import ErrorResponse from "../utils/errorResponse.js";
import { deleteImagesFromS3, deleteSingleImageFromS3 } from "../utils/s3Cleanup.js";
import VideoCard from "../models/VideoCard.js";
import HeroSection from "../models/HeroSection.js";
import BulletPoint from "../models/BulletPoint.js";
import Testimonial from "../models/Testimonial.js";
import Section from "../models/Section.js";
import ReferredBy from "../models/ReferredBy.js";

export const createAdmin = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists with this email");
  }

  const admin = await Admin.create({
    firstName,
    lastName,
    email,
    password,
    role: role || "admin",
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid admin data");
  }
};

export const getAdmin = async (req, res, next) => {
  try {
    const user = await Admin.findById(req.user.id);

    console.log(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();

    if (!admins || admins.length === 0) {
      return next(new ErrorResponse("No admins found", 404));
    }

    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    next(new ErrorResponse("Server error while fetching admins", 500));
  }
};
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(
        new ErrorResponse("Please provide an email and password", 400)
      );
    }

    // Find admin by email
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Create token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
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

    // Send response with token and admin info
    res
      .status(200)
      .cookie("token", token, options)
      .json({
        success: true,
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
        },
      });
  } catch (err) {
    console.error("Admin login error:", err);
    next(new ErrorResponse("Server error during admin login", 500));
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role },
      { new: true, runValidators: true }
    );

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating admin" });
  }
};

// Delete Admin
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting admin" });
  }
};

// Assign a student to a donor
export const assignStudent = async (req, res) => {
  try {
    const { donorId, studentData } = req.body;
    const adminId = req.user.id;

    // Create a new student
    const student = new Student({ ...studentData, donor: donorId });
    await student.save();

    // Update the donor's students array with the new student's ID
    const donor = await DonorUser.findByIdAndUpdate(
      donorId,
      { $push: { students: student._id } },
      { new: true }
    );

    // Fetch the admin details
    const admin = await Admin.findById(adminId);

    if (donor) {
      // Send notification to donor
      await sendDonationEmail({
        type: "assignStudent",
        to: donor.email,
        subject: "Student Assigned",
        html: assignStudentTemplate(donor, studentData),
      });

      // Send notification to admin
      await sendDonationEmail({
        type: "assignStudent",
        to: admin.email,
        subject: "Student Assigned to Donor",
        html: assignStudentTemplate(donor, studentData),
      });
    }

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update student progress
export const updateStudentProgress = async (req, res) => {
  try {
    const { studentId, progressData } = req.body;

    // Ensure progressData includes the details
    if (!progressData.details) {
      return res.status(400).json({
        success: false,
        message: "Progress details are required",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Add the progress details to the student's progress array
    student.progress.push({
      details: progressData.details,
      date: new Date(),
    });

    await student.save();

    const donor = await DonorUser.findById(student.donor);
    if (donor) {
      await sendDonationEmail({
        type: "progressUpdate",
        to: donor.email,
        subject: "Student Progress Update",
        html: sendProgressTemplate(donor, student, progressData.details),
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { title, description, duration, level, fees, targetAudience, whatsappLink, adminId, timeSlots, isNew, category } = req.body;
    const imageUrl = req.file ? req.file.location : null; // S3 URL is in req.file.location
    const course = new Course({
      title,
      description,
      duration,
      createdBy: adminId,
      imageUrl,
      level,
      fees,
      targetAudience,
      whatsappLink,
      timeSlots,
      category,
      isNew: (isNew === true || isNew === 'true') ? true : false
    });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("applicants").populate("institutions"); // ✅ now pulls full data
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const {
    title,
    description,
    duration,
    level,
    category,
    fees,
    targetAudience,
    whatsappLink,
    timeSlots,
    isNew
  } = req.body;
  // Validate required fields
  if (!title || !description || !duration || !level || !fees || !targetAudience || !whatsappLink || !timeSlots || !category) {
    if (req.file) {
      // Clean up uploaded image if validation fails
      await deleteImagesFromS3([req.file]);
    }
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  let course;
  try {
    course = await Course.findById(courseId);
    if (!course) {
      if (req.file) {
        await deleteImagesFromS3([req.file]);
      }
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    let oldImageKey = null;
    let newImageUrl = course.imageUrl;

    // If a new image is uploaded, prepare to delete the old one
    if (req.file) {
      // Save the new image URL
      newImageUrl = req.file.location;
      // Extract the S3 key from the old image URL if it exists
      if (course.imageUrl) {
        const urlParts = course.imageUrl.split('/');
        oldImageKey = urlParts.slice(-2).join('/');
      }
    }

    // Update the course fields
    course.title = title;
    course.description = description;
    course.duration = duration;
    course.level = level;
    course.category = category;
    course.fees = fees;
    course.targetAudience = targetAudience;
    course.whatsappLink = whatsappLink;
    course.updatedBy = req.user.id;
    course.imageUrl = newImageUrl;
    course.timeSlots = timeSlots;
    course.isNew = (isNew === true || isNew === 'true') ? true : false;

    await course.save();

    // If a new image was uploaded and there was an old image, delete the old image from S3
    if (req.file && oldImageKey) {
      await deleteSingleImageFromS3(oldImageKey);
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    // If a new image was uploaded but an error occurred, clean up the new image from S3
    if (req.file) {
      await deleteImagesFromS3([req.file]);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all donors
export const getAllDonors = async (req, res) => {
  try {
    // Fetch donors and populate the 'students' and 'donations' fields
    const donors = await DonorUser.find()
      .populate({
        path: "students",
        options: { sort: { createdAt: -1 } }, // Sort students by creation date, newest first
      })
      .populate("donations"); // Populate the donations field

    // Structure the response to include donor details, their assigned students, and total donation amount
    const responseData = donors.map((donor) => {
      // Calculate the total donation amount for the donor
      const totalDonationAmount = donor.donations.reduce((sum, donation) => {
        return sum + donation.amount;
      }, 0);

      return {
        _id: donor._id,
        firstName: donor.firstName,
        lastName: donor.lastName,
        email: donor.email,
        phone: donor.phone,
        donorType: donor.donorType,
        students: donor.students, // This will include the populated student details
        donations: donor.donations, // This will include the populated donation details
        totalDonationAmount, // Include the total donation amount
        createdAt: donor.createdAt,
        lastLogin: donor.lastLogin,
      };
    });

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all donations
// export const getAllDonations = async (req, res) => {
//   try {
//     const donations = await Donation.find({ donationType: '' })


//     const responseData = donations.map((donation) => {
      

//       return {
//         _id: donation._id,
//         amount: donation.amount,
//         donationType: donation.donationType,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: responseData,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getAllInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find()
      .populate({
        path: 'appliedCourses',
        select: '-applicants' // This will exclude the applicants field
      });

    res.status(200).json(institutions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update carousel for a page
export const createOrUpdateCarousel = async (req, res, next) => {
  try {
    const { page, headings, subTexts, ctaTexts, ctaUrls } = req.body;

    // Validate required fields
    if (!page) {
      await deleteImagesFromS3(req.files);
      return next(new ErrorResponse('Page name is required', 400));
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return next(new ErrorResponse('At least one image is required', 400));
    }

    // Controller validation: check images length
    if (req.files.length > 3) {
      await deleteImagesFromS3(req.files);
      return next(new ErrorResponse('Carousel cannot have more than 3 images', 400));
    }

    // Parse the form data arrays (they come as strings from form data)
    let headingsArray, subTextsArray, ctaTextsArray, ctaUrlsArray;

    try {
      headingsArray = headings ? JSON.parse(headings) : [];
      subTextsArray = subTexts ? JSON.parse(subTexts) : [];
      ctaTextsArray = ctaTexts ? JSON.parse(ctaTexts) : [];
      ctaUrlsArray = ctaUrls ? JSON.parse(ctaUrls) : [];
    } catch (parseError) {
      await deleteImagesFromS3(req.files);
      return next(new ErrorResponse('Invalid JSON format in form data', 400));
    }

    // Check if carousel already exists for this page
    const existingCarousel = await Carousel.findOne({ page });

    // If updating existing carousel, handle old images
    if (existingCarousel && existingCarousel.images && existingCarousel.images.length > 0) {
      // Delete old images from S3
      const oldImageKeys = existingCarousel.images.map(img => {
        // Extract key from S3 URL
        const urlParts = img.url.split('/');
        return urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
      });

      // Delete old images from S3
      for (const key of oldImageKeys) {
        await deleteSingleImageFromS3(key);
      }
    }

    // Create images array with S3 URLs and form data
    const images = req.files.map((file, index) => ({
      url: file.location, // S3 URL
      heading: headingsArray[index] || null,
      subText: subTextsArray[index] || null,
      ctaText: ctaTextsArray[index] || null,
      ctaUrl: ctaUrlsArray[index] || null
    }));

    // Upsert carousel (create or update)
    const carousel = await Carousel.findOneAndUpdate(
      { page },
      { page, images },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: carousel,
      message: existingCarousel ? 'Carousel updated successfully' : 'Carousel created successfully'
    });

  } catch (error) {
    // Clean up uploaded images if any error occurs
    if (req.files && req.files.length > 0) {
      await deleteImagesFromS3(req.files);
    }
    next(error);
  }
};

// Add a new video card
export const addVideoCard = async (req, res) => {
  try {
    const thumbnail = req.file ? req.file.location : null; // S3 URL is in req.file.location
    const card = new VideoCard({
      ...req.body,
      thumbnail
    });
    await card.save();
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update a video card
export const updateVideoCard = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Retrieve the existing video card data
    const existingCard = await VideoCard.findById(id);
    if (!existingCard) {
      return res.status(404).json({ success: false, message: 'Video card not found' });
    }

    // If a new file was uploaded, update the thumbnail URL
    if (req.file) {
      // Delete the old thumbnail from S3
      if (existingCard.thumbnail) {
        const oldFileKey = existingCard.thumbnail.split('/').pop(); // Extract the file key from the URL
        await deleteSingleImageFromS3(oldFileKey);
      }

      updateData.thumbnail = req.file.location; // Update with the new file's URL
    }

    const card = await VideoCard.findByIdAndUpdate(id, updateData, { new: true });
    if (!card) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a video card
export const deleteVideoCard = async (req, res) => {
  try {
    const { id } = req.params;
    // Retrieve the video card data to get the thumbnail URL
    const videoCard = await VideoCard.findById(id);
    if (!videoCard) {
      return res.status(404).json({ success: false, message: 'Video card not found' });
    }

    // Delete the thumbnail image from S3
    if (videoCard.thumbnail) {
      const fileKey = videoCard.thumbnail.split('/').pop(); // Extract the file key from the URL
      await deleteSingleImageFromS3(fileKey);
    }

    // Delete the video card from the database
    await VideoCard.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


// Add a new hero section
export const addHeroSection = async (req, res) => {
  try {
    const heroSection = new HeroSection(req.body);
    await heroSection.save();
    res.json({ success: true, data: heroSection });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update a hero section
export const updateHeroSection = async (req, res) => {
  try {
    const { id } = req.params;
    const heroSection = await HeroSection.findByIdAndUpdate(id, req.body, { new: true });
    if (!heroSection) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: heroSection });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete a hero section
export const deleteHeroSection = async (req, res) => {
  try {
    const { id } = req.params;
    await HeroSection.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Bullet Point Admin Functions
export const addBulletPoint = async (req, res) => {
  try {
    const bulletPoint = new BulletPoint(req.body);
    await bulletPoint.save();
    res.json({ success: true, data: bulletPoint });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateBulletPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const bulletPoint = await BulletPoint.findByIdAndUpdate(id, req.body, { new: true });
    if (!bulletPoint) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: bulletPoint });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteBulletPoint = async (req, res) => {
  try {
    const { id } = req.params;
    await BulletPoint.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Testimonial Admin Functions
export const addTestimonial = async (req, res) => {
  try {
    const testimonial = new Testimonial(req.body);
    await testimonial.save();
    res.json({ success: true, data: testimonial });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndUpdate(id, req.body, { new: true });
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: testimonial });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    await Testimonial.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Sections Admin Functions with S3 Image Handling
export const addSection = async (req, res, next) => {
  try {
    const { page, heading, subHeading, body, orientation } = req.body;

    // Validate required fields
    if (!page || !heading || !body || !orientation) {
      if (req.file) {
        // Clean up uploaded image if validation fails
        await deleteImagesFromS3([req.file]);
      }
      return next(new ErrorResponse('All fields are required', 400));
    }

    // Validate orientation
    if (!['left', 'right'].includes(orientation)) {
      if (req.file) {
        await deleteImagesFromS3([req.file]);
      }
      return next(new ErrorResponse('Orientation must be either "left" or "right"', 400));
    }

    // Handle image upload (optional)
    const imageUrl = req.file ? req.file.location : null; // S3 URL if uploaded

    const section = new Section({
      page,
      heading,
      subHeading,
      body,
      imageUrl,
      orientation
    });

    await section.save();

    res.status(201).json({
      success: true,
      data: section,
      message: 'New section created successfully'
    });

  } catch (error) {
    // Clean up uploaded image if any error occurs
    if (req.file) {
      await deleteImagesFromS3([req.file]);
    }
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, heading, subHeading, body, orientation } = req.body;

    // Validate required fields
    if (!page || !heading || !body || !orientation) {
      if (req.file) {
        await deleteImagesFromS3([req.file]);
      }
      return next(new ErrorResponse('All fields are required', 400));
    }

    // Validate orientation
    if (!['left', 'right'].includes(orientation)) {
      if (req.file) {
        await deleteImagesFromS3([req.file]);
      }
      return next(new ErrorResponse('Orientation must be either "left" or "right"', 400));
    }

    // Find existing Section
    const existingSection = await Section.findById(id);
    if (!existingSection) {
      if (req.file) {
        await deleteImagesFromS3([req.file]);
      }
      return next(new ErrorResponse('Section not found', 404));
    }

    let oldImageKey = null;
    let newImageUrl = existingSection.imageUrl;

    // If a new image is uploaded, prepare to delete the old one
    if (req.file) {
      newImageUrl = req.file.location;

      // Extract the S3 key from the old image URL if it exists
      if (existingSection.imageUrl) {
        const urlParts = existingSection.imageUrl.split('/');
        oldImageKey = urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
      }
    }

    // Update the Section fields
    existingSection.page = page;
    existingSection.heading = heading;
    existingSection.subHeading = subHeading;
    existingSection.body = body;
    existingSection.orientation = orientation;
    existingSection.imageUrl = newImageUrl;

    await existingSection.save();

    // If a new image was uploaded and there was an old image, delete the old image from S3
    if (req.file && oldImageKey) {
      await deleteSingleImageFromS3(oldImageKey);
    }

    res.status(200).json({
      success: true,
      data: existingSection,
      message: 'Section updated successfully'
    });

  } catch (error) {
    // If a new image was uploaded but an error occurred, clean up the new image from S3
    if (req.file) {
      await deleteImagesFromS3([req.file]);
    }
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the Section to get the image URL before deletion
    const section = await Section.findById(id);
    if (!section) {
      return next(new ErrorResponse('Section not found', 404));
    }

    // Extract the S3 key from the image URL
    let imageKey = null;
    if (section.imageUrl) {
      const urlParts = section.imageUrl.split('/');
      imageKey = urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
    }

    // Delete the Section from database
    await Section.findByIdAndDelete(id);

    // Delete the image from S3 if it exists
    if (imageKey) {
      await deleteSingleImageFromS3(imageKey);
    }

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get all Sections entries (for admin dashboard)
export const getAllSections = async (req, res, next) => {
  try {
    const sectionEntries = await Section.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sectionEntries
    });
  } catch (error) {
    next(error);
  }
};

// Get Section by ID (for admin editing)
export const getSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) {
      return next(new ErrorResponse('Section not found', 404));
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

// ReferredBy Admin Functions

// Add a new referred by entry
export const addReferredBy = async (req, res, next) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return next(new ErrorResponse('Name is required', 400));
    }

    // Check if a ReferredBy document already exists (we only want one document)
    const existingReferredBy = await ReferredBy.findOne({ name });

    if (existingReferredBy) {
      return next(new ErrorResponse('Name already exists', 400));
    }

    // If no document exists, create a new one
    const newReferredBy = new ReferredBy({
      name
    });

    await newReferredBy.save();

    res.status(201).json({
      success: true,
      data: newReferredBy,
      message: 'Referred By list created successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get all Referred By entries
export const getOneReferredBy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const referredBy = await ReferredBy.findById(id);

    if (!referredBy) {
      return next(new ErrorResponse('No Referred By entry found', 404));
    }

    res.status(200).json({
      success: true,
      data: referredBy
    });
  } catch (error) {
    next(error);
  }
};

// Update Referred By list
export const updateReferredBy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return next(new ErrorResponse('Name is required', 400));
    }

    const updatedReferredBy = await ReferredBy.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedReferredBy,
      message: 'Referred By Name updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete Referred By list
export const deleteReferredBy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedReferredBy = await ReferredBy.findByIdAndDelete(id);

    if (!deletedReferredBy) {
      return next(new ErrorResponse('Referred By Name not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Referred By Name deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

import mongoose from "mongoose";
import { Parser } from "json2csv";
import archiver from "archiver";
import Donation from "../models/Donation.js";

export const downloadBackup = async (req, res) => {
  try {
    const { format } = req.query; // json or csv
    if (!["json", "csv"].includes(format)) {
      return res.status(400).json({ message: "Invalid format" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=backup-${Date.now()}.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const coll of collections) {
      const name = coll.name;
      const data = await mongoose.connection.db.collection(name).find().toArray();

      if (format === "json") {
        // Always append file, even if empty
        archive.append(JSON.stringify(data, null, 2), { name: `${name}.json` });
      } else if (format === "csv") {
        if (data.length > 0) {
          const parser = new Parser({ fields: Object.keys(data[0]) });
          const csv = parser.parse(data);
          archive.append(csv, { name: `${name}.csv` });
        } else {
          // Empty CSV file for empty collection
          archive.append("", { name: `${name}.csv` });
        }
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error("Backup error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Backup failed", error: err.message });
    }
  }
};

export const getHomepageContent = async (req, res) => {
    
}