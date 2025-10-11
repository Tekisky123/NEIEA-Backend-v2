import express from 'express';
import {
    getAllPublicGlobalPartners,
    getGlobalPartnerBySlug,
} from '../controllers/globalPartnersPageController.js';

const globalPartnersPageRoutes = express.Router();

globalPartnersPageRoutes.get('/', getAllPublicGlobalPartners);
globalPartnersPageRoutes.get('/info/:slug', getGlobalPartnerBySlug);

export default globalPartnersPageRoutes;
