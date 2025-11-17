#!/usr/bin/env node
/**
 * Media Browser - Localhost Media Library Interface
 * 
 * Visual browser for media-library.json with filtering, sorting, and click-to-copy URLs.
 * Optimized for hundreds of media items with virtual scrolling and lazy loading.
 * 
 * Usage:
 *   npm run media:browse
 *   node scripts/media/media-browser.js
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const LIBRARY_PATH = path.join(ROOT_DIR, 'media-library.json');
const PORT = 3001;

const app = express();

/**
 * Load media library
 */
function loadLibrary() {
  if (!fs.existsSync(LIBRARY_PATH)) {
    return { videos: {}, images: {}, documents: {} };
  }
  return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
}

/**
 * API: Get full library
 */
app.get('/api/library', (req, res) => {
  try {
    const library = loadLibrary();
    
    // Transform into flat array with metadata
    const items = [];
    
    Object.entries(library.videos).forEach(([id, video]) => {
      items.push({
        id,
        type: 'video',
        ...video,
        thumbnailUrl: video.cloudflareData?.thumbnail || video.cloudflareData?.metadata?.thumbnail,
        previewUrl: video.cloudflareData?.preview || `https://customer-b2jil4qncbeg5z7d.cloudflarestream.com/${video.videoId}/watch`,
        duration: video.cloudflareData?.metadata?.duration || video.cloudflareData?.duration || null,
        fileSize: video.cloudflareData?.metadata?.size || video.cloudflareData?.size || null
      });
    });
    
    Object.entries(library.images).forEach(([id, image]) => {
      items.push({
        id,
        type: 'image',
        ...image,
        thumbnailUrl: image.urls?.thumbnail || image.urls?.public,
        previewUrl: image.urls?.large || image.urls?.medium || image.urls?.public,
        fileSize: null
      });
    });
    
    Object.entries(library.documents).forEach(([id, doc]) => {
      items.push({
        id,
        type: 'document',
        ...doc,
        thumbnailUrl: null,
        previewUrl: doc.publicUrl,
        fileSize: doc.fileSize
      });
    });
    
    res.json({ items, total: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Get statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const library = loadLibrary();
    
    const videoCount = Object.keys(library.videos).length;
    const imageCount = Object.keys(library.images).length;
    const documentCount = Object.keys(library.documents).length;
    
    // Calculate total file size (approximate)
    let totalSize = 0;
    Object.values(library.videos).forEach(v => {
      totalSize += v.cloudflareData?.metadata?.size || v.cloudflareData?.size || 0;
    });
    Object.values(library.documents).forEach(d => {
      totalSize += d.fileSize || 0;
    });
    
    // Get all unique tags
    const allTags = new Set();
    [...Object.values(library.videos), ...Object.values(library.images), ...Object.values(library.documents)]
      .forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => allTags.add(tag));
        }
      });
    
    res.json({
      videos: videoCount,
      images: imageCount,
      documents: documentCount,
      total: videoCount + imageCount + documentCount,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      tagCount: allTags.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Get all unique tags
 */
app.get('/api/tags', (req, res) => {
  try {
    const library = loadLibrary();
    const tagCounts = {};
    
    [...Object.values(library.videos), ...Object.values(library.images), ...Object.values(library.documents)]
      .forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
    
    // Sort by count descending
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
    
    res.json({ tags: sortedTags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Serve the HTML interface
 */
app.get('/', (req, res) => {
  res.send(HTML_TEMPLATE);
});

// Utility function
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// HTML Template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Media Library Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
      line-height: 1.6;
    }
    
    .container { max-width: 1600px; margin: 0 auto; }
    
    header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1e293b;
    }
    
    h1 {
      font-size: 2rem;
      margin-bottom: 10px;
      color: #f1f5f9;
    }
    
    .stats {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      flex-wrap: wrap;
    }
    
    .stat {
      background: #1e293b;
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #60a5fa;
    }
    
    .stat-label {
      color: #94a3b8;
      font-size: 0.875rem;
    }
    
    .controls {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 20px;
      padding: 20px;
      background: #1e293b;
      border-radius: 12px;
    }
    
    .search-box {
      flex: 1;
      min-width: 250px;
    }
    
    .search-box input {
      width: 100%;
      padding: 10px 15px;
      border: 1px solid #334155;
      border-radius: 6px;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 1rem;
    }
    
    .search-box input:focus {
      outline: none;
      border-color: #60a5fa;
    }
    
    .tabs {
      display: flex;
      gap: 5px;
      background: #0f172a;
      padding: 4px;
      border-radius: 8px;
    }
    
    .tab {
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .tab:hover { background: #1e293b; color: #e2e8f0; }
    .tab.active { background: #60a5fa; color: #0f172a; }
    
    .sort-dropdown {
      position: relative;
    }
    
    select {
      padding: 10px 15px;
      border: 1px solid #334155;
      border-radius: 6px;
      background: #0f172a;
      color: #e2e8f0;
      cursor: pointer;
      font-size: 0.875rem;
    }
    
    select:focus { outline: none; border-color: #60a5fa; }
    
    .tag-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding: 15px 20px;
      background: #1e293b;
      border-radius: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .tag-pill {
      padding: 6px 12px;
      border-radius: 20px;
      background: #334155;
      color: #e2e8f0;
      font-size: 0.875rem;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }
    
    .tag-pill:hover { background: #475569; }
    .tag-pill.active { background: #60a5fa; color: #0f172a; border-color: #3b82f6; }
    .tag-count { opacity: 0.7; margin-left: 5px; font-size: 0.75rem; }
    
    .results-info {
      margin: 20px 0;
      color: #94a3b8;
      font-size: 0.875rem;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid transparent;
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      border-color: #60a5fa;
    }
    
    .card-thumbnail {
      width: 100%;
      height: 180px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    .card-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .card-thumbnail.no-preview {
      font-size: 3rem;
      opacity: 0.5;
    }
    
    .type-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }
    
    .type-badge.video { background: rgba(239, 68, 68, 0.9); color: white; }
    .type-badge.image { background: rgba(34, 197, 94, 0.9); color: white; }
    .type-badge.document { background: rgba(59, 130, 246, 0.9); color: white; }
    
    .card-content {
      padding: 15px;
    }
    
    .card-title {
      font-weight: 600;
      margin-bottom: 5px;
      color: #f1f5f9;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .card-meta {
      color: #64748b;
      font-size: 0.75rem;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .card-tags {
      margin-top: 8px;
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
    
    .card-tag {
      padding: 2px 8px;
      background: #334155;
      border-radius: 4px;
      font-size: 0.7rem;
      color: #94a3b8;
    }
    
    /* Modal */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      padding: 40px;
      overflow-y: auto;
    }
    
    .modal.active { display: flex; align-items: center; justify-content: center; }
    
    .modal-content {
      background: #1e293b;
      border-radius: 16px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }
    
    .modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      background: #334155;
      color: #e2e8f0;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.5rem;
      line-height: 1;
      z-index: 10;
    }
    
    .modal-close:hover { background: #475569; }
    
    .modal-preview {
      width: 100%;
      max-height: 500px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px 16px 0 0;
      overflow: hidden;
    }
    
    .modal-preview img, .modal-preview video, .modal-preview iframe {
      width: 100%;
      max-height: 500px;
      object-fit: contain;
    }
    
    .modal-preview.no-preview {
      height: 200px;
      font-size: 4rem;
      opacity: 0.3;
    }
    
    .modal-body {
      padding: 30px;
    }
    
    .modal-title {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #f1f5f9;
    }
    
    .modal-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }
    
    .btn-primary {
      background: #60a5fa;
      color: #0f172a;
    }
    
    .btn-primary:hover { background: #3b82f6; }
    
    .btn-secondary {
      background: #334155;
      color: #e2e8f0;
    }
    
    .btn-secondary:hover { background: #475569; }
    
    .btn.copied { background: #22c55e; }
    
    .modal-section {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #334155;
    }
    
    .modal-section:last-child { border-bottom: none; }
    
    .modal-section h3 {
      font-size: 1rem;
      margin-bottom: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    
    .modal-section p {
      color: #e2e8f0;
      margin-bottom: 5px;
    }
    
    .modal-section code {
      background: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
      color: #60a5fa;
      word-break: break-all;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    
    .empty-state-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.5; }
    .empty-state-title { font-size: 1.5rem; margin-bottom: 10px; }
    .empty-state-text { font-size: 1rem; }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
    
    .spinner {
      border: 3px solid #334155;
      border-top-color: #60a5fa;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar { width: 10px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📚 Media Library Browser</h1>
      <div class="stats" id="stats">
        <div class="stat">
          <div class="stat-value" id="stat-total">-</div>
          <div class="stat-label">Total Items</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="stat-videos">-</div>
          <div class="stat-label">Videos</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="stat-images">-</div>
          <div class="stat-label">Images</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="stat-documents">-</div>
          <div class="stat-label">Documents</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="stat-size">-</div>
          <div class="stat-label">Total Size</div>
        </div>
      </div>
    </header>
    
    <div class="controls">
      <div class="search-box">
        <input 
          type="text" 
          id="search" 
          placeholder="🔍 Search by filename or description..."
          autocomplete="off"
        />
      </div>
      
      <div class="tabs">
        <button class="tab active" data-type="all">All</button>
        <button class="tab" data-type="image">Images</button>
        <button class="tab" data-type="video">Videos</button>
        <button class="tab" data-type="document">Documents</button>
      </div>
      
      <div class="sort-dropdown">
        <select id="sort">
          <option value="recent">Recent First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="size">File Size</option>
        </select>
      </div>
    </div>
    
    <div class="tag-filters" id="tag-filters" style="display: none;"></div>
    
    <div class="results-info" id="results-info"></div>
    
    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading media library...</p>
    </div>
    
    <div class="grid" id="grid" style="display: none;"></div>
    
    <div class="empty-state" id="empty-state" style="display: none;">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">No items found</div>
      <div class="empty-state-text">Try adjusting your search or filters</div>
    </div>
  </div>
  
  <div class="modal" id="modal">
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="modal-preview" id="modal-preview"></div>
      <div class="modal-body">
        <h2 class="modal-title" id="modal-title"></h2>
        
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="copySourceUrl()">
            📋 Copy Source URL
          </button>
          <button class="btn btn-secondary" onclick="copyMdxCode()">
            📝 Copy MDX Code
          </button>
        </div>
        
        <div id="modal-details"></div>
      </div>
    </div>
  </div>
  
  <script>
    let allItems = [];
    let filteredItems = [];
    let currentItem = null;
    let currentType = 'all';
    let currentSearch = '';
    let currentSort = 'recent';
    let activeTags = new Set();
    let allTags = [];
    
    // Load library and stats
    async function init() {
      try {
        // Load stats
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();
        
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-videos').textContent = stats.videos;
        document.getElementById('stat-images').textContent = stats.images;
        document.getElementById('stat-documents').textContent = stats.documents;
        document.getElementById('stat-size').textContent = stats.totalSizeFormatted;
        
        // Load tags
        const tagsRes = await fetch('/api/tags');
        const tagsData = await tagsRes.json();
        allTags = tagsData.tags;
        
        if (allTags.length > 0) {
          renderTagFilters();
        }
        
        // Load library
        const libRes = await fetch('/api/library');
        const data = await libRes.json();
        
        allItems = data.items;
        applyFilters();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('grid').style.display = 'grid';
      } catch (error) {
        console.error('Failed to load library:', error);
        document.getElementById('loading').innerHTML = 
          '<p style="color: #ef4444;">❌ Failed to load library. Make sure the server is running.</p>';
      }
    }
    
    // Render tag filters
    function renderTagFilters() {
      const container = document.getElementById('tag-filters');
      container.innerHTML = allTags.map(({ tag, count }) => 
        \`<div class="tag-pill" onclick="toggleTag('\${tag}')" data-tag="\${tag}">
          \${tag}<span class="tag-count">(\${count})</span>
        </div>\`
      ).join('');
      container.style.display = 'flex';
    }
    
    // Toggle tag filter
    function toggleTag(tag) {
      const pill = document.querySelector(\`.tag-pill[data-tag="\${tag}"]\`);
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        pill.classList.remove('active');
      } else {
        activeTags.add(tag);
        pill.classList.add('active');
      }
      applyFilters();
    }
    
    // Apply filters
    function applyFilters() {
      filteredItems = allItems.filter(item => {
        // Type filter
        if (currentType !== 'all' && item.type !== currentType) return false;
        
        // Search filter
        if (currentSearch) {
          const search = currentSearch.toLowerCase();
          const matchesFileName = item.fileName?.toLowerCase().includes(search);
          const matchesDescription = item.description?.toLowerCase().includes(search);
          if (!matchesFileName && !matchesDescription) return false;
        }
        
        // Tag filter (item must have ALL active tags)
        if (activeTags.size > 0) {
          if (!item.tags || !Array.isArray(item.tags)) return false;
          for (const tag of activeTags) {
            if (!item.tags.includes(tag)) return false;
          }
        }
        
        return true;
      });
      
      sortItems();
      renderGrid();
      updateResultsInfo();
    }
    
    // Sort items
    function sortItems() {
      switch (currentSort) {
        case 'recent':
          filteredItems.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
          break;
        case 'oldest':
          filteredItems.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
          break;
        case 'name-asc':
          filteredItems.sort((a, b) => (a.fileName || '').localeCompare(b.fileName || ''));
          break;
        case 'name-desc':
          filteredItems.sort((a, b) => (b.fileName || '').localeCompare(a.fileName || ''));
          break;
        case 'size':
          filteredItems.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
          break;
      }
    }
    
    // Render grid
    function renderGrid() {
      const grid = document.getElementById('grid');
      const emptyState = document.getElementById('empty-state');
      
      if (filteredItems.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }
      
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      
      grid.innerHTML = filteredItems.map(item => {
        const typeEmoji = item.type === 'video' ? '🎥' : item.type === 'image' ? '🖼️' : '📄';
        const thumbnail = item.thumbnailUrl || null;
        const date = new Date(item.addedAt).toLocaleDateString();
        
        return \`
          <div class="card" onclick='openModal(\${JSON.stringify(item).replace(/'/g, "&apos;")})'>
            <div class="card-thumbnail \${thumbnail ? '' : 'no-preview'}">
              \${thumbnail 
                ? \`<img src="\${thumbnail}" alt="\${item.fileName}" loading="lazy">\` 
                : typeEmoji
              }
              <div class="type-badge \${item.type}">\${item.type}</div>
            </div>
            <div class="card-content">
              <div class="card-title" title="\${item.fileName}">\${item.fileName}</div>
              <div class="card-meta">
                <span>\${date}</span>
                \${item.type === 'video' && item.fileSize ? \`<span>\${formatVideoSize(item.fileSize)}</span>\` : ''}
              </div>
              \${item.tags && item.tags.length > 0 ? \`
                <div class="card-tags">
                  \${item.tags.slice(0, 3).map(tag => \`<span class="card-tag">\${tag}</span>\`).join('')}
                  \${item.tags.length > 3 ? \`<span class="card-tag">+\${item.tags.length - 3}</span>\` : ''}
                </div>
              \` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }
    
    // Update results info
    function updateResultsInfo() {
      const info = document.getElementById('results-info');
      const total = allItems.length;
      const filtered = filteredItems.length;
      
      if (filtered === total) {
        info.textContent = \`Showing all \${total} items\`;
      } else {
        info.textContent = \`Showing \${filtered} of \${total} items\`;
      }
    }
    
    // Open modal
    function openModal(item) {
      currentItem = item;
      const modal = document.getElementById('modal');
      const preview = document.getElementById('modal-preview');
      const title = document.getElementById('modal-title');
      const details = document.getElementById('modal-details');
      
      title.textContent = item.fileName;
      
      // Preview
      const typeEmoji = item.type === 'video' ? '🎥' : item.type === 'image' ? '🖼️' : '📄';
      if (item.type === 'image' && item.previewUrl) {
        preview.innerHTML = \`<img src="\${item.previewUrl}" alt="\${item.fileName}">\`;
        preview.className = 'modal-preview';
      } else if (item.type === 'video' && item.previewUrl) {
        preview.innerHTML = \`<iframe src="\${item.previewUrl}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\`;
        preview.className = 'modal-preview';
      } else {
        preview.innerHTML = typeEmoji;
        preview.className = 'modal-preview no-preview';
      }
      
      // Details
      let detailsHtml = '';
      
      if (item.description) {
        detailsHtml += \`
          <div class="modal-section">
            <h3>Description</h3>
            <p>\${item.description}</p>
          </div>
        \`;
      }
      
      detailsHtml += \`
        <div class="modal-section">
          <h3>Source URL</h3>
          <p><code>\${item.sourceUrl || 'N/A'}</code></p>
        </div>
      \`;
      
      if (item.type === 'video' && item.videoId) {
        detailsHtml += \`
          <div class="modal-section">
            <h3>Cloudflare Video ID</h3>
            <p><code>\${item.videoId}</code></p>
          </div>
        \`;
      }
      
      if (item.type === 'image' && item.imageId) {
        detailsHtml += \`
          <div class="modal-section">
            <h3>Cloudflare Image ID</h3>
            <p><code>\${item.imageId}</code></p>
          </div>
        \`;
      }
      
      if (item.type === 'document' && item.publicUrl) {
        detailsHtml += \`
          <div class="modal-section">
            <h3>Public URL</h3>
            <p><code>\${item.publicUrl}</code></p>
            <p style="margin-top: 10px;"><a href="\${item.publicUrl}" target="_blank" style="color: #60a5fa;">Open Document →</a></p>
          </div>
        \`;
      }
      
      if (item.tags && item.tags.length > 0) {
        detailsHtml += \`
          <div class="modal-section">
            <h3>Tags</h3>
            <p>\${item.tags.join(', ')}</p>
          </div>
        \`;
      }
      
      detailsHtml += \`
        <div class="modal-section">
          <h3>Metadata</h3>
          <p>Added: \${new Date(item.addedAt).toLocaleString()}</p>
          <p>Asset ID: <code>\${item.id}</code></p>
          \${item.type === 'video' && item.fileSize ? \`<p>File Size: \${formatVideoSize(item.fileSize)}</p>\` : ''}
          \${item.duration && item.duration > 0 ? \`<p>Duration: \${formatDuration(item.duration)}</p>\` : ''}
        </div>
      \`;
      
      details.innerHTML = detailsHtml;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    
    // Close modal
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
      document.body.style.overflow = 'auto';
    }
    
    // Copy source URL
    function copySourceUrl() {
      if (!currentItem || !currentItem.sourceUrl) {
        alert('No source URL available');
        return;
      }
      
      navigator.clipboard.writeText(currentItem.sourceUrl).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      });
    }
    
    // Copy MDX code
    function copyMdxCode() {
      if (!currentItem) return;
      
      let code = '';
      
      if (currentItem.type === 'video' && currentItem.videoId) {
        code = \`<CloudflareVideo videoId="\${currentItem.videoId}" />\`;
      } else if (currentItem.type === 'image' && currentItem.imageId) {
        code = \`<CloudflareImage imageId="\${currentItem.imageId}" alt="\${currentItem.alt || currentItem.fileName}" />\`;
      } else if (currentItem.type === 'document' && currentItem.publicUrl) {
        code = \`[\${currentItem.linkText || currentItem.fileName}](\${currentItem.publicUrl})\`;
      }
      
      if (!code) {
        alert('Could not generate MDX code');
        return;
      }
      
      navigator.clipboard.writeText(code).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      });
    }
    
    // Event listeners
    document.getElementById('search').addEventListener('input', (e) => {
      currentSearch = e.target.value;
      applyFilters();
    });
    
    document.getElementById('sort').addEventListener('change', (e) => {
      currentSort = e.target.value;
      localStorage.setItem('mediaSort', currentSort);
      applyFilters();
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentType = tab.dataset.type;
        applyFilters();
      });
    });
    
    // Close modal on outside click
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') closeModal();
    });
    
    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
    
    // Utility functions
    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    function formatVideoSize(bytes) {
      if (!bytes || bytes === 0) return '0 GB';
      const gb = bytes / (1024 * 1024 * 1024);
      return gb.toFixed(2) + ' GB';
    }
    
    function formatDuration(seconds) {
      if (seconds < 0) return 'Unknown';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
    }
    
    // Load saved sort preference
    const savedSort = localStorage.getItem('mediaSort');
    if (savedSort) {
      currentSort = savedSort;
      document.getElementById('sort').value = savedSort;
    }
    
    // Initialize
    init();
  </script>
</body>
</html>`;

// Start server
app.listen(PORT, () => {
  console.log('\n📚 Media Library Browser');
  console.log('═══════════════════════════════════════\n');
  console.log(`   Server running at: http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
  console.log('═══════════════════════════════════════\n');
  
  // Auto-open browser
  open(`http://localhost:${PORT}`).catch(() => {
    console.log('   💡 Open http://localhost:3001 in your browser\n');
  });
});
