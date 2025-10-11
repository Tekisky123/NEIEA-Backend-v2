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
// import Testimonial from "../models/Testimonial.js";
import { CardTestimonial, VideoTestimonial } from "../models/Testimonial.js";
import Section from "../models/Section.js";
import ReferredBy from "../models/ReferredBy.js";
import validator from 'validator';
import GalleryItem from '../models/GalleryItem.js';
import PartnerInstitution from '../models/PartnerInstitution.js';
import CareerPage from '../models/CareerPage.js';
import GlobalPartner from '../models/GlobalPartnersPage.js';

function createS3KeyFromImageUrl(url) {
  const urlParts = url.split('/');
  return urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
}

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
// export const addTestimonial = async (req, res) => {
//   try {
//     const testimonial = new Testimonial(req.body);
//     await testimonial.save();
//     res.json({ success: true, data: testimonial });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// export const updateTestimonial = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const testimonial = await Testimonial.findByIdAndUpdate(id, req.body, { new: true });
//     if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
//     res.json({ success: true, data: testimonial });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

// export const deleteTestimonial = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await Testimonial.findByIdAndDelete(id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

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
import Leadership from "../models/Leadership.js";

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

// V3 Dynamic Things

// CARD TESTIMONIALS
export const getAllCardTestimonials = async (req, res) => {
  try {
    const testimonials = await CardTestimonial.find()
      .sort({ display_order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch card testimonials' });
  }
};

export const createCardTestimonial = async (req, res) => {
  try {
    const { name, role, location, image, content } = req.body;
    const lastTestimonial = await CardTestimonial.findOne()
      .sort({ display_order: -1 });
    const nextOrder = lastTestimonial ? lastTestimonial.display_order + 1 : 1;
    const imageUrl = req.file ? req.file.location : null; // S3 URL if uploaded
    const testimonial = new CardTestimonial({
      name,
      role,
      location,
      image: imageUrl,
      content,
      display_order: nextOrder
    });
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    if (req.file) {
      await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
      console.log("testimonials: s3 uploaded image has been deleted")
    }
    res.status(400).json({ error: 'Failed to create card testimonial' });
  }
};

export const updateCardTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Fetch the existing testimonial to get the current image URL
    const existingTestimonial = await CardTestimonial.findById(id);
    if (!existingTestimonial) {
      if (req.file) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
        console.log("Update testimonials: S3 uploaded image has been deleted because the testimonial was not found.");
      }
      return res.status(404).json({ error: 'Card testimonial not found' });
    }

    // If a new image is uploaded, delete the existing image from S3
    if (req.file) {
      if (existingTestimonial.image) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(existingTestimonial.image));
        console.log("Update testimonials: s3 Existing image has been deleted!.");
      }
      updateData.image = req.file.location; // Update image URL with the new S3 URL
    }

    // Update the testimonial in the database
    const testimonial = await CardTestimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(testimonial);
  } catch (error) {
    console.error("Error updating card testimonial:", error);
    if (req.file) {
      await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
      console.log("update Testimonials: S3 uploaded image has been deleted due to an unexpected error.");
    }
    res.status(400).json({ error: 'Failed to update card testimonial' });
  }
};


export const deleteCardTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await CardTestimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Card testimonial not found' });
    }
    if (testimonial.image) {
      await deleteSingleImageFromS3(createS3KeyFromImageUrl(testimonial.image));
      console.log("delete Testimonials: S3 uploaded image has been deleted.");
    }
    res.json({ message: 'Card testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete card testimonial' });
  }
};

// VIDEO TESTIMONIALS
export const getAllVideoTestimonials = async (req, res) => {
  try {
    const testimonials = await VideoTestimonial.find()
      .sort({ display_order: 1, createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video testimonials' });
  }
};

export const createVideoTestimonial = async (req, res) => {
  try {
    const { title, description, type, duration, videoUrl, videoType, videoTag, rating } = req.body;
    const lastTestimonial = await VideoTestimonial.findOne()
      .sort({ display_order: -1 });
    const nextOrder = lastTestimonial ? lastTestimonial.display_order + 1 : 1;
    const testimonial = new VideoTestimonial({
      title,
      description,
      type,
      duration,
      videoUrl,
      videoType,
      videoTag,
      rating,
      display_order: nextOrder
    });
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create video testimonial' });
  }
};

export const updateVideoTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const testimonial = await VideoTestimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!testimonial) {
      return res.status(404).json({ error: 'Video testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update video testimonial' });
  }
};

export const deleteVideoTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await VideoTestimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Video testimonial not found' });
    }
    res.json({ message: 'Video testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video testimonial' });
  }
};

// REORDER FUNCTIONALITY
export const reorderTestimonials = async (req, res) => {
  try {
    const { type, items } = req.body; // type: 'cards' or 'videos', items: [{id, display_order}]
    if (!type || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid reorder data' });
    }
    const Model = type === 'cards' ? CardTestimonial : VideoTestimonial;
    const updatePromises = items.map(item =>
      Model.findByIdAndUpdate(item.id, { display_order: item.display_order })
    );
    await Promise.all(updatePromises);
    res.json({ message: 'Testimonials reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder testimonials' });
  }
};

