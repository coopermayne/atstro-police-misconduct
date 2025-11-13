/**
 * Cloudflare Stream Uploader
 * 
 * Uploads videos to Cloudflare Stream and returns video IDs and embed URLs.
 * Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in environment.
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const STREAM_CUSTOMER_CODE = 'b2jil4qncbeg5z7d'; // From your CloudflareVideo.astro component

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('⚠️  Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env');
}

/**
 * Upload a video file to Cloudflare Stream
 * @param {string} filePath - Local path to video file
 * @param {object} metadata - Optional metadata (name, description)
 * @returns {Promise<object>} - Upload result with videoId and embed URL
 */
export async function uploadVideo(filePath, metadata = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const form = new FormData();
  
  form.append('file', fs.createReadStream(filePath), fileName);
  
  // Add metadata
  const meta = {
    name: metadata.name || fileName,
    ...metadata
  };
  form.append('meta', JSON.stringify(meta));

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
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
    throw new Error(`Cloudflare Stream upload failed: ${JSON.stringify(data.errors)}`);
  }

  const videoId = data.result.uid;
  
  return {
    success: true,
    videoId,
    embedUrl: `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/iframe`,
    streamUrl: `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
    thumbnailUrl: `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`,
    metadata: data.result,
    originalFileName: fileName
  };
}

/**
 * Upload a video from URL directly to Cloudflare Stream
 * @param {string} videoUrl - URL of video to upload
 * @param {object} metadata - Optional metadata
 * @returns {Promise<object>} - Upload result
 */
export async function uploadVideoFromUrl(videoUrl, metadata = {}) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/copy`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: videoUrl,
        meta: metadata
      })
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare Stream URL upload failed: ${JSON.stringify(data.errors)}`);
  }

  const videoId = data.result.uid;

  return {
    success: true,
    videoId,
    embedUrl: `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/iframe`,
    streamUrl: `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
    thumbnailUrl: `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`,
    metadata: data.result,
    originalUrl: videoUrl
  };
}

/**
 * Get video details from Cloudflare Stream
 * @param {string} videoId - Stream video ID
 * @returns {Promise<object>} - Video details
 */
export async function getVideoDetails(videoId) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
      }
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Failed to get video details: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}
