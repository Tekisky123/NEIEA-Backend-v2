import express from 'express';
import { getTestimonialsByPage } from '../controllers/testimonialsController.js';

const testimonialsRoutes = express.Router();

// Public (frontend)
testimonialsRoutes.get('/:page', getTestimonialsByPage);

export default testimonialsRoutes;