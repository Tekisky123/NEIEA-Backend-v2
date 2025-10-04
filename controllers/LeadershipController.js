import Leadership from '../models/Leadership.js';
import validator from 'validator';

// Get all active leadership members (public)
export const getPublicLeadership = async (req, res) => {
  try {
    const members = await Leadership.find({ is_active: true })
      .sort({ category: 1, display_order: 1 })
      .select('-__v -createdAt -updatedAt')
      .lean();
    
    res.status(200).json({
      success: true,
      data: members,
      count: members.length
    });
  } catch (error) {
    console.error('Error fetching public leadership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leadership members',
      error: error.message
    });
  }
};

// Get leadership member bio by slug (public)
export const getMemberBio = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug || !validator.isLength(slug.trim(), { min: 1, max: 100 })) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slug'
      });
    }
    
    const member = await Leadership.findOne({ 
      slug: slug.trim(), 
      is_active: true 
    }).select('-__v -createdAt -updatedAt');
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Get related members from the same category
    const relatedMembers = await Leadership.find({
      category: member.category,
      is_active: true,
      _id: { $ne: member._id }
    })
    .sort({ display_order: 1 })
    .select('name title image slug')
    .limit(3)
    .lean();
    
    res.status(200).json({
      success: true,
      data: {
        member,
        relatedMembers
      }
    });
  } catch (error) {
    console.error('Error fetching member bio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member bio',
      error: error.message
    });
  }
};

// Get leadership members by category (public)
export const getLeadershipByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category || !['directors', 'advisors', 'staff'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    const members = await Leadership.find({ 
      category, 
      is_active: true 
    })
    .sort({ display_order: 1 })
    .select('-__v -createdAt -updatedAt')
    .lean();
    
    res.status(200).json({
      success: true,
      data: members,
      count: members.length
    });
  } catch (error) {
    console.error('Error fetching leadership by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leadership members',
      error: error.message
    });
  }
};