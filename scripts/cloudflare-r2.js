/**
 * Cloudflare R2 Uploader
 * 
 * Uploads PDFs and documents to Cloudflare R2 storage.
 * For images, use cloudflare-images.js instead.
 * For videos, use cloudflare-stream.js instead.
 * 
 * Requires CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, 
 * CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME in environment.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'police-misconduct';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, ''); // Remove trailing slash

if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('⚠️  Missing Cloudflare R2 credentials. Set required environment variables in .env');
}

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a unique filename to avoid collisions
 * @param {string} originalName - Original filename
 * @param {string} customName - Optional custom name from metadata (title, description, etc.)
 * @returns {string} - Unique filename with timestamp
 */
function generateUniqueFilename(originalName, customName = null) {
  const ext = path.extname(originalName);
  
  // Use custom name if provided, otherwise use original
  let baseName = customName || path.basename(originalName, ext);
  
  // Sanitize filename: lowercase, alphanumeric and hyphens only
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')  // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
    .substring(0, 50);              // Limit length
  
  // Generate timestamp in format: YYYYMMDDHHmmss
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  
  return `${sanitized}-${timestamp}${ext}`;
}

/**
 * Determine content type from file extension
 * @param {string} filePath - Path to file
 * @returns {string} - MIME type
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Upload a file to Cloudflare R2
 * @param {string} filePath - Local path to file
 * @param {object} options - Upload options (folder, metadata, customName)
 * @returns {Promise<object>} - Upload result with URL
 */
export async function uploadToR2(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const originalFileName = path.basename(filePath);
  const uniqueFileName = generateUniqueFilename(originalFileName, options.customName);
  const folder = options.folder || '';
  const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
  
  const fileContent = fs.readFileSync(filePath);
  const contentType = getContentType(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    Metadata: options.metadata || {},
  });

  try {
    await r2Client.send(command);
    
    // Construct public URL
    let publicUrl;
    if (R2_PUBLIC_URL) {
      // Use custom domain if set
      publicUrl = `${R2_PUBLIC_URL}/${key}`;
    } else {
      // Default: Construct R2 dev URL - user needs to enable public access in dashboard
      publicUrl = `https://pub-[YOUR-HASH].r2.dev/${key}`;
      console.warn('⚠️  CLOUDFLARE_R2_PUBLIC_URL not set. Update .env with your R2 public URL.');
      console.warn('   Enable public access in Cloudflare dashboard to get your pub-*.r2.dev URL');
    }

    return {
      success: true,
      url: publicUrl,
      key,
      bucket: R2_BUCKET_NAME,
      contentType,
      originalFileName,
      uniqueFileName,
      needsPublicUrl: !R2_PUBLIC_URL
    };
  } catch (error) {
    throw new Error(`R2 upload failed: ${error.message}`);
  }
}

/**
 * Upload an image to R2
 * @param {string} filePath - Local path to image
 * @param {object} metadata - Optional metadata
 * @returns {Promise<object>} - Upload result
 */
export async function uploadImage(filePath, metadata = {}) {
  return uploadToR2(filePath, {
    folder: 'images',
    metadata: {
      type: 'image',
      ...metadata
    }
  });
}

/**
 * Upload a PDF to R2
 * @param {string} filePath - Local path to PDF
 * @param {object} metadata - Optional metadata
 * @returns {Promise<object>} - Upload result
 */
export async function uploadPDF(filePath, metadata = {}) {
  return uploadToR2(filePath, {
    folder: '', // No subfolder - files go to bucket root
    metadata: {
      type: 'document',
      ...metadata
    }
  });
}

/**
 * Check if a file exists in R2
 * @param {string} key - R2 object key
 * @returns {Promise<boolean>} - True if exists
 */
export async function fileExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}
