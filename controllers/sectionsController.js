import Section from '../models/Section.js';

// Get all bullet points for a page (Public)
export const getSectionsByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const sections = await Section.find({ page });
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};