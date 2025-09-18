import Volunteer from "../models/Volunteer.js";

// Create a new volunteer

export const createVolunteer = async (req, res) => {
  try {
    // Run your manual validation first
    validateVolunteer(req, res, async () => {
      try {
        // Remove socialMedia if not needed
        if (req.body.volunteerField !== "Social Media Management") {
          req.body.socialMedia = undefined;
        }

        const volunteerExist = await Volunteer.find({email:req.body.email});

        if(volunteerExist){
            return res.status(400).json({ success: false, errors: "Volunteer already exist" });
        }

        
        const volunteer = new Volunteer(req.body);
        await volunteer.save();
        res.status(201).json({ success: true, data: volunteer });
      } catch (error) {
        // Handle Mongoose duplicate key error (e.g., duplicate email)
        if (error.name === 'MongoServerError' && error.code === 11000) {
          const field = Object.keys(error.keyPattern)[0]; // Extract the duplicate field (e.g., "email")
          return res.status(400).json({
            success: false,
            errors: {
              [field]: `${field} already exists. Please use a different ${field}.`,
            },
          });
        }
        // Handle other Mongoose validation errors (fallback)
        else if (error.name === 'ValidationError') {
          const mongooseErrors = {};
          Object.values(error.errors).forEach((err) => {
            mongooseErrors[err.path] = err.message;
          });
          return res.status(400).json({ success: false, errors: mongooseErrors });
        }
        // Generic server error
        else {
          return res.status(500).json({ success: false, error: 'Internal server error' });
        }
      }
    });
  } catch (error) {
    // This catches errors from validateVolunteer (though unlikely, as it uses `next()`)
    res.status(500).json({ success: false, error: 'Validation error' });
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