// LEADERSHIP
// Get all leadership members (admin)
export const getAllLeadership = async (req, res) => {
  try {
    const members = await Leadership.find()
      .sort({ category: 1, display_order: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: members,
      count: members.length
    });
  } catch (error) {
    console.error('Error fetching leadership members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leadership members',
      error: error.message
    });
  }
};

// Get single leadership member (admin)
export const getLeadershipById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    const member = await Leadership.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Leadership member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Error fetching leadership member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leadership member',
      error: error.message
    });
  }
};

// Create new leadership member
export const createLeadership = async (req, res) => {
  try {
    const { name, title, description, category, fullBio, hasImage } = req.body;

    // Validation using validator module
    const errors = [];

    if (!name || !validator.isLength(name.trim(), { min: 1, max: 100 })) {
      errors.push('Name is required and must be between 1-100 characters');
    }

    if (!title || !validator.isLength(title.trim(), { min: 1, max: 100 })) {
      errors.push('Title is required and must be between 1-100 characters');
    }

    if (!description || !validator.isLength(description.trim(), { min: 1, max: 5000 })) {
      errors.push('Description is required and must be between 1-500 characters');
    }

    // if (!image || !validator.isURL(image)) { //enable after s3 implemented
    //   errors.push('Valid image URL is required');
    // }

    if (!category || !['directors', 'advisors', 'staff'].includes(category)) {
      errors.push('Category must be directors, advisors, or staff');
    }

    if (fullBio && !validator.isLength(fullBio.trim(), { max: 2000 })) {
      errors.push('Full bio must not exceed 2000 characters');
    }

    if (errors.length > 0) {
      if (req.file) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
        console.log('leadership: s3 uploaded image has been deleted!')
      }
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors
      });
    }

    // Handle image upload (optional)
    const imageUrl = req.file ? req.file.location : null; // S3 URL if uploaded

    // Get the next display order for this category
    const lastMember = await Leadership.findOne({ category })
      .sort({ display_order: -1 });

    const display_order = lastMember ? lastMember.display_order + 1 : 1;

    const newMember = new Leadership({
      name: validator.escape(name.trim()),
      title: validator.escape(title.trim()),
      description: validator.escape(description.trim()),
      image: imageUrl,
      hasImage: hasImage !== undefined ? hasImage : true,
      category,
      display_order,
      fullBio: fullBio ? validator.escape(fullBio.trim()) : '',
      is_active: true
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: 'Leadership member created successfully',
      data: newMember
    });
  } catch (error) {
    console.error('Error creating leadership member:', error);
    if (req.file) {
      await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
      console.log('leadership: s3 uploaded image has been deleted!')
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create leadership member',
      error: error.message
    });
  }
};

// Update leadership member
export const updateLeadership = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, description, category, fullBio, is_active, hasImage } = req.body;

    if (!validator.isMongoId(id)) {
      if (req.file) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
        console.log('update leadership: s3 uploaded image has been deleted!')
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    // Fetch the existing member to get the current image URL
    const existingMember = await Leadership.findById(id);
    if (!existingMember) {
      if (req.file) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
        console.log('Update leadership: s3 Uploaded image has been deleted because the member was not found!');
      }
      return res.status(404).json({
        success: false,
        message: 'Leadership member not found',
      });
    }

    // Validation using validator module
    const errors = [];

    if (name !== undefined && (!name || !validator.isLength(name.trim(), { min: 1, max: 100 }))) {
      errors.push('Name must be between 1-100 characters');
    }

    if (title !== undefined && (!title || !validator.isLength(title.trim(), { min: 1, max: 100 }))) {
      errors.push('Title must be between 1-100 characters');
    }

    if (description !== undefined && (!description || !validator.isLength(description.trim(), { min: 1, max: 5000 }))) {
      errors.push('Description must be between 1-500 characters');
    }

    // if (image !== undefined && (!image || !validator.isURL(image))) { //enable after s3 integrated
    //   errors.push('Valid image URL is required');
    // }

    if (category !== undefined && !['directors', 'advisors', 'staff'].includes(category)) {
      errors.push('Category must be directors, advisors, or staff');
    }

    if (fullBio !== undefined && fullBio && !validator.isLength(fullBio.trim(), { max: 2000 })) {
      errors.push('Full bio must not exceed 2000 characters');
    }

    if (is_active !== undefined && typeof is_active !== 'boolean') {
      errors.push('is_active must be a boolean value');
    }

    if (errors.length > 0) {
      if (req.file) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
        console.log('update leadership: s3 uploaded image has been deleted!')
      }
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = validator.escape(name.trim());
    if (title !== undefined) updateData.title = validator.escape(title.trim());
    if (description !== undefined) updateData.description = validator.escape(description.trim());
    if (req.file) {
      // Delete the existing image from S3 if it exists
      if (existingMember.image) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(existingMember.image));
        console.log('Update leadership: s3 Existing image has been deleted!');
      }
      updateData.image = req.file.location; // Assuming `req.file.location` contains the S3 URL
      updateData.hasImage = true;
    }
    if (hasImage !== undefined) {
      updateData.hasImage = hasImage; // Override hasImage based on the request body
    }
    if (category !== undefined) updateData.category = category;
    if (fullBio !== undefined) updateData.fullBio = fullBio ? validator.escape(fullBio.trim()) : '';
    if (is_active !== undefined) updateData.is_active = is_active;

    const member = await Leadership.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!member) {
      if (req.file) {
        await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
        console.log('update leadership: s3 uploaded image has been deleted!')
      }
      return res.status(404).json({
        success: false,
        message: 'Leadership member not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leadership member updated successfully',
      data: member
    });
  } catch (error) {
    console.error('Error updating leadership member:', error);
    if (req.file) {
      await deleteSingleImageFromS3(createS3KeyFromImageUrl(req.file));
      console.log('update leadership: s3 uploaded image has been deleted!')
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update leadership member',
      error: error.message
    });
  }
};

