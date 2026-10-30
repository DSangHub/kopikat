-- Run after db/schema.sql. Access is mediated by server actions and downloads.
CREATE TABLE IF NOT EXISTS public.kopypak_files (
 document_id uuid PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
 filename text NOT NULL,
 content_type text NOT NULL,
 body bytea NOT NULL CHECK (octet_length(body) <= 750000)
);
ALTER TABLE public.kopypak_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kopypak_files FROM anon, authenticated;
