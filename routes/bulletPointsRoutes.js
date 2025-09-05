import express from 'express';
import { getBulletPointsByPage } from '../controllers/bulletPointsController.js';

const bulletPointsRoutes = express.Router();

// Public (frontend)
bulletPointsRoutes.get('/:page', getBulletPointsByPage);

export default bulletPointsRoutes;