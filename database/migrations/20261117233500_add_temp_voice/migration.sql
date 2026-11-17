-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "voice_hub_channel" TEXT,
ADD COLUMN     "voice_category" TEXT,
ADD COLUMN     "voice_name_template" TEXT,
ADD COLUMN     "voice_default_limit" INTEGER;

-- CreateTable
CREATE TABLE "TempVoiceRoom" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "panel_message_id" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "user_limit" INTEGER NOT NULL DEFAULT 0,
    "empty_since" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempVoiceRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempVoiceRoom_channelId_key" ON "TempVoiceRoom"("channelId");

-- CreateIndex
CREATE INDEX "TempVoiceRoom_guildId_idx" ON "TempVoiceRoom"("guildId");

-- CreateIndex
CREATE INDEX "TempVoiceRoom_ownerId_idx" ON "TempVoiceRoom"("ownerId");

-- CreateIndex
CREATE INDEX "TempVoiceRoom_empty_since_idx" ON "TempVoiceRoom"("empty_since");

-- AddForeignKey
ALTER TABLE "TempVoiceRoom" ADD CONSTRAINT "TempVoiceRoom_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
