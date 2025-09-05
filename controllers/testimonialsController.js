import Testimonial from '../models/Testimonial.js';

// Get all testimonials for a page (Public)
export const getTestimonialsByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const testimonials = await Testimonial.find({ page });
    res.json({ success: true, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};