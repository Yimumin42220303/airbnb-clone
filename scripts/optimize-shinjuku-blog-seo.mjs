/**
 * shinjuku-family-accommodation-guide SEO 본문 정리
 * Post.body + excerpt만 UPDATE (예약/결제/스키마 무관)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const SLUG = "shinjuku-family-accommodation-guide";

const IDS = {
  classic: "cmo74q3da004e5uv4wdnqo3sy",
  apartment: "cmo74ef3l00345uv4hafvr7l7",
  riverside: "cmpbamgil0001m9motgb7aptv",
  asahi: "cmncytjx30001mvd6qszlltf5",
};

const CONCLUSION = `[BLOG_CONCLUSION]
신주쿠 가족여행 숙소는 인원수에 따라 다르게 고르는 것이 좋습니다.
2~3인 소가족|${IDS.asahi}|AsahiStay -Shinjuku
3~5인 가족|${IDS.apartment}|신주쿠역 도보 거리 내의 편리한 아파트
3~4인 가족·친구 여행|${IDS.riverside}|리버사이드_신주쿠
4~8인 대가족·3대 가족여행|${IDS.classic}|신주쿠 클래식 하우스
가족여행이라면 숙소 위치뿐 아니라 침대 수, 엘리베이터 여부, 세탁기·주방, 체크인 안내까지 함께 확인하는 것이 좋습니다.
[/BLOG_CONCLUSION]`;

const FAQ = `## 자주 묻는 질문

### Q. 신주쿠는 가족여행 숙소 위치로 괜찮나요?
교통과 편의시설이 좋아 가족여행 숙소 후보로 좋습니다. 다만 신주쿠역 바로 주변은 번잡할 수 있어 히가시신주쿠, 니시신주쿠, 다카다노바바 등 인근 지역도 함께 비교하는 것이 좋습니다.

### Q. 신주쿠 가족 숙소는 호텔과 민박 중 어느 쪽이 좋나요?
1~2인 짧은 일정은 호텔도 편하지만, 3인 이상 가족이라면 침대 구성과 생활 편의시설을 고려해 민박형 숙소가 더 편할 수 있습니다.

### Q. 아이와 함께라면 어떤 시설을 확인해야 하나요?
엘리베이터, 세탁기, 욕조, 전자레인지, 침대 배치, 역까지의 거리, 주변 편의점·마트 여부를 확인하는 것이 좋습니다.

### Q. 대가족은 신주쿠 호텔보다 민박이 나을까요?
4~8인 대가족이라면 호텔 객실을 여러 개 잡는 것보다 한 숙소에 함께 머물 수 있는 민박형 숙소가 편할 수 있습니다.
`;

function transformBody(body) {
  let b = body;

  b = b.replace(/\n*↓나한테 딱 맞는 숙소 추천받기\s*\nhttps?:\/\/tokyominbak\.net\/recommend\s*/gi, "\n");
  b = b.replace(
    /\n*##?\s*도쿄 숙소가 아직 고민된다면\?[\s\S]*?\/recommend\s*/gi,
    "\n"
  );
  b = b.replace(/\n*https?:\/\/tokyominbak\.net\/recommend\s*/gi, "\n");

  if (!b.includes("[BLOG_CONCLUSION]")) {
    const coverImg = b.match(/\[IMG:[^\]]+\]/);
    if (coverImg) {
      b = b.replace(coverImg[0], `${coverImg[0]}\n\n${CONCLUSION}`);
    } else {
      const introEnd = b.indexOf("\n\n", b.indexOf("소개해드리겠습니다"));
      if (introEnd > 0) {
        b = `${b.slice(0, introEnd + 2)}\n${CONCLUSION}\n\n${b.slice(introEnd + 2)}`;
      } else {
        b = `${CONCLUSION}\n\n${b}`;
      }
    }
  }

  const headingMap = [
    [/^가족여행에서 신주쿠 숙소를 고를 때 중요한 기준$/m, "## 신주쿠 가족 숙소를 고를 때 중요한 기준"],
    [/^그럼 이제 가족여행 인원별로 추천할 만한 신주쿠 숙소를 살펴보겠습니다\.$/m, "## 인원별 신주쿠 가족 숙소 추천"],
    [/^1\.\s*대가족·3대 가족여행이라면$/m, "### 4~8인 대가족: 신주쿠 클래식 하우스"],
    [/^1\.\s*3~5인 가족이라면$/m, "### 3~5인 가족: 신주쿠역 도보 거리 내의 편리한 아파트"],
    [/^1\.\s*3~4인 가족·친구 가족여행이라면$/m, "### 3~4인 가족: 리버사이드_신주쿠"],
    [/^1\.\s*2~3인 소가족이라면$/m, "### 2~3인 소가족: AsahiStay -Shinjuku"],
    [/^가족여행 인원별 추천 정리$/m, "## 결론: 가족 인원별 신주쿠 숙소 추천"],
    [/^신주쿠 가족 숙소 예약 전 체크리스트$/m, "## 신주쿠 가족 숙소 예약 전 체크리스트"],
    [/^도쿄 가족여행, 신주쿠 숙소는 이렇게 고르세요$/m, "## 도쿄 가족여행 숙소를 찾고 있다면"],
  ];
  for (const [re, repl] of headingMap) b = b.replace(re, repl);

  b = b.replace(
    /\[LISTING_CARD:classic\]/gi,
    `[LISTING_CARD:${IDS.classic}|4~8인 대가족·3대|최대 8명·침실 2·침대 7|엘리베이터·세탁기 예약 전 확인|신주쿠 클래식 하우스]`
  );
  b = b.replace(
    /\[LISTING_CARD:apartment\]/gi,
    `[LISTING_CARD:${IDS.apartment}|3~5인 가족|히가시신주쿠역 도보 5분·31㎡|호텔 대비 넓이·침대 구성 확인|신주쿠역 도보 거리 내의 편리한 아파트]`
  );
  b = b.replace(
    /\[LISTING_CARD:riverside\]/gi,
    `[LISTING_CARD:${IDS.riverside}|3~4인 가족·친구|다카다노바바역 도보 6분·주방·세탁|4층·엘리베이터 없음|리버사이드_신주쿠]`
  );
  b = b.replace(
    /\[LISTING_CARD:asahi\]/gi,
    `[LISTING_CARD:${IDS.asahi}|2~3인 소가족|히가시신주쿠역 도보 3분·욕조·세탁|4인 이상은 다른 숙소 비교|AsahiStay -Shinjuku]`
  );

  if (!b.includes("[BLOG_COMPARE:")) {
    b = b.replace(/\[BLOG_COMPARE\]/i, `[BLOG_COMPARE:${IDS.classic},${IDS.apartment},${IDS.riverside},${IDS.asahi}]`);
  }

  b = b.replace(
    /\n\|여행 인원\|추천 숙소\|[\s\S]*?\|상세보기\]\([^)]+\)\|\n/g,
    "\n"
  );

  b = b.replace(/\[IMG:([^|\]]+)\]/g, (match, inner) => {
    if (inner.includes("|")) return match;
    if (inner.includes("yhhtvqrjkrzv2op4fsiu")) {
      return `[IMG:${inner}|신주쿠 가족여행 숙소 추천 대표 이미지]`;
    }
    return match;
  });

  if (!b.includes("## 자주 묻는 질문")) {
    b = b.replace(
      /(## 도쿄 가족여행 숙소를 찾고 있다면[\s\S]*)$/,
      `$1\n\n${FAQ}`
    );
    if (!b.includes("## 자주 묻는 질문")) {
      b = `${b.trim()}\n\n${FAQ}`;
    }
  }

  return b.replace(/\n{3,}/g, "\n\n").trim();
}

const prisma = new PrismaClient();
const post = await prisma.post.findFirst({ where: { slug: SLUG } });
if (!post) {
  console.error("Post not found");
  process.exit(1);
}

const nextBody = transformBody(post.body);
const excerpt =
  "도쿄 가족여행에서 신주쿠 숙소를 고민 중이라면? 2~3인 소가족부터 4~8인 대가족까지 인원별 추천 숙소와 예약 전 체크포인트를 정리했습니다.";

await prisma.post.update({
  where: { id: post.id },
  data: {
    body: nextBody,
    excerpt,
    updatedAt: new Date(),
  },
});

console.log("Updated", SLUG, "body length:", nextBody.length);
await prisma.$disconnect();
