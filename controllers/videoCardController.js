import VideoCard from '../models/VideoCard.js';

// Get all video cards for a page
export const getVideoCardsByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const cards = await VideoCard.find({ page });
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};