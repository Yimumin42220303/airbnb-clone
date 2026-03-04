/**
 * 샘플 블로그 글 2건을 DB에서 삭제
 * - 신주쿠 숙소 골라보기 (shinjuku-stay-tips)
 * - 도쿄 민박 처음 이용하시나요? (tokyo-minbak-first-time-guide)
 *
 * 사용법: node scripts/delete-sample-blog-posts.js
 * .env의 DATABASE_URL 사용 (로컬/프로덕션 구분 없이 현재 연결된 DB)
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SLUGS_TO_DELETE = ["shinjuku-stay-tips", "tokyo-minbak-first-time-guide"];

async function main() {
  for (const slug of SLUGS_TO_DELETE) {
    const deleted = await prisma.post.deleteMany({ where: { slug } });
    if (deleted.count > 0) {
      console.log(`삭제됨: /blog/${slug}`);
    } else {
      console.log(`해당 slug 없음 (이미 삭제됨?): ${slug}`);
    }
  }
  console.log("완료.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
