import HeroSection from '../models/HeroSection.js';

// Get all video cards for a page
export const getHeroSectionByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const headings = await HeroSection.find({ page });
    res.json({ success: true, data: headings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};