-- Add a dedicated preview image for the large publication panels.
-- Nullable columns: no existing data is rewritten, and the public panels
-- fall back to the cover image when no preview image is set.
ALTER TABLE "Article" ADD COLUMN "previewImage" TEXT;
ALTER TABLE "Activity" ADD COLUMN "previewImage" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "previewImage" TEXT;
ALTER TABLE "Project" ADD COLUMN "previewImage" TEXT;
ALTER TABLE "Media" ADD COLUMN "previewImage" TEXT;
