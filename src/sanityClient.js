import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: "2szkack9",   // ← Replace this with your actual ID
  dataset: "production",
  useCdn: true,
  apiVersion: "2024-02-01",
});