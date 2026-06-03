/**
 * 기존 대화 전원 읽음 처리 (배포 직후 1회 실행)
 * node scripts/backfill-conversation-read.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  const backfillAt = new Date();

  const conversations = await prisma.conversation.findMany({
    select: {
      id: true,
      booking: {
        select: {
          userId: true,
          listing: { select: { userId: true } },
        },
      },
    },
  });

  let upsertCount = 0;
  for (const c of conversations) {
    const guestId = c.booking.userId;
    const hostId = c.booking.listing.userId;
    for (const userId of [guestId, hostId]) {
      if (!userId) continue;
      await prisma.conversationRead.upsert({
        where: {
          userId_conversationId: { userId, conversationId: c.id },
        },
        create: { userId, conversationId: c.id, lastReadAt: backfillAt },
        update: { lastReadAt: backfillAt },
      });
      upsertCount++;
    }
  }

  const notifResult = await prisma.notification.updateMany({
    where: { type: "new_message", readAt: null },
    data: { readAt: backfillAt },
  });

  console.log(`✓ ConversationRead upsert: ${upsertCount}건 (${conversations.length}개 대화)`);
  console.log(`✓ new_message 알림 readAt 처리: ${notifResult.count}건`);
  console.log(`  backfillAt: ${backfillAt.toISOString()}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