// Delete leadership member
export const deleteLeadership = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }

    const member = await Leadership.findByIdAndDelete(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Leadership member not found'
      });
    }

    // Reorder remaining members in the same category
    await Leadership.updateMany(
      {
        category: member.category,
        display_order: { $gt: member.display_order }
      },
      { $inc: { display_order: -1 } }
    );

    if (member.image) {
      await deleteSingleImageFromS3(createS3KeyFromImageUrl(member.image));
      console.log('delete leadership: s3 uploaded image has been deleted!')
    }

    res.status(200).json({
      success: true,
      message: 'Leadership member deleted successfully',
      data: member
    });
  } catch (error) {
    console.error('Error deleting leadership member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leadership member',
      error: error.message
    });
  }
};

// Reorder leadership members
export const reorderLeadership = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    // Validate each item
    const errors = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.id || !validator.isMongoId(item.id)) {
        errors.push(`Item ${i + 1}: Invalid member ID`);
      }
      if (typeof item.display_order !== 'number' || item.display_order < 1) {
        errors.push(`Item ${i + 1}: Invalid display order`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors
      });
    }

    // Update display_order for each item
    const updatePromises = items.map(item =>
      Leadership.findByIdAndUpdate(
        item.id,
        { display_order: item.display_order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Leadership order updated successfully'
    });
  } catch (error) {
    console.error('Error reordering leadership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder leadership members',
      error: error.message
    });
  }
};

// GET /api/admin/gallery - Get all gallery items (Admin)
export const getAllGalleryItems = async (req, res) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await GalleryItem.find(query)
      .sort({ display_order: 1, created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await GalleryItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items',
      error: error.message
    });
  }
};

// GET /api/admin/gallery/:id - Get single gallery item (Admin)
export const getGalleryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery item ID'
      });
    }
    
    const item = await GalleryItem.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery item',
      error: error.message
    });
  }
};

// POST /api/admin/gallery - Create new gallery item (Admin)
export const createGalleryItem = async (req, res) => {
  try {
    const { title, description, category, year } = req.body;
    
    // Validation using validator package
    if (!title || !validator.isLength(title, { min: 1, max: 255 })) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be between 1-255 characters'
      });
    }
    
    if (!description || !validator.isLength(description, { min: 1, max: 1000 })) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be between 1-1000 characters'
      });
    }
    
    if (!category || !validator.isIn(category, ['events', 'leadership', 'partnerships', 'workshops', 'digital'])) {
      return res.status(400).json({
        success: false,
        message: 'Category is required and must be one of: events, leadership, partnerships, workshops, digital'
      });
    }
    
    if (!year || !validator.isInt(year, { min: 2000, max: 2030 })) {
      return res.status(400).json({
        success: false,
        message: 'Year is required and must be between 2000-2030'
      });
    }
    
    if (!req.file || !req.file.location) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }
    
    // Get the next display order for the category
    const lastItem = await GalleryItem.findOne({ category })
      .sort({ display_order: -1 });
    const nextOrder = lastItem ? lastItem.display_order + 1 : 1;

    const galleryItem = new GalleryItem({
      title: validator.escape(title.trim()),
      description: validator.escape(description.trim()),
      category,
      year: validator.escape(year.trim()),
      image: req.file.location, // S3 URL
      display_order: nextOrder
    });

    await galleryItem.save();

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    
    // Clean up uploaded file if database save fails
    if (req.file && req.file.key) {
      await deleteSingleImageFromS3(req.file.key);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery item',
      error: error.message
    });
  }
};

// PUT /api/admin/gallery/:id - Update gallery item (Admin)
export const updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, year } = req.body;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery item ID'
      });
    }
    
    // Validation using validator package
    if (title && !validator.isLength(title, { min: 1, max: 255 })) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 1-255 characters'
      });
    }
    
    if (description && !validator.isLength(description, { min: 1, max: 1000 })) {
      return res.status(400).json({
        success: false,
        message: 'Description must be between 1-1000 characters'
      });
    }
    
    if (category && !validator.isIn(category, ['events', 'leadership', 'partnerships', 'workshops', 'digital'])) {
      return res.status(400).json({
        success: false,
        message: 'Category must be one of: events, leadership, partnerships, workshops, digital'
      });
    }
    
    if (year && !validator.isInt(year, { min: 2000, max: 2030 })) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2000-2030'
      });
    }
    
    // Get existing item to check for old image
    const existingItem = await GalleryItem.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    const updateData = {
      updated_at: new Date()
    };
    
    if (title) updateData.title = validator.escape(title.trim());
    if (description) updateData.description = validator.escape(description.trim());
    if (category) updateData.category = category;
    if (year) updateData.year = validator.escape(year.trim());
    
    // Handle new image upload
    if (req.file && req.file.location) {
      updateData.image = req.file.location;
    }

    const item = await GalleryItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Delete old image from S3 if new image was uploaded
    if (req.file && req.file.location && existingItem.image !== req.file.location) {
      const oldImageKey = existingItem.image.split('/').slice(-2).join('/'); // Extract key from S3 URL
      await deleteSingleImageFromS3(oldImageKey);
    }

    res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    
    // Clean up uploaded file if database update fails
    if (req.file && req.file.key) {
      await deleteSingleImageFromS3(req.file.key);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery item',
      error: error.message
    });
  }
};

