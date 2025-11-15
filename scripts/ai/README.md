# AI Modules

This folder contains AI-powered content generation modules.

## Files

- **`prompts.js`** - AI prompt building functions for metadata extraction and article generation
- **`generators.js`** - Content generation functions that orchestrate AI calls for cases and blog posts

## Purpose

These modules handle all interactions with Claude AI (Anthropic) for:

1. **Metadata Extraction**: Extract structured metadata from draft content (case details, blog post info)
2. **Article Generation**: Generate publication-ready MDX content with proper formatting and components

## Usage

### Generators

The generators module exports two main functions:

```javascript
import { generateCaseArticle, generateBlogPost } from './ai/generators.js';

// Generate a case article
const caseArticle = await generateCaseArticle(draftPath, mediaPackage, debugMode);
// Returns: { metadata, content, slug }

// Generate a blog post
const blogPost = await generateBlogPost(draftPath, mediaPackage, debugMode);
// Returns: { metadata, content, slug }
```

### Prompts

The prompts module provides building blocks for AI prompts:

```javascript
import {
  buildCaseMetadataPrompt,
  buildCaseArticlePrompt,
  buildBlogMetadataPrompt,
  buildBlogArticlePrompt,
  buildComponentReference,
  FIELD_REGISTRY_MAP
} from './ai/prompts.js';
```

## Registry Integration

The prompts automatically integrate with the metadata registry to ensure consistent terminology across all content. The `FIELD_REGISTRY_MAP` defines how each field should be handled and what values are available.

## Debug Mode

Both generator functions support a `debugMode` parameter. When enabled, users will see each prompt before it's sent to the AI and can review responses before proceeding.

```javascript
// Enable debug mode
const result = await generateCaseArticle(draftPath, mediaPackage, true);
```

## AI Model

Currently uses **Claude Sonnet 4** (claude-sonnet-4-20250514) with:
- 4000 tokens for metadata extraction
- 8000 tokens for article generation

## Configuration

Requires `ANTHROPIC_API_KEY` environment variable to be set in `.env`.
