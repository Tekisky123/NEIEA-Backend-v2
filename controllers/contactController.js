import Contact from "../models/Contact.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, affiliation, inquiryType, message } = req.body;

    // Validate required fields
    if (!name || !email || !inquiryType || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, inquiry type, and message are required fields.",
      });
    }

    const newContact = new Contact({
      name,
      email,
      affiliation: affiliation || "", // Default to empty string if not provided
      inquiryType,
      message,
    });

    await newContact.save();

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
