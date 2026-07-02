/**
 * AWS S3 Storage Adapter
 * Required ENV vars:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

const { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

// Helper to check if credentials are set
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET
  );
};

let s3 = null;
if (isS3Configured()) {
  s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const uploadFile = async (file) => {
  if (!s3) {
    throw new Error('AWS S3 credentials or configuration are missing in .env file.');
  }

  const fileStream = fs.createReadStream(file.path);
  const key = `uploads/${Date.now()}-${path.basename(file.originalname)}`;
  
  // Use @aws-sdk/lib-storage Upload for streaming & multipart support for large files
  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    },
    queueSize: 4, // 4 concurrent parts
    partSize: 1024 * 1024 * 5, // 5MB part size (S3 minimum is 5MB)
    leavePartsOnError: false, // Clean up parts if upload fails
  });

  await parallelUpload.done();

  return {
    storageKey: key,
    storageUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

const getFileStream = async (storageKey) => {
  if (!s3) {
    throw new Error('S3 client not configured');
  }
  const response = await s3.send(new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: storageKey,
  }));
  return response.Body; // Node stream
};

const deleteFile = async (storageKey) => {
  if (!s3) {
    throw new Error('S3 client not configured');
  }
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: storageKey,
  }));
};

const getFileUrl = (storageKey) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${storageKey}`;
};

const getDownloadUrl = async (storageKey, filename) => {
  if (!s3) {
    throw new Error('S3 client not configured');
  }
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: storageKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: 900 });
};

const fileExists = async (storageKey) => {
  if (!s3) return false;
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: storageKey,
    }));
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = { uploadFile, getFileStream, deleteFile, getFileUrl, getDownloadUrl, fileExists };
