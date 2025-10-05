import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWSS_REGION,
  credentials: {
    accessKeyId: process.env.AWSS_OPEN_KEY,
    secretAccessKey: process.env.AWSS_SEC_KEY,
  },
});

// Helper function to delete images from S3
export const deleteImagesFromS3 = async (files) => {
  if (!files || files.length === 0) return;
  
  const deletePromises = files.map(file => {
    const key = file.key; // Extract the S3 key from the file object
    const decodedKey = decodeURIComponent(key);
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWSS_BUCKET_NAME,
      Key: decodedKey
    });
    return s3.send(command);
  });
  
  try {
    await Promise.all(deletePromises);
    console.log('Successfully deleted images from S3 after validation failure');
  } catch (error) {
    console.error('Error deleting images from S3:', error);
  }
};

// Helper function to delete a single image from S3
export const deleteSingleImageFromS3 = async (fileKey) => {

  
  if (!fileKey) return;
  
  const decodedKey = decodeURIComponent(fileKey);

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWSS_BUCKET_NAME,
      Key: decodedKey
    });
    await s3.send(command);
    console.log('Successfully deleted image from S3:', decodedKey);
  } catch (error) {
    console.error('Error deleting image from S3:', error);
  }
}; 