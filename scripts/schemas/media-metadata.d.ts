/**
 * Media Metadata Schema
 * 
 * Schema for AI-extracted metadata from draft articles.
 * Used to validate AI responses before processing.
 */

export interface MediaMetadataResponse {
  /** Array of media items with extracted metadata */
  items: MediaMetadataItem[];
}

export interface MediaMetadataItem {
  /** Original source URL of the media */
  sourceUrl: string;
  /** Type of media (image, video, document, or link) */
  type: 'image' | 'video' | 'document' | 'link';
  /** Component-specific parameters extracted by AI */
  componentParams: VideoParams | ImageParams | DocumentParams | LinkParams;
  /** Confidence score from 0-1 indicating AI's certainty */
  confidence: number;
}

export interface VideoParams {
  /** Brief description of what the video shows (15-25 words max) */
  caption?: string;
  /** Optional poster image URL */
  poster?: string;
}

export interface ImageParams {
  /** Accessible description of image content (10-15 words max, REQUIRED) */
  alt: string;
  /** Brief description for display (15-25 words max, optional) */
  caption?: string;
}

export interface DocumentParams {
  /** Short descriptive title (3-8 words max, REQUIRED) */
  title: string;
  /** What the document contains (15-30 words max, REQUIRED) */
  description: string;
}

export interface LinkParams {
  /** Short title for the link (3-8 words max, optional - falls back to hostname if omitted) */
  title?: string;
  /** Additional context below the title (15-30 words max, optional) */
  description?: string;
  /** Icon variant: "video" for YouTube/Vimeo, "news" for news sources, "generic" (default) for other links */
  icon?: 'video' | 'news' | 'generic';
}
