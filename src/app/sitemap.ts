import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://safereads.app", lastModified: new Date(), priority: 1.0 },
    { url: "https://safereads.app/about", lastModified: new Date(), priority: 0.8 },
    { url: "https://safereads.app/contact", lastModified: new Date(), priority: 0.5 },
    { url: "https://safereads.app/privacy", lastModified: new Date(), priority: 0.3 },
    { url: "https://safereads.app/terms", lastModified: new Date(), priority: 0.3 },
  ];
}
