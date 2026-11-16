-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('ARTICLE', 'ACTIVITY', 'ANNOUNCEMENT', 'PROJECT', 'MEDIA');

-- CreateTable
CREATE TABLE "PublicationView" (
    "id" TEXT NOT NULL,
    "publicationType" "PublicationType" NOT NULL,
    "publicationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicationView_publicationType_publicationId_visitorId_key" ON "PublicationView"("publicationType", "publicationId", "visitorId");

-- CreateIndex
CREATE INDEX "PublicationView_publicationType_publicationId_idx" ON "PublicationView"("publicationType", "publicationId");