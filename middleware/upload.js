import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';

const s3 = new S3Client({
  region: process.env.AWSS_REGION,
  credentials: {
    accessKeyId: process.env.AWSS_OPEN_KEY,
    secretAccessKey: process.env.AWSS_SEC_KEY,
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|webp|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `courses/${Date.now().toString()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('image');

const uploadVideoThumbnail = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `videoThumbnail/${Date.now().toString()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('thumbnail');

// Simple file type validation
function checkFileTypeForuploadInstitutionFiles(file, cb) {
  // Define allowed file types
  const allowedStudentListTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'image/jpeg', 'image/png'];
  const allowedLogoTypes = ['image/jpeg', 'image/png'];

  // Check file type based on fieldname
  if (file.fieldname === 'studentList' && allowedStudentListTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === 'institutionLogo' && allowedLogoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type!'));
  }
}

const uploadInstitutionFiles = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const filePath = `institutions/${Date.now().toString()}-${file.originalname}`;
      cb(null, filePath);
    },
  }),
  limits: {
    fileSize: function (req, file, cb) {
      // Set file size limits based on the field
      const maxSize = file.fieldname === 'studentList' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      cb(null, true, maxSize);
    },
  },
  fileFilter: function (req, file, cb) {
    checkFileTypeForuploadInstitutionFiles(file, cb);
  },
}).fields([
  { name: 'studentList', maxCount: 1 },
  { name: 'institutionLogo', maxCount: 1 }
]);

const uploadCarouselImages = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `carousel/${Date.now().toString()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array('images', 3); // Allow up to 3 images

const uploadSectionsImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `sections/${Date.now().toString()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('image');

const uploadTestimonialsImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `testimonials/${Date.now().toString()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 2000000 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('image');

const uploadLeadershipImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `leadership/${Date.now().toString()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 2000000 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('image');

export default upload;
export { uploadInstitutionFiles, uploadCarouselImages, uploadSectionsImage, uploadVideoThumbnail, uploadTestimonialsImage, uploadLeadershipImage };
