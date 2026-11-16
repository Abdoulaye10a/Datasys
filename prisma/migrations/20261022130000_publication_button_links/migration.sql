ALTER TABLE "Article"
ADD COLUMN "linkHref" TEXT,
ADD COLUMN "linkLabel" TEXT;

ALTER TABLE "Activity"
ADD COLUMN "linkHref" TEXT,
ADD COLUMN "linkLabel" TEXT;

ALTER TABLE "Announcement"
ADD COLUMN "linkHref" TEXT,
ADD COLUMN "linkLabel" TEXT;
