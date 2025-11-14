/**
 * File Downloader
 * 
 * Downloads files from external URLs (Dropbox, Google Drive, direct links)
 * and saves them locally for processing.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * Convert Dropbox share link to direct download link
 * @param {string} url - Dropbox share URL
 * @returns {string} - Direct download URL
 */
function convertDropboxUrl(url) {
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  }
  return url;
}

/**
 * Convert Google Drive share link to direct download link
 * @param {string} url - Google Drive share URL
 * @returns {string} - Direct download URL
 */
function convertGoogleDriveUrl(url) {
  // Match: https://drive.google.com/file/d/FILE_ID/view
  const match = url.match(/\/file\/d\/([^\/]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

/**
 * Convert share URLs to direct download URLs
 * @param {string} url - Original URL
 * @returns {string} - Direct download URL
 */
export function convertToDirectUrl(url) {
  if (url.includes('dropbox.com')) {
    return convertDropboxUrl(url);
  }
  if (url.includes('drive.google.com')) {
    return convertGoogleDriveUrl(url);
  }
  return url;
}

/**
 * Get file extension from URL or content-type header
 * @param {string} url - File URL
 * @param {string} contentType - Content-Type header
 * @returns {string} - File extension with dot
 */
function getFileExtension(url, contentType = '') {
  // Try to get from URL first
  const urlPath = new URL(url).pathname;
  const extFromUrl = path.extname(urlPath);
  if (extFromUrl && extFromUrl.length <= 5) {
    return extFromUrl;
  }

  // Fallback to content-type
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
  };

  return mimeToExt[contentType] || '';
}

/**
 * Sanitize filename to remove invalid characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  // Remove or replace invalid characters for file systems
  return filename
    .replace(/[<>:"|?*]/g, '') // Remove invalid Windows chars
    .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII chars
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Download a file from a URL
 * @param {string} url - URL to download from
 * @param {string} outputDir - Directory to save file
 * @param {string} filename - Optional filename (will be generated if not provided)
 * @returns {Promise<object>} - Download result with file path
 */
export async function downloadFile(url, outputDir, filename = null) {
  return new Promise((resolve, reject) => {
    const directUrl = convertToDirectUrl(url);
    const urlObj = new URL(directUrl);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    console.log(`📥 Downloading: ${url}`);
    if (url !== directUrl) {
      console.log(`   ↳ Using direct URL: ${directUrl}`);
    }

    const request = protocol.get(directUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentPublisher/1.0)'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`   ↳ Following redirect to: ${redirectUrl}`);
        downloadFile(redirectUrl, outputDir, filename)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}: ${url}`));
        return;
      }

      // Determine filename
      let finalFilename = filename;
      if (!finalFilename) {
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          // Try to extract filename from content-disposition header
          const filenameMatch = contentDisposition.match(/filename\*?=["']?(?:UTF-8'')?([^"';]+)/i);
          if (filenameMatch) {
            // Decode URL-encoded filename if needed
            try {
              finalFilename = decodeURIComponent(filenameMatch[1]);
            } catch {
              finalFilename = filenameMatch[1];
            }
          }
        }
        
        if (!finalFilename) {
          const contentType = response.headers['content-type'];
          const ext = getFileExtension(directUrl, contentType);
          const timestamp = Date.now();
          finalFilename = `download-${timestamp}${ext}`;
        }
      }
      
      // Sanitize the filename
      finalFilename = sanitizeFilename(finalFilename);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, finalFilename);
      const fileStream = fs.createWriteStream(filePath);

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        const stats = fs.statSync(filePath);
        console.log(`   ✓ Downloaded: ${finalFilename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve({
          success: true,
          filePath,
          filename: finalFilename,
          size: stats.size,
          originalUrl: url
        });
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(new Error(`File write error: ${err.message}`));
      });
    });

    request.on('error', (err) => {
      reject(new Error(`Download error: ${err.message}`));
    });

    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Download timeout (60s)'));
    });
  });
}

/**
 * Download multiple files
 * @param {Array<string>} urls - Array of URLs to download
 * @param {string} outputDir - Directory to save files
 * @returns {Promise<Array>} - Array of download results
 */
