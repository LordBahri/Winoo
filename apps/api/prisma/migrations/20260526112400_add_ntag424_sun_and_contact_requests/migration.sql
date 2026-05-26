-- Add NTAG424 DNA SUN fields and public recovery ID to nfc_tags
ALTER TABLE "nfc_tags"
  ADD COLUMN     "public_id"     TEXT,
  ADD COLUMN     "tag_model"     TEXT,
  ADD COLUMN     "cmac_enabled"  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN     "cmac_key"      TEXT,
  ADD COLUMN     "sun_counter"   INTEGER NOT NULL DEFAULT 0;

-- Backfill public_id for existing rows (random 22-char base62 derived from gen_random_uuid)
UPDATE "nfc_tags"
  SET "public_id" = encode(gen_random_bytes(16), 'hex')
  WHERE "public_id" IS NULL;

ALTER TABLE "nfc_tags"
  ALTER COLUMN "public_id" SET NOT NULL;

CREATE UNIQUE INDEX "nfc_tags_public_id_key" ON "nfc_tags"("public_id");
CREATE INDEX        "nfc_tags_public_id_idx" ON "nfc_tags"("public_id");

-- Contact requests: rate-limited finder → owner messages
CREATE TABLE "contact_requests" (
  "id"            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tag_id"        UUID         NOT NULL,
  "finder_name"   TEXT,
  "finder_phone"  TEXT,
  "finder_email"  TEXT,
  "message"       TEXT,
  "latitude"      DOUBLE PRECISION,
  "longitude"     DOUBLE PRECISION,
  "ip_address"    TEXT,
  "user_agent"    TEXT,
  "delivered_at"  TIMESTAMP(3),
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_requests_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "nfc_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "contact_requests_tag_id_idx"     ON "contact_requests"("tag_id");
CREATE INDEX "contact_requests_created_at_idx" ON "contact_requests"("created_at");
