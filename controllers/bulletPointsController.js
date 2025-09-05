import BulletPoint from '../models/BulletPoint.js';

// Get all bullet points for a page (Public)
export const getBulletPointsByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const bulletPoints = await BulletPoint.find({ page });
    res.json({ success: true, data: bulletPoints });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};