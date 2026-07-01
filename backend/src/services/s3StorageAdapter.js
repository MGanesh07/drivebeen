/**
 * AWS S3 Storage Adapter (Stubbed for future integration)
 * Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * Required ENV vars:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

// const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
// const fs = require('fs');
// const path = require('path');

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

const uploadFile = async (file) => {
  throw new Error('S3 adapter not yet configured. Set STORAGE_ADAPTER=local in .env');
  // const fileStream = fs.createReadStream(file.path);
  // const key = `uploads/${Date.now()}-${path.basename(file.originalname)}`;
  // await s3.send(new PutObjectCommand({
  //   Bucket: process.env.AWS_S3_BUCKET,
  //   Key: key,
  //   Body: fileStream,
  //   ContentType: file.mimetype,
  // }));
  // return { storageKey: key, storageUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}` };
};

const getFileStream = async (storageKey) => {
  throw new Error('S3 adapter not yet configured');
  // const response = await s3.send(new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: storageKey }));
  // return response.Body;
};

const deleteFile = async (storageKey) => {
  throw new Error('S3 adapter not yet configured');
  // await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: storageKey }));
};

const getFileUrl = (storageKey) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${storageKey}`;
};

const fileExists = async (storageKey) => {
  return false;
};

module.exports = { uploadFile, getFileStream, deleteFile, getFileUrl, fileExists };
