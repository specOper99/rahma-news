ALTER TABLE "article_translations"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(dek, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(body_text, '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "edition_search_gin" ON "article_translations" USING GIN ("search_vector");
