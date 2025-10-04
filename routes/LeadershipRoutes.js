import express from 'express';
import {
    // getPublicLeadershipMembers,
    getMemberBio,

} from '../controllers/LeadershipController.js';

const LeadershipRoutes = express.Router();

// router.get('/', getPublicLeadershipMembers);
LeadershipRoutes.get('/bio/:slug', getMemberBio);

export default LeadershipRoutes;

