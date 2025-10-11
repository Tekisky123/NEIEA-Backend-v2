import GlobalPartner from '../models/GlobalPartnersPage.js';

// @desc    Get all active global partners
// @route   GET /api/global-partners
// @access  Public
export const getAllPublicGlobalPartners = async (req, res) => {
  try {
    const partners = await GlobalPartner.find({ is_active: true })
      .sort({ display_order: 1, createdAt: -1 })
      .select('-__v -createdAt -updatedAt -featuredImageKey -detailImageKeys');
    
    res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error fetching global partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global partners'
    });
  }
};

// @desc    Get global partner by slug
// @route   GET /api/global-partners/info/:slug
// @access  Public
export const getGlobalPartnerBySlug = async (req, res) => {
  try {
    const partner = await GlobalPartner.findOne({ 
      slug: req.params.slug,
      is_active: true 
    }).select('-__v -createdAt -updatedAt -featuredImageKey -detailImageKeys');
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Global partner not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching global partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global partner'
    });
  }
};

