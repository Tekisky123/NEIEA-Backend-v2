import Carousel from '../models/Carousel.js';
import ErrorResponse from '../utils/errorResponse.js';

// Create or update carousel for a page
export const createOrUpdateCarousel = async (req, res, next) => {
  try {
    const { page, images } = req.body;

    // Validate required fields
    if (!page) {
      return next(new ErrorResponse('Page name is required', 400));
    }

    if (!images || !Array.isArray(images)) {
      return next(new ErrorResponse('Images array is required', 400));
    }

    // Controller validation: check images length
    if (images.length > 3) {
      return next(new ErrorResponse('Carousel cannot have more than 3 images', 400));
    }

    // Validate each image has required url
    for (let i = 0; i < images.length; i++) {
      if (!images[i].url) {
        return next(new ErrorResponse(`Image at index ${i} must have a URL`, 400));
      }
    }

    // Upsert carousel (create or update)
    const carousel = await Carousel.findOneAndUpdate(
      { page },
      { page, images },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: carousel
    });

  } catch (error) {
    next(error);
  }
};

// Get carousel for a specific page
export const getCarousel = async (req, res, next) => {
  try {
    const { page } = req.params;

    if (!page) {
      return res.status(400).json({
        success: false,
        message:`Page parameter is required`,
      })
    }

    const carousel = await Carousel.findOne({ page });

    if (!carousel) {
      return res.status(404).json({
        success: false,
        message:`Carousel not found for page: ${page}`,
        data: []
      })
    }

    res.status(200).json({
      success: true,
      data: carousel
    });

  } catch (error) {
    next(error);
  }
}; 