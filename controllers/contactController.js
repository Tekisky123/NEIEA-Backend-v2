import Contact from "../models/Contact.js";

export const createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, state, subject, message } = req.body;

    const newContact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      state,
      subject,
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
