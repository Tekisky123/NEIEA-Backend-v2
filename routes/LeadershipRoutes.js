import express from 'express';
import {
    getPublicLeadership,
    getMemberBio,
    getLeadershipByCategory

} from '../controllers/LeadershipController.js';

const LeadershipRoutes = express.Router();

LeadershipRoutes.get('/', getPublicLeadership);
LeadershipRoutes.get('/category/:category', getLeadershipByCategory);
LeadershipRoutes.get('/bio/:slug', getMemberBio);

export default LeadershipRoutes;

