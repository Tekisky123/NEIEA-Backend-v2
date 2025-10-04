import express from 'express';
import {
    getAllCardTestimonials,
    getAllVideoTestimonials,

} from '../controllers/testimonialsController.js';

const testimonialsRoutes = express.Router();

// Card Testimonials
testimonialsRoutes.get('/cards', getAllCardTestimonials);;

// Video Testimonials
testimonialsRoutes.get('/videos', getAllVideoTestimonials);

export default testimonialsRoutes;