import CareerPage from '../models/CareerPage.js';

// Get career page data (Public)
export const getCareerPage = async (req, res) => {
  try {
    const careerPage = await CareerPage.findOne({ is_active: true })
      .select('-__v')
      .lean();
    
    if (!careerPage) {
      return res.status(404).json({
        success: false,
        message: 'Career page data not found'
      });
    }
    
    // Sort benefits by display_order, fallback to creation order if all have same order
    if (careerPage.whyWorkSection && careerPage.whyWorkSection.benefits) {
      careerPage.whyWorkSection.benefits.sort((a, b) => {
        const orderA = a.display_order || 0;
        const orderB = b.display_order || 0;
        
        // If both have same order (like 0), sort by _id to maintain consistent order
        if (orderA === orderB) {
          return a._id.toString().localeCompare(b._id.toString());
        }
        
        return orderA - orderB;
      });
    }
    
    res.status(200).json({
      success: true,
      data: careerPage
    });
  } catch (error) {
    console.error('Error fetching career page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career page data',
      error: error.message
    });
  }
};
