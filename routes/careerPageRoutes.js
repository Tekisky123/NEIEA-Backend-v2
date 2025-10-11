import express from 'express';
import { getCareerPage } from '../controllers/careerPageController.js';

const careerPageRoutes = express.Router();

// Public route
careerPageRoutes.get('/', getCareerPage);

export default careerPageRoutes;
