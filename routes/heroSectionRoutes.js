import express from 'express';
import { getHeroSectionByPage } from '../controllers/heroSectionController.js';

const heroSectionRoutes = express.Router();

// Public (frontend)
heroSectionRoutes.get('/:page', getHeroSectionByPage);

export default heroSectionRoutes;