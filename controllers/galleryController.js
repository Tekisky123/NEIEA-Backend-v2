import GalleryItem from '../models/GalleryItem.js';
import validator from 'validator';

// GET /api/gallery - Get all active gallery items (Public)
export const getPublicGalleryItems = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    
    let query = { is_active: true };
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await GalleryItem.find(query)
      .sort({ display_order: 1, created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title description image category display_order year created_at')
      .lean();
    
    const total = await GalleryItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching public gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items',
      error: error.message
    });
  }
};

// GET /api/gallery/categories - Get gallery categories with counts (Public)
export const getGalleryCategories = async (req, res) => {
  try {
    const categories = await GalleryItem.aggregate([
      { $match: { is_active: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 } 
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const categoryData = categories.map(cat => ({
      id: cat._id,
      name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
      count: cat.count
    }));
    
    // Add 'all' category
    const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);
    categoryData.unshift({
      id: 'all',
      name: 'All Images',
      count: totalCount
    });
    
    res.status(200).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Error fetching gallery categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery categories',
      error: error.message
    });
  }
};

// GET /api/gallery/:id - Get single gallery item (Public)
export const getPublicGalleryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery item ID'
      });
    }
    
    const item = await GalleryItem.findOne({ 
      _id: id, 
      is_active: true 
    }).select('title description image category year created_at');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching public gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery item',
      error: error.message
    });
  }
};

// GET /api/gallery/recent - Get recent gallery items (Public)
export const getRecentGalleryItems = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const items = await GalleryItem.find({ is_active: true })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .select('title description image category year created_at')
      .lean();
    
    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching recent gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent gallery items',
      error: error.message
    });
  }
};