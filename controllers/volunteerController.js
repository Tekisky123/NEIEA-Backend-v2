import Volunteer from "../models/Volunteer.js";

// Create a new volunteer

// Create a new volunteer
export const createVolunteer = async (req, res) => {
    try {
        if (req.body.volunteerField !== "Social Media Management") {
            req.body.socialMedia = undefined; // Remove socialMedia if not needed
        }

        const volunteerExist = await Volunteer.findOne({email:req.body.email});

        if(volunteerExist){
            return res.status(400).json({ success: false, errors: "Volunteer already exist" });
        }
        const volunteer = new Volunteer(req.body);
        await volunteer.save();
        res.status(201).json({ success: true, data: volunteer });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};



// Get all volunteers
export const getAllVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find();
        res.status(200).json({ success: true, data: volunteers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get a single volunteer
export const getVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, error: "Volunteer not found" });
        }
        res.status(200).json({ success: true, data: volunteer });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};