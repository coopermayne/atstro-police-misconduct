/**
 * Media Library Schema
 * 
 * Minimal schema for tracking uploaded media.
 * The library serves as a deduplication registry and Cloudflare ID lookup.
 * Editorial metadata (captions, alt text, etc.) belongs in article frontmatter.
 */

export interface MediaLibrary {
  videos: Record<string, VideoEntry>;
  images: Record<string, ImageEntry>;
  documents: Record<string, DocumentEntry>;
}

export interface VideoEntry {
  /** Custom generated ID (format: video-{uuid}) */
  id: string;
  /** Original URL where the video was sourced from */
  sourceUrl: string;
  /** ISO 8601 timestamp when the video was added to the library */
  addedAt: string;
  /** Cloudflare Stream API response data */
  cloudflare: {
    /** Cloudflare Stream video ID */
    videoId: string;
    /** Embed iframe URL */
    embedUrl: string;
    /** HLS stream URL */
    streamUrl: string;
    /** Thumbnail image URL */
    thumbnailUrl: string;
    /** Any additional fields returned by Cloudflare API */
    [key: string]: any;
  };
}

export interface ImageEntry {
  /** Custom generated ID (format: image-{uuid}) */
  id: string;
  /** Original URL where the image was sourced from */
  sourceUrl: string;
  /** ISO 8601 timestamp when the image was added to the library */
  addedAt: string;
  /** Cloudflare Images API response data */
  cloudflare: {
    /** Cloudflare Images ID */
    imageId: string;
    /** Cloudflare Images variant URLs */
    variants: {
      thumbnail: string;
      medium: string;
      large: string;
      public: string;
    };
    /** Any additional fields returned by Cloudflare API */
    [key: string]: any;
  };
}

export interface DocumentEntry {
  /** Custom generated ID (format: document-{uuid}) */
  id: string;
  /** Original URL where the document was sourced from */
  sourceUrl: string;
  /** ISO 8601 timestamp when the document was added to the library */
  addedAt: string;
  /** Cloudflare R2 API response data */
  cloudflare: {
    /** R2 object key (unique filename in bucket) */
    r2Key: string;
    /** Public URL to access the document */
    publicUrl: string;
    /** MIME type (e.g., "application/pdf") */
    contentType: string;
    /** Any additional fields returned by Cloudflare API */
    [key: string]: any;
  };
}
