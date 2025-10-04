import express from 'express';
import {
  createAdmin,
  assignStudent,
  updateStudentProgress,
  createCourse,
  getAllCourses,
  getAllDonors,
  loginAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  updateCourse,
  deleteCourse,
  getAllInstitutions,
  createOrUpdateCarousel,
  addVideoCard,
  updateVideoCard,
  deleteVideoCard,
  
  addHeroSection,
  updateHeroSection,
  deleteHeroSection,
  
  addBulletPoint,
  updateBulletPoint,
  deleteBulletPoint,
  
  // addTestimonial,
  // updateTestimonial,
  // deleteTestimonial,
  
  addSection,
  updateSection,
  deleteSection,
  getAllSections,
  getSectionById,

  addReferredBy,
  getOneReferredBy,
  updateReferredBy,
  deleteReferredBy,

  downloadBackup,
  getHomepageContent,
  getAllCardTestimonials,
  createCardTestimonial,
  updateCardTestimonial,
  deleteCardTestimonial,
  getAllVideoTestimonials,
  createVideoTestimonial,
  updateVideoTestimonial,
  deleteVideoTestimonial,
  reorderTestimonials
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload, { uploadCarouselImages, uploadSectionsImage, uploadVideoThumbnail } from '../middleware/upload.js';

const adminRoutes = express.Router();

adminRoutes.post('/auth/login',  loginAdmin);
adminRoutes.post('/create-admin', protect, createAdmin);
adminRoutes.put('/edit/:id', protect, updateAdmin);
adminRoutes.delete('/delete/:id', protect, deleteAdmin);
adminRoutes.get('/getAll-admin', protect, getAllAdmins);
adminRoutes.get('/get-admin', protect, getAdmin);
adminRoutes.post('/assign-student', protect, assignStudent);
adminRoutes.put('/update-student-progress', protect, updateStudentProgress);
adminRoutes.post('/courses', protect, upload, createCourse);
adminRoutes.get('/courses', protect, getAllCourses);
adminRoutes.put('/courses/edit/:courseId', protect, upload, updateCourse);

adminRoutes.get('/donors', protect, getAllDonors);
// adminRoutes.get('/donations', protect, getAllDonations);
adminRoutes.get('/institutions', protect, getAllInstitutions);

adminRoutes.delete('/courses/delete/:courseId', protect, deleteCourse);
adminRoutes.post('/carousel', protect, uploadCarouselImages, createOrUpdateCarousel);

adminRoutes.post('/video-cards', protect, uploadVideoThumbnail, addVideoCard);
adminRoutes.put('/video-cards/:id', protect,uploadVideoThumbnail, updateVideoCard);
adminRoutes.delete('/video-cards/:id', protect, deleteVideoCard);

adminRoutes.post('/hero-section', protect, addHeroSection);
adminRoutes.put('/hero-section/:id', protect, updateHeroSection);
adminRoutes.delete('/hero-section/:id', protect, deleteHeroSection);

adminRoutes.post('/bullet-points', protect, addBulletPoint);
adminRoutes.put('/bullet-points/:id', protect, updateBulletPoint);
adminRoutes.delete('/bullet-points/:id', protect, deleteBulletPoint);

// adminRoutes.post('/testimonials', protect, addTestimonial);
// adminRoutes.put('/testimonials/:id', protect, updateTestimonial);
// adminRoutes.delete('/testimonials/:id', protect, deleteTestimonial);

// Sections Admin Routes
adminRoutes.post('/sections', protect, uploadSectionsImage, addSection);
adminRoutes.get('/sections', protect, getAllSections);
adminRoutes.get('/sections/:id', protect, getSectionById);
adminRoutes.put('/sections/:id', protect, uploadSectionsImage, updateSection);
adminRoutes.delete('/sections/:id', protect, deleteSection);

// Referred By Admin Routes
adminRoutes.post('/referred-by', protect, addReferredBy);
adminRoutes.get('/referred-by/:id', protect, getOneReferredBy);
adminRoutes.put('/referred-by/:id', protect, updateReferredBy);
adminRoutes.delete('/referred-by/:id', protect, deleteReferredBy);

adminRoutes.get('/db-backup', protect, downloadBackup);

adminRoutes.get('/home', protect, getHomepageContent);
// adminRoutes.get('/home', protect, getHomepageContent);

// V3 Dynamic Things

// Testimonials Routes -----------------------------------------------------

// CARD TESTIMONIALS
adminRoutes.get('/testimonials/cards', protect ,getAllCardTestimonials);
adminRoutes.post('/testimonials/cards', protect ,createCardTestimonial);
adminRoutes.put('/testimonials/cards/:id', protect, updateCardTestimonial);
adminRoutes.delete('/testimonials/cards/:id', protect, deleteCardTestimonial);

// CARD TESTIMONIALS
adminRoutes.get('/testimonials/videos', protect, getAllVideoTestimonials);
adminRoutes.post('/testimonials/videos', protect ,createVideoTestimonial);
adminRoutes.put('/testimonials/videos/:id', protect, updateVideoTestimonial);
adminRoutes.delete('/testimonials/videos/:id', protect, deleteVideoTestimonial);

// Reorder
adminRoutes.put('/testimonials/reorder', protect, reorderTestimonials);
// ----------------------------------------------------------------------------

// Leadership Routes -----------------------------------------------------
// router.get('/leadership', protect, getLeadershipMembers);
// router.post('/leadership', protect, createLeadershipMember);
// router.put('/leadership/:id', protect, updateLeadershipMember);
// router.delete('/leadership/:id', protect, deleteLeadershipMember);
// router.put('/leadership/reorder', protect, reorderLeadershipMembers);

export default adminRoutes;
