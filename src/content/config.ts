import { defineCollection, z } from 'astro:content';

const casesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Basic Info
    title: z.string(), // Victim's name
    description: z.string(),
    incident_date: z.string(),
    published: z.boolean().default(true),
    notes_file: z.string().nullable().optional(), // Path to notes file (e.g., "notes/cases/victim-name.md")
    featured_image: z.object({
      imageId: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    }).nullable().optional(),
    
    // Location
    city: z.string(),
    county: z.string(),
    
    // Demographics
    age: z.number().nullable().optional(),
    race: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    
    // Agencies
    agencies: z.array(z.string()),
    
    // Incident Details
    cause_of_death: z.string().nullable().optional(),
    armed_status: z.string().nullable().optional(),
    threat_level: z.enum(['No Threat', 'Low', 'Moderate', 'High', 'Deadly']).nullable().optional(),
    force_type: z.array(z.string()).nullable().optional(), // e.g., ['Shooting', 'Beating', 'Taser', 'Restraint']
    shooting_officers: z.array(z.string()).nullable().optional(), // Officer names involved
    
    // Investigation
    investigation_status: z.string().nullable().optional(),
    
    // Legal
    charges_filed: z.boolean().nullable().optional(),
    civil_lawsuit_filed: z.boolean().nullable().optional(),
    
    // Media availability
    bodycam_available: z.boolean().nullable().optional(),
    
    // Documents
    documents: z.array(z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
    })).nullable().optional(),
    
    // External Links
    external_links: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      url: z.string(),
      icon: z.enum(['news', 'video', 'generic']).optional(),
    })).nullable().optional(),
  }),
});

// Optional collections for custom metadata pages
const agenciesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const countiesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published_date: z.string(),
    published: z.boolean().default(true),
    notes_file: z.string().nullable().optional(), // Path to notes file (e.g., "notes/posts/article-slug.md")
    tags: z.array(z.string()),
    featured_image: z.object({
      imageId: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    }).nullable().optional(),
    
    // Documents
    documents: z.array(z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
    })).nullable().optional(),
    
    // External Links
    external_links: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      url: z.string(),
      icon: z.enum(['news', 'video', 'generic']).optional(),
    })).nullable().optional(),
  }),
});

export const collections = {
  'cases': casesCollection,
  'agencies': agenciesCollection,
  'counties': countiesCollection,
  'posts': postsCollection,
};