export async function downloadFiles(urls, outputDir) {
  const results = [];
  
  for (const url of urls) {
    try {
      const result = await downloadFile(url, outputDir);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to download ${url}: ${error.message}`);
      results.push({
        success: false,
        originalUrl: url,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Parse shortcode-style media tags from markdown
 * Format: {{type: url | param: value | param: value}}
 * Examples:
 *   {{video: https://example.com/video.mp4 | caption: Body camera footage}}
 *   {{image: https://example.com/photo.jpg | featured: true | caption: Scene photo}}
 *   {{document: https://example.com/file.pdf | title: Complaint | description: Civil rights complaint}}
 *   {{link: https://news.example.com/article | title: News Coverage | description: Local reporting | icon: news}}
 * 
 * @param {string} markdown - Markdown content
 * @returns {object} - Categorized media items {videos: [], images: [], documents: [], links: []}
 */
export function parseMediaShortcodes(markdown) {
  const media = {
    videos: [],
    images: [],
    documents: [],
    links: []
  };
  
  // Match {{type: url | params}}
  const shortcodeRegex = /\{\{(\w+):\s*([^|}\s]+)([^}]*)\}\}/g;
  
  let match;
  while ((match = shortcodeRegex.exec(markdown)) !== null) {
    const type = match[1].toLowerCase();
    const url = match[2].trim();
    const paramsString = match[3] || '';
    
    // Parse parameters (| param: value | param: value)
    const params = {};
    const paramRegex = /\|\s*([^:]+):\s*([^|]+)/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
      const key = paramMatch[1].trim();
      let value = paramMatch[2].trim();
      
      // Convert boolean strings
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      
      params[key] = value;
    }
    
    // Create media item with URL and metadata
    const item = { url, ...params };
    
    // Categorize by type
    if (type === 'video') {
      media.videos.push(item);
    } else if (type === 'image') {
      media.images.push(item);
    } else if (type === 'document' || type === 'pdf') {
      media.documents.push(item);
    } else if (type === 'link') {
      media.links.push(item);
    }
  }
  
  return media;
}

/**
 * Extract URLs from markdown text
 * @param {string} markdown - Markdown content
 * @param {RegExp} pattern - Optional pattern to filter URLs
 * @returns {Array<string>} - Array of URLs found
 */
export function extractUrlsFromMarkdown(markdown, pattern = null) {
  // Match URLs in code blocks and inline
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = markdown.match(urlRegex) || [];
  
  if (pattern) {
    return urls.filter(url => pattern.test(url));
  }
  
  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Parse document annotations from markdown
 * Extracts title and description for each document URL
 * @param {string} markdown - Markdown content
 * @returns {Array<object>} - Array of {url, title, description}
 */
export function parseDocumentAnnotations(markdown) {
  const documents = [];
  
  // Find the Documents section
  const docSectionMatch = markdown.match(/###\s*Documents\s*\(PDFs\)([\s\S]*?)(?=###|$)/i);
  if (!docSectionMatch) {
    return documents;
  }
  
  const docSection = docSectionMatch[1];
  
  // Split by code blocks and parse each document
  const blocks = docSection.split('```');
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    
    // Check if this is a URL block
    if (block.match(/^https?:\/\//)) {
      const url = block.split('\n')[0].trim();
      
      // Get the text after this code block for annotations
      const afterBlock = blocks[i + 1] || '';
      
      // Extract title and description
      const titleMatch = afterBlock.match(/Title:\s*(.+?)(?:\n|$)/i);
      const descMatch = afterBlock.match(/Description:\s*(.+?)(?:\n|$)/i);
      
      // Infer from URL filename if not provided
      const filename = url.split('/').pop().split('?')[0];
      const defaultTitle = filename.replace(/\.(pdf|docx?|txt)$/i, '').replace(/[_-]/g, ' ');
      
      documents.push({
        url: url,
        title: titleMatch ? titleMatch[1].trim() : defaultTitle,
        description: descMatch ? descMatch[1].trim() : 'Legal document related to the case'
      });
    }
  }
  
  return documents;
}

/**
 * Categorize URLs by file type
 * @param {Array<string>} urls - Array of URLs
 * @returns {object} - Categorized URLs (videos, images, documents, other)
 */
export function categorizeUrls(urls) {
  const categories = {
    videos: [],
    images: [],
    documents: [],
    other: []
  };

  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt'];

  urls.forEach(url => {
    const urlLower = url.toLowerCase();
    
    if (videoExts.some(ext => urlLower.includes(ext))) {
      categories.videos.push(url);
    } else if (imageExts.some(ext => urlLower.includes(ext))) {
      categories.images.push(url);
    } else if (docExts.some(ext => urlLower.includes(ext))) {
      categories.documents.push(url);
    } else {
      categories.other.push(url);
    }
  });

  return categories;
}
