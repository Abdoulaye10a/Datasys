ALTER TABLE "MessageReply"
ADD COLUMN "senderName" TEXT,
ADD COLUMN "senderEmail" TEXT;

UPDATE "MessageReply"
SET "senderName" = "User"."name",
    "senderEmail" = "User"."email"
FROM "User"
WHERE "MessageReply"."senderId" = "User"."id";

ALTER TABLE "MessageReply"
ALTER COLUMN "senderName" SET NOT NULL,
ALTER COLUMN "senderEmail" SET NOT NULL;
