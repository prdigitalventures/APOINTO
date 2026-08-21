-- Backfill missing emails, then enforce uniqueness and verification fields.

UPDATE "User"
SET email = 'legacy-' || id || '@unverified.apointo.local'
WHERE email IS NULL OR TRIM(email) = '';

UPDATE "User" SET email = LOWER(TRIM(email));

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY "createdAt" ASC) AS rn
  FROM "User"
)
UPDATE "User" u
SET email = split_part(u.email, '@', 1) || '+dup-' || u.id || '@' || split_part(u.email, '@', 2)
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerifyTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifyExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
