import express from 'express';
import { getSectionsByPage } from '../controllers/sectionsController.js';

const sectionsRoutes = express.Router();

// Public (frontend)
sectionsRoutes.get('/:page', getSectionsByPage);

export default sectionsRoutes;