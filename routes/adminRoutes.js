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
  reorderTestimonials,

  getAllLeadership,
  getLeadershipById,
  createLeadership,
  updateLeadership,
  deleteLeadership,
  reorderLeadership,
  getAllGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGalleryItems,
  toggleGalleryItemStatus,
  getAllPartnerInstitutions,
  reorderPartnerInstitutions,
  createPartnerInstitution,
  updatePartnerInstitution,
  deletePartnerInstitution,
  getAllGlobalPartners,
  getGlobalPartnerById,
  createGlobalPartner,
  updateGlobalPartner,
  deleteGlobalPartner,
  reorderGlobalPartners,
  getCareerPageAdmin,
  createCareerPage,
  updateCareerPage,
  updateCareerPageSection,
  addCareerBenefit,
  updateCareerBenefit,
  deleteCareerBenefit,
  addCareerJobCategory,
  deleteCareerJobCategory,
  deleteCareerPage
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload, { uploadCarouselImages, uploadGalleryImage, uploadLeadershipImage, uploadPartnerInstitutionImages, uploadSectionsImage, uploadTestimonialsImage, uploadVideoThumbnail } from '../middleware/upload.js';

const adminRoutes = express.Router();

adminRoutes.post('/auth/login', loginAdmin);
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
adminRoutes.put('/video-cards/:id', protect, uploadVideoThumbnail, updateVideoCard);
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
adminRoutes.get('/testimonials/cards', protect, getAllCardTestimonials);
adminRoutes.post('/testimonials/cards', protect, uploadTestimonialsImage, createCardTestimonial);
adminRoutes.put('/testimonials/cards/:id', protect, uploadTestimonialsImage, updateCardTestimonial);
adminRoutes.delete('/testimonials/cards/:id', protect, deleteCardTestimonial);

// CARD TESTIMONIALS
adminRoutes.get('/testimonials/videos', protect, getAllVideoTestimonials);
adminRoutes.post('/testimonials/videos', protect, createVideoTestimonial);
adminRoutes.put('/testimonials/videos/:id', protect, updateVideoTestimonial);
adminRoutes.delete('/testimonials/videos/:id', protect, deleteVideoTestimonial);

// Reorder
adminRoutes.put('/testimonials/reorder', protect, reorderTestimonials);
// ----------------------------------------------------------------------------

// Leadership Routes -----------------------------------------------------

adminRoutes.get('/leadership', protect, getAllLeadership);
adminRoutes.get('/leadership/:id', protect, getLeadershipById);
adminRoutes.post('/leadership', protect, uploadLeadershipImage, createLeadership);
adminRoutes.put('/leadership/:id', protect, uploadLeadershipImage, updateLeadership);
adminRoutes.delete('/leadership/:id', protect, deleteLeadership);
adminRoutes.post('/leadership/reorder', protect, reorderLeadership);

// Gallery Routes -----------------------------------------------------
adminRoutes.get('/gallery', protect, getAllGalleryItems);
adminRoutes.put('/gallery/reorder', protect, reorderGalleryItems);
adminRoutes.get('/gallery/:id', protect, getGalleryItemById);
adminRoutes.post('/gallery', protect, uploadGalleryImage, createGalleryItem);
adminRoutes.put('/gallery/:id', protect, uploadGalleryImage, updateGalleryItem);
adminRoutes.delete('/gallery/:id', protect, deleteGalleryItem);
adminRoutes.put('/gallery/:id/toggle-status', protect, toggleGalleryItemStatus);

// Partner Institution Routes -----------------------------------------------------
adminRoutes.get('/partner-institution', protect, getAllPartnerInstitutions);
adminRoutes.put('/partner-institution/reorder', protect, reorderPartnerInstitutions);
adminRoutes.post('/partner-institution', protect, uploadPartnerInstitutionImages ,createPartnerInstitution);
adminRoutes.put('/partner-institution/:id', protect, uploadPartnerInstitutionImages ,updatePartnerInstitution);
adminRoutes.delete('/partner-institution/:id', protect, deletePartnerInstitution);

// Global Partners Routes -----------------------------------------------------
adminRoutes.get('/global-partners', protect, getAllGlobalPartners);
adminRoutes.post('/global-partners', protect, uploadPartnerInstitutionImages, createGlobalPartner);
adminRoutes.put('/global-partners/reorder', protect, reorderGlobalPartners);
adminRoutes.get('/global-partners/:id', protect, getGlobalPartnerById);
adminRoutes.put('/global-partners/:id', protect, uploadPartnerInstitutionImages, updateGlobalPartner);
adminRoutes.delete('/global-partners/:id', protect, deleteGlobalPartner);

// Career Page Routes -----------------------------------------------------
adminRoutes.get('/career-page', protect, getCareerPageAdmin);
adminRoutes.post('/career-page', protect, createCareerPage);
adminRoutes.put('/career-page', protect, updateCareerPage);
adminRoutes.put('/career-page/section/:section', protect, updateCareerPageSection);
adminRoutes.delete('/career-page', protect, deleteCareerPage);

// Career Page - Benefit management
adminRoutes.post('/career-page/benefit', protect, addCareerBenefit);
adminRoutes.put('/career-page/benefit/:benefitId', protect, updateCareerBenefit);
adminRoutes.delete('/career-page/benefit/:benefitId', protect, deleteCareerBenefit);

// Career Page - Job category management
adminRoutes.post('/career-page/job-category', protect, addCareerJobCategory);
adminRoutes.delete('/career-page/job-category/:category', protect, deleteCareerJobCategory);

export default adminRoutes;
