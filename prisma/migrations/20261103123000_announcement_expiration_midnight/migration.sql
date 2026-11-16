UPDATE "Announcement"
SET "expiresAt" = (
  (("expiresAt" AT TIME ZONE 'UTC')::date + 1)::timestamp AT TIME ZONE 'UTC'
)
WHERE "expiresAt" IS NOT NULL
  AND ("expiresAt" AT TIME ZONE 'UTC')::time IN (
    TIME '00:00:00',
    TIME '23:59:59.999'
  );
