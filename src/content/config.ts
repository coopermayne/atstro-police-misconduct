import { defineCollection, z } from 'astro:content';

const casesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Basic Info
    case_id: z.string(),
    title: z.string(),
    description: z.string(),
    victim_name: z.string(),
    incident_date: z.string(),
    published: z.boolean().default(true),
    
    // Location
    city: z.string(),
    county: z.string(),
    
    // Demographics
    age: z.number().optional(),
    race: z.string().optional(),
    gender: z.string().optional(),
    
    // Agencies
    agencies: z.array(z.string()),
    
    // Incident Details
    cause_of_death: z.string().optional(),
    armed_status: z.string().optional(),
    
    // Investigation
    investigation_status: z.string().optional(),
    
    // Legal
    charges_filed: z.boolean().optional(),
    civil_lawsuit_filed: z.boolean().optional(),
    
    // Media availability
    bodycam_available: z.boolean().optional(),
    
    // Documents
    documents: z.array(z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
    })).optional(),
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
    tags: z.array(z.string()),
    featured_image: z.string().optional(),
    
    // Documents
    documents: z.array(z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

export const collections = {
  'cases': casesCollection,
  'agencies': agenciesCollection,
  'counties': countiesCollection,
  'posts': postsCollection,
};