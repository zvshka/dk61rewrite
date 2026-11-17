-- DropForeignKey
ALTER TABLE "RssEntry" DROP CONSTRAINT "RssEntry_feedId_fkey";

-- DropForeignKey
ALTER TABLE "RssFeed" DROP CONSTRAINT "RssFeed_guildId_fkey";

-- DropTable
DROP TABLE "RssEntry";

-- DropTable
DROP TABLE "RssFeed";
