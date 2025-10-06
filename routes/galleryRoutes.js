import express from 'express';
import {
    getPublicGalleryItems,
  getGalleryCategories,
  getPublicGalleryItemById,
  getRecentGalleryItems

} from '../controllers/galleryController.js';

const galleryRoutes = express.Router();

galleryRoutes.get('/', getPublicGalleryItems);
galleryRoutes.get('/categories', getGalleryCategories);
galleryRoutes.get('/recent', getRecentGalleryItems);
galleryRoutes.get('/:id', getPublicGalleryItemById);

export default galleryRoutes;

