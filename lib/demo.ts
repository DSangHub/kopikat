import type { Profile } from "./types";
export const demoProfile: Profile = {
  id: "demo-profile", slug: "maya-homes", name: "Maya Rodriguez", title: "Residential Realtor", company: "Sunline Realty", phone: "559-555-0147", email: "maya@example.com", location: "Central Valley, California", initials: "MR",
  bio: "Helping buyers and sellers move with confidence—from the first showing to the final signature.",
  packs: [{ id: "pack-open-house", slug: "open-house", title: "Open House Pack", description: "Everything you need for 1842 Valencia Avenue.", accent: "coral", documents: [
    { id: "doc-1", title: "Property brochure", kind: "PDF", url: "#contact" },
    { id: "doc-2", title: "Home features", kind: "LIST", url: "#contact" },
    { id: "doc-3", title: "Schedule a private tour", kind: "BOOK", url: "#contact" }
  ]}]
};
