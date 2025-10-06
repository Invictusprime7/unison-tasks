-- Allow anonymous documents by making user_id nullable and adding permissive policies for anon docs and their children

-- 1) Make documents.user_id nullable
ALTER TABLE public.documents
  ALTER COLUMN user_id DROP NOT NULL;

-- 2) Documents policies: keep existing owner-based policies and add anon policies
CREATE POLICY "Anyone can view anonymous documents"
ON public.documents
FOR SELECT
USING (user_id IS NULL);

CREATE POLICY "Anyone can insert anonymous documents"
ON public.documents
FOR INSERT
WITH CHECK (user_id IS NULL);

CREATE POLICY "Anyone can update anonymous documents"
ON public.documents
FOR UPDATE
USING (user_id IS NULL);

CREATE POLICY "Anyone can delete anonymous documents"
ON public.documents
FOR DELETE
USING (user_id IS NULL);

-- 3) Pages: allow managing pages for anon-owned documents
CREATE POLICY "Anyone can manage pages of anonymous documents"
ON public.pages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = pages.document_id AND d.user_id IS NULL
  )
);

-- 4) Layers: allow managing layers for anon-owned documents
CREATE POLICY "Anyone can manage layers of anonymous documents"
ON public.layers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.documents d ON d.id = p.document_id
    WHERE p.id = layers.page_id AND d.user_id IS NULL
  )
);

-- 5) Timelines: allow managing timelines for anon-owned documents
CREATE POLICY "Anyone can manage timelines of anonymous documents"
ON public.timelines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = timelines.document_id AND d.user_id IS NULL
  )
);

-- 6) Tracks: allow managing tracks for anon-owned timelines
CREATE POLICY "Anyone can manage tracks of anonymous documents"
ON public.tracks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.timelines t
    JOIN public.documents d ON d.id = t.document_id
    WHERE t.id = tracks.timeline_id AND d.user_id IS NULL
  )
);

-- 7) Clips: allow managing clips for anon-owned timelines
CREATE POLICY "Anyone can manage clips of anonymous documents"
ON public.clips
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tracks tr
    JOIN public.timelines ti ON ti.id = tr.timeline_id
    JOIN public.documents d ON d.id = ti.document_id
    WHERE tr.id = clips.track_id AND d.user_id IS NULL
  )
);

-- 8) Brand kits: allow managing brand kits for anon-owned documents
CREATE POLICY "Anyone can manage brand kits of anonymous documents"
ON public.brand_kits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = brand_kits.document_id AND d.user_id IS NULL
  )
);