// DELETE /api/admin/gallery/:id - Delete gallery item (Admin)
export const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery item ID'
      });
    }
    
    const item = await GalleryItem.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    // Delete image from S3
    if (item.image) {
      const imageKey = item.image.split('/').slice(-2).join('/'); // Extract key from S3 URL
      await deleteSingleImageFromS3(imageKey);
    }
    
    await GalleryItem.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery item',
      error: error.message
    });
  }
};

// PUT /api/admin/gallery/reorder - Reorder gallery items (Admin)
export const reorderGalleryItems = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }
    
    // Validate each item in the array
    for (const item of items) {
      if (!item.id || !validator.isMongoId(item.id.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid item ID in reorder array'
        });
      }
      
      if (typeof item.display_order !== 'number' || item.display_order < 0) {
        return res.status(400).json({
          success: false,
          message: 'Display order must be a non-negative number'
        });
      }
    }

    // Update display order for each item
    const updatePromises = items.map(item => 
      GalleryItem.findByIdAndUpdate(
        item.id,
        { display_order: item.display_order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Gallery items reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder gallery items',
      error: error.message
    });
  }
};

// PUT /api/admin/gallery/:id/toggle-status - Toggle gallery item status (Admin)
export const toggleGalleryItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery item ID'
      });
    }
    
    const item = await GalleryItem.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    item.is_active = !item.is_active;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Gallery item ${item.is_active ? 'activated' : 'deactivated'} successfully`,
      data: item
    });
  } catch (error) {
    console.error('Error toggling gallery item status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle gallery item status',
      error: error.message
    });
  }
};

// @desc    Get all partner institutions (Admin)
// @route   GET /api/admin/partner-institution
// @access  Private/Admin
export const getAllPartnerInstitutions = async (req, res) => {
  try {
    const institutions = await PartnerInstitution.find()
      .sort({ display_order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: institutions
    });
  } catch (error) {
    console.error('Error fetching partner institutions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner institutions'
    });
  }
};

// @desc    Get single partner institution by ID (Admin)
// @route   GET /api/admin/partner-institution/:id
// @access  Private/Admin
export const getPartnerInstitutionById = async (req, res) => {
  try {
    const institution = await PartnerInstitution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Partner institution not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Error fetching partner institution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner institution'
    });
  }
};

// @desc    Create new partner institution
// @route   POST /api/admin/partner-institution
// @access  Private/Admin
export const createPartnerInstitution = async (req, res) => {
  try {
    const {
      name,
      shortName,
      location,
      address,
      website,
      facebook,
      shortDescription,
      about,
      foundingStory,
      challenges,
      neieaImpact,
      additionalInfo,
      totalStudents,
      established
    } = req.body;

    // Validate required fields
    if (!name || !shortName || !location || !shortDescription || !totalStudents || !established) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check for images
    if (!req.files || !req.files.featuredImage || !req.files.detailImages) {
      return res.status(400).json({
        success: false,
        message: 'Featured image and detail images are required'
      });
    }

    const featuredImage = req.files.featuredImage[0];
    const detailImages = req.files.detailImages;

    // Get the highest display_order
    const lastInstitution = await PartnerInstitution.findOne()
      .sort({ display_order: -1 });
    const display_order = lastInstitution ? lastInstitution.display_order + 1 : 1;

    // Create institution
    const institution = await PartnerInstitution.create({
      name,
      shortName,
      location,
      address,
      website,
      facebook,
      featuredImage: featuredImage.location,
      featuredImageKey: featuredImage.key,
      detailImages: detailImages.map(img => img.location),
      detailImageKeys: detailImages.map(img => img.key),
      shortDescription,
      about,
      foundingStory,
      challenges,
      neieaImpact,
      additionalInfo,
      totalStudents,
      established,
      display_order
    });

    res.status(201).json({
      success: true,
      data: institution,
      message: 'Partner institution created successfully'
    });
  } catch (error) {
    console.error('Error creating partner institution:', error);
    
    // Cleanup uploaded images on error
    if (req.files) {
      if (req.files.featuredImage) {
        await deleteSingleImageFromS3(req.files.featuredImage[0].key);
      }
      if (req.files.detailImages) {
        for (const img of req.files.detailImages) {
          await deleteSingleImageFromS3(img.key);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create partner institution'
    });
  }
};

// @desc    Update partner institution
// @route   PUT /api/admin/partner-institution/:id
// @access  Private/Admin
export const updatePartnerInstitution = async (req, res) => {
  try {
    const institution = await PartnerInstitution.findById(req.params.id);
    
    if (!institution) {
      // Cleanup uploaded images if any
      if (req.files) {
        if (req.files.featuredImage) {
          await deleteSingleImageFromS3(req.files.featuredImage[0].key);
        }
        if (req.files.detailImages) {
          for (const img of req.files.detailImages) {
            await deleteSingleImageFromS3(img.key);
          }
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Partner institution not found'
      });
    }

    // ========================================
    // HANDLE DETAIL IMAGES UPDATE
    // ========================================
    
    let finalDetailImages = [];
    let finalDetailImageKeys = [];
    
    // Step 1: Parse existing images from request (images to keep)
    let existingImagesToKeep = [];
    let existingKeysToKeep = [];
    
    if (req.body.existingDetailImages) {
      try {
        const parsedExisting = JSON.parse(req.body.existingDetailImages);
        existingImagesToKeep = Array.isArray(parsedExisting) ? parsedExisting : [];
        
        // Get corresponding keys for images we're keeping
        existingKeysToKeep = existingImagesToKeep.map(url => {
          const index = institution.detailImages.indexOf(url);
          return index !== -1 ? institution.detailImageKeys[index] : null;
        }).filter(key => key !== null);
        
      } catch (e) {
        console.error('Error parsing existingDetailImages:', e);
      }
    }
    
    // Step 2: Parse images to remove
    let imagesToRemove = [];
    if (req.body.imagesToRemove) {
      try {
        const parsedRemove = JSON.parse(req.body.imagesToRemove);
        imagesToRemove = Array.isArray(parsedRemove) ? parsedRemove : [];
      } catch (e) {
        console.error('Error parsing imagesToRemove:', e);
      }
    }
    
    // Step 3: Delete images from S3 that are marked for removal
    if (imagesToRemove.length > 0) {
      for (const imageInfo of imagesToRemove) {
        if (imageInfo.key) {
          await deleteSingleImageFromS3(imageInfo.key);
          console.log('Deleted image from S3:', imageInfo.key);
        }
      }
    }
    
    // Step 4: Add existing images that we're keeping
    finalDetailImages = [...existingImagesToKeep];
    finalDetailImageKeys = [...existingKeysToKeep];
    
    // Step 5: Add new uploaded images
    if (req.files && req.files.detailImages && req.files.detailImages.length > 0) {
      const newDetailImages = req.files.detailImages;
      const newImageUrls = newDetailImages.map(img => img.location);
      const newImageKeys = newDetailImages.map(img => img.key);
      
      finalDetailImages = [...finalDetailImages, ...newImageUrls];
      finalDetailImageKeys = [...finalDetailImageKeys, ...newImageKeys];
      
      console.log('Added new images:', newImageUrls.length);
    }
    
    // Step 6: Validate that at least one detail image exists
    if (finalDetailImages.length === 0) {
      // Cleanup new uploads if validation fails
      if (req.files && req.files.detailImages) {
        for (const img of req.files.detailImages) {
          await deleteSingleImageFromS3(img.key);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'At least one detail image is required'
      });
    }
    
    // Step 7: Update institution with final image arrays
    institution.detailImages = finalDetailImages;
    institution.detailImageKeys = finalDetailImageKeys;

    // ========================================
    // HANDLE FEATURED IMAGE UPDATE (if provided)
    // ========================================
    
    if (req.files && req.files.featuredImage) {
      const oldFeaturedImageKey = institution.featuredImageKey;
      const newFeaturedImage = req.files.featuredImage[0];
      
      institution.featuredImage = newFeaturedImage.location;
      institution.featuredImageKey = newFeaturedImage.key;
      
      // Delete old featured image
      if (oldFeaturedImageKey) {
        await deleteSingleImageFromS3(oldFeaturedImageKey);
      }
    }

    // ========================================
    // UPDATE TEXT FIELDS
    // ========================================
    
    const updateFields = [
      'name', 'shortName', 'location', 'address', 'website', 'facebook',
      'shortDescription', 'about', 'foundingStory', 'challenges',
      'neieaImpact', 'additionalInfo', 'totalStudents', 'established'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        institution[field] = req.body[field];
      }
    });

    // Save changes
    await institution.save();

    res.status(200).json({
      success: true,
      data: institution,
      message: 'Partner institution updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating partner institution:', error);
    
    // Cleanup new uploaded images on error
    if (req.files) {
      if (req.files.featuredImage) {
        await deleteSingleImageFromS3(req.files.featuredImage[0].key);
      }
      if (req.files.detailImages) {
        for (const img of req.files.detailImages) {
          await deleteSingleImageFromS3(img.key);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update partner institution'
    });
  }
};

// @desc    Delete partner institution
// @route   DELETE /api/admin/partner-institution/:id
// @access  Private/Admin
export const deletePartnerInstitution = async (req, res) => {
  try {
    const institution = await PartnerInstitution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Partner institution not found'
      });
    }

    // Delete featured image from S3
    if (institution.featuredImageKey) {
      await deleteSingleImageFromS3(institution.featuredImageKey);
    }

    // Delete detail images from S3
    if (institution.detailImageKeys && institution.detailImageKeys.length > 0) {
      for (const key of institution.detailImageKeys) {
        await deleteSingleImageFromS3(key);
      }
    }

    await institution.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Partner institution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting partner institution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete partner institution'
    });
  }
};

// @desc    Reorder partner institutions
// @route   PUT /api/admin/partner-institution/reorder
// @access  Private/Admin
export const reorderPartnerInstitutions = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reorder data'
      });
    }

    // Update display_order for each institution
    const updatePromises = items.map(item => 
      PartnerInstitution.findByIdAndUpdate(
        item.id,
        { display_order: item.display_order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Partner institutions reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering partner institutions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder partner institutions'
    });
  }
};

// ============================================
// CAREER PAGE ADMIN FUNCTIONS
// ============================================

// Get career page data (Admin)
export const getCareerPageAdmin = async (req, res) => {
  try {
    const careerPage = await CareerPage.findOne({ is_active: true });
    
    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page data not found'
      });
    }
    
    // Sort benefits by display_order, fallback to creation order if all have same order
    if (careerPage.whyWorkSection && careerPage.whyWorkSection.benefits) {
      careerPage.whyWorkSection.benefits.sort((a, b) => {
        const orderA = a.display_order || 0;
        const orderB = b.display_order || 0;
        
        // If both have same order (like 0), sort by _id to maintain consistent order
        if (orderA === orderB) {
          return a._id.toString().localeCompare(b._id.toString());
        }
        
        return orderA - orderB;
      });
    }
    
    res.status(200).json({
      success: true,
      data: careerPage
    });
  } catch (error) {
    console.error('Error fetching career page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career page data',
      error: error.message
    });
  }
};

// Create career page (Admin - first time setup)
export const createCareerPage = async (req, res) => {
  try {
    const {
      introduction,
      whyWorkSection,
      openingsSection,
      closingSection
    } = req.body;

    // Validation
    if (!introduction || !whyWorkSection || !openingsSection || !closingSection) {
      return res.status(400).json({
        success: false,
        message: 'All sections are required'
      });
    }

    // Validate email in openingsSection.contactInfo
    if (openingsSection.contactInfo && openingsSection.contactInfo.email) {
      if (!validator.isEmail(openingsSection.contactInfo.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address in contact information'
        });
      }
    }

    // Check if career page already exists
    const existingPage = await CareerPage.findOne();
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Career page already exists. Use update endpoint instead.'
      });
    }

    // Create new career page
    const newCareerPage = new CareerPage({
      introduction,
      whyWorkSection,
      openingsSection,
      closingSection
    });

    await newCareerPage.save();

    res.status(201).json({
      success: true,
      message: 'Career page created successfully',
      data: newCareerPage
    });
  } catch (error) {
    console.error('Error creating career page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create career page',
      error: error.message
    });
  }
};

// Update career page (Admin)
export const updateCareerPage = async (req, res) => {
  try {
    const {
      introduction,
      whyWorkSection,
      openingsSection,
      closingSection
    } = req.body;

    // Validate email if provided
    if (openingsSection?.contactInfo?.email) {
      if (!validator.isEmail(openingsSection.contactInfo.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address in contact information'
        });
      }
    }

    // Find and update the active career page
    const careerPage = await CareerPage.findOneAndUpdate(
      { is_active: true },
      {
        $set: {
          introduction,
          whyWorkSection,
          openingsSection,
          closingSection
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found. Create one first.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Career page updated successfully',
      data: careerPage
    });
  } catch (error) {
    console.error('Error updating career page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update career page',
      error: error.message
    });
  }
};

// Update specific section (Admin)
export const updateCareerPageSection = async (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = req.body;

    const validSections = ['introduction', 'whyWorkSection', 'openingsSection', 'closingSection'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section name'
      });
    }

    // Validate email if updating openingsSection
    if (section === 'openingsSection' && sectionData.contactInfo?.email) {
      if (!validator.isEmail(sectionData.contactInfo.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address in contact information'
        });
      }
    }

    const updateObject = {};
    updateObject[section] = sectionData;

    const careerPage = await CareerPage.findOneAndUpdate(
      { is_active: true },
      { $set: updateObject },
      {
        new: true,
        runValidators: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `${section} updated successfully`,
      data: careerPage
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update section',
      error: error.message
    });
  }
};

// Add benefit to whyWorkSection (Admin)
export const addCareerBenefit = async (req, res) => {
  try {
    const { icon, title, description } = req.body;

    if (!icon || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Icon, title, and description are required'
      });
    }

    const careerPage = await CareerPage.findOneAndUpdate(
      { is_active: true },
      {
        $push: {
          'whyWorkSection.benefits': { icon, title, description }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Benefit added successfully',
      data: careerPage
    });
  } catch (error) {
    console.error('Error adding benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add benefit',
      error: error.message
    });
  }
};

// Update benefit in whyWorkSection (Admin)
export const updateCareerBenefit = async (req, res) => {
  try {
    const { benefitId } = req.params;
    const { icon, title, description } = req.body;

    if (!benefitId) {
      return res.status(400).json({
        success: false,
        message: 'Benefit ID is required'
      });
    }

    const updateFields = {};
    if (icon) updateFields['whyWorkSection.benefits.$.icon'] = icon;
    if (title) updateFields['whyWorkSection.benefits.$.title'] = title;
    if (description) updateFields['whyWorkSection.benefits.$.description'] = description;

    const careerPage = await CareerPage.findOneAndUpdate(
      { 
        is_active: true,
        'whyWorkSection.benefits._id': benefitId
      },
      {
        $set: updateFields
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page or benefit not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Benefit updated successfully',
      data: careerPage
    });
  } catch (error) {
    console.error('Error updating benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update benefit',
      error: error.message
    });
  }
};

// Delete benefit from whyWorkSection (Admin)
export const deleteCareerBenefit = async (req, res) => {
  try {
    const { benefitId } = req.params;

    if (!benefitId) {
      return res.status(400).json({
        success: false,
        message: 'Benefit ID is required'
      });
    }

    const careerPage = await CareerPage.findOneAndUpdate(
      { is_active: true },
      {
        $pull: {
          'whyWorkSection.benefits': { _id: benefitId }
        }
      },
      {
        new: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Benefit deleted successfully',
      data: careerPage
    });
  } catch (error) {
    console.error('Error deleting benefit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete benefit',
      error: error.message
    });
  }
};

// Add job category to openingsSection (Admin)
export const addCareerJobCategory = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const careerPage = await CareerPage.findOneAndUpdate(
      { is_active: true },
      {
        $addToSet: {
          'openingsSection.jobCategories': category.trim()
        }
      },
      {
        new: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job category added successfully',
      data: careerPage
    });
  } catch (error) {
    console.error('Error adding job category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add job category',
      error: error.message
    });
  }
};

// Delete job category from openingsSection (Admin)
export const deleteCareerJobCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const careerPage = await CareerPage.findOneAndUpdate(
      { is_active: true },
      {
        $pull: {
          'openingsSection.jobCategories': category
        }
      },
      {
        new: true
      }
    );

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job category deleted successfully',
      data: careerPage
    });
  } catch (error) {
    console.error('Error deleting job category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job category',
      error: error.message
    });
  }
};

// Delete career page (Admin - use with caution)
export const deleteCareerPage = async (req, res) => {
  try {
    const careerPage = await CareerPage.findOneAndDelete({ is_active: true });

    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Career page deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting career page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete career page',
      error: error.message
    });
  }
};

// ============================================
// GLOBAL PARTNERS ADMIN FUNCTIONS
// ============================================

// @desc    Get all global partners (Admin)
// @route   GET /api/admin/global-partners
// @access  Private/Admin
export const getAllGlobalPartners = async (req, res) => {
  try {
    const partners = await GlobalPartner.find()
      .sort({ display_order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error fetching global partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global partners'
    });
  }
};

// @desc    Get single global partner by ID (Admin)
// @route   GET /api/admin/global-partners/:id
// @access  Private/Admin
export const getGlobalPartnerById = async (req, res) => {
  try {
    const partner = await GlobalPartner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Global partner not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching global partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global partner'
    });
  }
};

// @desc    Create new global partner
// @route   POST /api/admin/global-partners
// @access  Private/Admin
export const createGlobalPartner = async (req, res) => {
  try {
    const {
      name,
      shortName,
      location,
      website,
      shortDescription,
      about,
      collaboration,
      impact,
      programs
    } = req.body;

    // Validate required fields
    if (!name || !shortName || !location || !shortDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check for images
    if (!req.files || !req.files.featuredImage || !req.files.detailImages) {
      return res.status(400).json({
        success: false,
        message: 'Featured image and detail images are required'
      });
    }

    const featuredImage = req.files.featuredImage[0];
    const detailImages = req.files.detailImages;

    // Parse programs if provided as JSON string
    let parsedPrograms = [];
    if (programs) {
      try {
        parsedPrograms = JSON.parse(programs);
        if (!Array.isArray(parsedPrograms)) {
          parsedPrograms = [programs];
        }
      } catch (e) {
        parsedPrograms = [programs];
      }
    }

    // Get the highest display_order
    const lastPartner = await GlobalPartner.findOne()
      .sort({ display_order: -1 });
    const display_order = lastPartner ? lastPartner.display_order + 1 : 1;

    // Create partner
    const partner = await GlobalPartner.create({
      name,
      shortName,
      location,
      website,
      featuredImage: featuredImage.location,
      featuredImageKey: featuredImage.key,
      detailImages: detailImages.map(img => img.location),
      detailImageKeys: detailImages.map(img => img.key),
      shortDescription,
      about,
      collaboration,
      impact,
      programs: parsedPrograms,
      display_order
    });

    res.status(201).json({
      success: true,
      data: partner,
      message: 'Global partner created successfully'
    });
  } catch (error) {
    console.error('Error creating global partner:', error);
    
    // Cleanup uploaded images on error
    if (req.files) {
      if (req.files.featuredImage) {
        await deleteSingleImageFromS3(req.files.featuredImage[0].key);
      }
      if (req.files.detailImages) {
        for (const img of req.files.detailImages) {
          await deleteSingleImageFromS3(img.key);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create global partner'
    });
  }
};

// @desc    Update global partner
// @route   PUT /api/admin/global-partners/:id
// @access  Private/Admin
export const updateGlobalPartner = async (req, res) => {
  try {
    const partner = await GlobalPartner.findById(req.params.id);
    
    if (!partner) {
      // Cleanup uploaded images if any
      if (req.files) {
        if (req.files.featuredImage) {
          await deleteSingleImageFromS3(req.files.featuredImage[0].key);
        }
        if (req.files.detailImages) {
          for (const img of req.files.detailImages) {
            await deleteSingleImageFromS3(img.key);
          }
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Global partner not found'
      });
    }

    // ========================================
    // HANDLE DETAIL IMAGES UPDATE
    // ========================================
    
    let finalDetailImages = [];
    let finalDetailImageKeys = [];
    
    // Step 1: Parse existing images from request (images to keep)
    let existingImagesToKeep = [];
    let existingKeysToKeep = [];
    
    if (req.body.existingDetailImages) {
      try {
        const parsedExisting = JSON.parse(req.body.existingDetailImages);
        existingImagesToKeep = Array.isArray(parsedExisting) ? parsedExisting : [];
        
        // Get corresponding keys for images we're keeping
        existingKeysToKeep = existingImagesToKeep.map(url => {
          const index = partner.detailImages.indexOf(url);
          return index !== -1 ? partner.detailImageKeys[index] : null;
        }).filter(key => key !== null);
        
      } catch (e) {
        console.error('Error parsing existingDetailImages:', e);
      }
    }
    
    // Step 2: Parse images to remove
    let imagesToRemove = [];
    if (req.body.imagesToRemove) {
      try {
        const parsedRemove = JSON.parse(req.body.imagesToRemove);
        imagesToRemove = Array.isArray(parsedRemove) ? parsedRemove : [];
      } catch (e) {
        console.error('Error parsing imagesToRemove:', e);
      }
    }
    
    // Step 3: Delete images from S3 that are marked for removal
    if (imagesToRemove.length > 0) {
      for (const imageInfo of imagesToRemove) {
        if (imageInfo.key) {
          await deleteSingleImageFromS3(imageInfo.key);
          console.log('Deleted image from S3:', imageInfo.key);
        }
      }
    }
    
    // Step 4: Add existing images that we're keeping
    finalDetailImages = [...existingImagesToKeep];
    finalDetailImageKeys = [...existingKeysToKeep];
    
    // Step 5: Add new uploaded images
    if (req.files && req.files.detailImages && req.files.detailImages.length > 0) {
      const newDetailImages = req.files.detailImages;
      const newImageUrls = newDetailImages.map(img => img.location);
      const newImageKeys = newDetailImages.map(img => img.key);
      
      finalDetailImages = [...finalDetailImages, ...newImageUrls];
      finalDetailImageKeys = [...finalDetailImageKeys, ...newImageKeys];
      
      console.log('Added new images:', newImageUrls.length);
    }
    
    // Step 6: Validate that at least one detail image exists
    if (finalDetailImages.length === 0) {
      // Cleanup new uploads if validation fails
      if (req.files && req.files.detailImages) {
        for (const img of req.files.detailImages) {
          await deleteSingleImageFromS3(img.key);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'At least one detail image is required'
      });
    }
    
    // Step 7: Update partner with final image arrays
    partner.detailImages = finalDetailImages;
    partner.detailImageKeys = finalDetailImageKeys;

    // ========================================
    // HANDLE FEATURED IMAGE UPDATE (if provided)
    // ========================================
    
    if (req.files && req.files.featuredImage) {
      const oldFeaturedImageKey = partner.featuredImageKey;
      const newFeaturedImage = req.files.featuredImage[0];
      
      partner.featuredImage = newFeaturedImage.location;
      partner.featuredImageKey = newFeaturedImage.key;
      
      // Delete old featured image
      if (oldFeaturedImageKey) {
        await deleteSingleImageFromS3(oldFeaturedImageKey);
      }
    }

    // ========================================
    // UPDATE TEXT FIELDS
    // ========================================
    
    const updateFields = [
      'name', 'shortName', 'location', 'website',
      'shortDescription', 'about', 'collaboration', 'impact'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        partner[field] = req.body[field];
      }
    });

    // Handle programs separately (parse JSON)
    if (req.body.programs !== undefined) {
      try {
        let parsedPrograms = JSON.parse(req.body.programs);
        if (!Array.isArray(parsedPrograms)) {
          parsedPrograms = [req.body.programs];
        }
        partner.programs = parsedPrograms;
      } catch (e) {
        partner.programs = [req.body.programs];
      }
    }

    // Save changes
    await partner.save();

    res.status(200).json({
      success: true,
      data: partner,
      message: 'Global partner updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating global partner:', error);
    
    // Cleanup new uploaded images on error
    if (req.files) {
      if (req.files.featuredImage) {
        await deleteSingleImageFromS3(req.files.featuredImage[0].key);
      }
      if (req.files.detailImages) {
        for (const img of req.files.detailImages) {
          await deleteSingleImageFromS3(img.key);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update global partner'
    });
  }
};

// @desc    Delete global partner
// @route   DELETE /api/admin/global-partners/:id
// @access  Private/Admin
export const deleteGlobalPartner = async (req, res) => {
  try {
    const partner = await GlobalPartner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Global partner not found'
      });
    }

    // Delete featured image from S3
    if (partner.featuredImageKey) {
      await deleteSingleImageFromS3(partner.featuredImageKey);
    }

    // Delete detail images from S3
    if (partner.detailImageKeys && partner.detailImageKeys.length > 0) {
      for (const key of partner.detailImageKeys) {
        await deleteSingleImageFromS3(key);
      }
    }

    await partner.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Global partner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting global partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete global partner'
    });
  }
};

// @desc    Reorder global partners
// @route   PUT /api/admin/global-partners/reorder
// @access  Private/Admin
export const reorderGlobalPartners = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reorder data'
      });
    }

    // Update display_order for each partner
    const updatePromises = items.map(item => 
      GlobalPartner.findByIdAndUpdate(
        item.id,
        { display_order: item.display_order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Global partners reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering global partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder global partners'
    });
  }
};

