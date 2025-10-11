import mongoose from 'mongoose';
import validator from 'validator';

const optionalMinLength = (min, msg) => ({
    validator: (v) => !v || v.length >= min,
    message: msg,
});

const globalPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Partner name is required'],
        trim: true,
        minlength: [3, 'Partner name must be at least 3 characters'],
        maxlength: [200, 'Partner name must not exceed 200 characters']
    },
    shortName: {
        type: String,
        required: [true, 'Short name is required'],
        trim: true,
        minlength: [2, 'Short name must be at least 2 characters'],
        maxlength: [50, 'Short name must not exceed 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        minlength: [3, 'Location must be at least 3 characters'],
        maxlength: [200, 'Location must not exceed 200 characters']
    },
    website: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || validator.isURL(v);
            },
            message: 'Please provide a valid URL'
        }
    },
    featuredImage: {
        type: String,
        required: [true, 'Featured image is required']
    },
    featuredImageKey: {
        type: String,
        required: true
    },
    detailImages: [{
        type: String,
        required: true
    }],
    detailImageKeys: [{
        type: String,
        required: true
    }],
    shortDescription: {
        type: String,
        required: [true, 'Short description is required'],
        trim: true,
        minlength: [50, 'Short description must be at least 50 characters'],
        maxlength: [500, 'Short description must not exceed 500 characters']
    },
    about: {
        type: String,
        trim: true,
        validate: optionalMinLength(100, 'About section must be at least 100 characters'),
    },
    collaboration: {
        type: String,
        trim: true,
        validate: optionalMinLength(100, 'Collaboration description must be at least 100 characters'),
    },
    impact: {
        type: String,
        trim: true,
        validate: optionalMinLength(100, 'Impact description must be at least 100 characters'),
    },
    programs: [{
        type: String,
        trim: true
    }],
    display_order: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Generate slug before saving
globalPartnerSchema.pre('save', async function (next) {
    if (this.isModified('name') || this.isNew) {
        let slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Ensure unique slug
        let uniqueSlug = slug;
        let counter = 1;
        while (await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        this.slug = uniqueSlug;
    }
    next();
});

// Index for better query performance
globalPartnerSchema.index({ slug: 1 });
globalPartnerSchema.index({ display_order: 1 });
globalPartnerSchema.index({ is_active: 1 });

const GlobalPartner = mongoose.model('GlobalPartner', globalPartnerSchema);

export default GlobalPartner;

