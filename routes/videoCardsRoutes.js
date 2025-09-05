import express from 'express';
import { getVideoCardsByPage } from '../controllers/videoCardController.js';

const videoCardsRoutes = express.Router();

// Public (frontend)
videoCardsRoutes.get('/:page', getVideoCardsByPage);

export default videoCardsRoutes;