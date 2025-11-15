/**
 * Cloudflare Images Uploader
 * 
 * Uploads images to Cloudflare Images (not R2).
 * Returns image IDs for use with CloudflareImage.astro component.
 * 
 * Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in environment.
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_HASH = '3oZsG34qPq3SIXQhl47vqA'; // From your CloudflareImage.astro component

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('⚠️  Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env');
}

/**
 * Upload an image to Cloudflare Images
 * @param {string} filePath - Local path to image file
 * @param {object} metadata - Optional metadata (description, etc.)
 * @returns {Promise<object>} - Upload result with imageId and URLs
 */
export async function uploadImage(filePath, metadata = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const form = new FormData();
  
  form.append('file', fs.createReadStream(filePath), fileName);
  
  // Add metadata if provided
  if (metadata.description) {
    form.append('metadata', JSON.stringify({ description: metadata.description }));
  }
  
  // Optionally require signed URLs for privacy
  if (metadata.requireSignedURLs) {
    form.append('requireSignedURLs', 'true');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare Images upload failed: ${JSON.stringify(data.errors)}`);
  }

  const imageId = data.result.id;
  
  return {
    success: true,
    imageId,
    // URLs for different variants
    thumbnailUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/thumbnail`,
    mediumUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/medium`,
    largeUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/large`,
    publicUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/public`,
    // Full metadata
    metadata: data.result,
    originalFileName: fileName
  };
}

/**
 * Upload an image from URL directly to Cloudflare Images
 * @param {string} imageUrl - URL of image to upload
 * @param {object} metadata - Optional metadata
 * @returns {Promise<object>} - Upload result
 */
export async function uploadImageFromUrl(imageUrl, metadata = {}) {
  // Cloudflare requires multipart/form-data for URL uploads
  const formData = new FormData();
  formData.append('url', imageUrl);
  
  if (metadata.description) {
    formData.append('metadata', JSON.stringify({ description: metadata.description }));
  }
  
  formData.append('requireSignedURLs', String(metadata.requireSignedURLs || false));

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        // Note: Don't set Content-Type header - fetch will set it automatically with boundary
      },
      body: formData
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare Images URL upload failed: ${JSON.stringify(data.errors)}`);
  }

  const imageId = data.result.id;

  return {
    success: true,
    imageId,
    thumbnailUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/thumbnail`,
    mediumUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/medium`,
    largeUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/large`,
    publicUrl: `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/public`,
    metadata: data.result,
    originalUrl: imageUrl
  };
}

/**
 * Get image details from Cloudflare Images
 * @param {string} imageId - Image ID
 * @returns {Promise<object>} - Image details
 */
export async function getImageDetails(imageId) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Failed to get image details: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

/**
 * Delete an image from Cloudflare Images
 * @param {string} imageId - Image ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteImage(imageId) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Failed to delete image: ${JSON.stringify(data.errors)}`);
  }

  return true;
}
