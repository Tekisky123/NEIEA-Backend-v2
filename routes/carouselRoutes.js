import express from 'express';
import { getCarousel } from '../controllers/carouselController.js';

const carouselRoutes = express.Router();

// Public route to get carousel for a specific page
carouselRoutes.get('/:page', getCarousel);

export default carouselRoutes;
