import express from "express";
const volunteerRoutes = express.Router();
import {
    createVolunteer,
    getAllVolunteers,
    getVolunteer,
} from "../controllers/volunteerController.js";
import validateVolunteer  from "../middleware/validateVolunteer.js";

// Create a new volunteer
volunteerRoutes.post("/", validateVolunteer, createVolunteer);

// Get all volunteers
volunteerRoutes.get("/", getAllVolunteers);

// Get a single volunteer
volunteerRoutes.get("/:id", getVolunteer);

export default volunteerRoutes;
