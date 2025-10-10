import express from 'express';
import {
    getAllPublicPartnerInstitutions   ,
    getPartnerInstitutionBySlug,

} from '../controllers/partnerInstitutionController.js';

const partnerInstitutionRoutes = express.Router();

partnerInstitutionRoutes.get('/', getAllPublicPartnerInstitutions);
partnerInstitutionRoutes.get('/info/:slug', getPartnerInstitutionBySlug);

export default partnerInstitutionRoutes;

