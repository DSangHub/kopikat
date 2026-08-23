export type DocumentItem = { id: string; title: string; kind: string; url: string };
export type Pack = { id: string; slug: string; title: string; description: string; accent: string; documents: DocumentItem[] };
export type Profile = { id: string; slug: string; name: string; title: string; company: string; phone: string; email: string; bio: string; location: string; initials: string; packs: Pack[] };
export type Lead = { id: string; profileSlug: string; name: string; email: string; phone: string; message: string; createdAt: string };
