import PartnerInstitution from '../models/PartnerInstitution.js';

// @desc    Get all active partner institutions
// @route   GET /api/partner-institution
// @access  Public
export const getAllPublicPartnerInstitutions = async (req, res) => {
  try {
    const institutions = await PartnerInstitution.find({ is_active: true })
      .sort({ display_order: 1, createdAt: -1 })
      .select('-__v -createdAt -updatedAt -featuredImageKey -detailImageKeys');
    
    res.status(200).json({
      success: true,
      data: institutions
    });
  } catch (error) {
    console.error('Error fetching partner institutions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner institutions'
    });
  }
};

// @desc    Get partner institution by slug
// @route   GET /api/partner-institution/info/:slug
// @access  Public
export const getPartnerInstitutionBySlug = async (req, res) => {
  try {
    const institution = await PartnerInstitution.findOne({ 
      slug: req.params.slug,
      is_active: true 
    }).select('-__v -createdAt -updatedAt -featuredImageKey -detailImageKeys');
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Partner institution not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Error fetching partner institution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner institution'
    });
  }
};
