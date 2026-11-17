-- CreateTable
CREATE TABLE "VoiceProfile" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "channel_name" TEXT,
    "user_limit" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "allowed_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "denied_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceProfile_guildId_idx" ON "VoiceProfile"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceProfile_guildId_ownerId_key" ON "VoiceProfile"("guildId", "ownerId");

-- AddForeignKey
ALTER TABLE "VoiceProfile" ADD CONSTRAINT "VoiceProfile_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
