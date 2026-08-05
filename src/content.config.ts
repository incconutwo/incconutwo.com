import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const projects = defineCollection({
  loader: file('public/data/projects.json'),
  schema: z.object({
    id: z.string(),
    featured: z.boolean().default(false),
    title: z.string(),
    shortDescription: z.string(),
    longDescription: z.string().optional(),
    group: z.string().default('Other'),
    links: z.array(
      z.object({
        label: z.string(),
        url: z.string(),
        kind: z.string()
      })
    ).default([]),
    stats: z.object({
      weeklyUsers: z.number().optional(),
      dailyUsers: z.number().optional()
    }).nullable().optional(),
    image: z.string().nullable().optional(),
    screenshots: z.array(z.string()).default([])
  })
});

export const collections = { projects };
