/**
 * minbak.tokyo 숙소 데이터 추출 → CSV 생성
 *
 * 사용법: node scripts/import-from-minbak-tokyo.js
 *
 * 생성된 minbak-tokyo-listings.csv를 확인 후
 * /admin/listings/import 에서 업로드하세요.
 *
 * ※ 가격·이미지 URL은 minbak.tokyo에서 동적 로딩되어
 *   추출되지 않습니다. CSV에서 수동 보완 후 import 하세요.
 */

const fs = require("fs");
const path = require("path");

// minbak.tokyo/rooms 에서 확인한 숙소 목록 (roomId, title, location)
const ROOMS = [
  { id: "1461292052461648447", title: "[다카다노바바역 도보6분]|리버사이드_신주쿠|〜4인・31㎡ 여유로운 공간", location: "다카다노바바역 도보 6분, 신주쿠", maxGuests: 4, bedrooms: 1, beds: 4, baths: 1 },
  { id: "1410641032952829714", title: "[신주쿠 10분] 도심 속 힐링, 통창 햇살이 가득한 감성 로프트 아파트", location: "신주쿠", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { id: "1433055722309621714", title: "[신축/무료건조기] 야마노테선 다카다노바바 도보권, 신주쿠/시부야 최적의 접근성", location: "다카다노바바, 신주쿠", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { id: "1500455021814190897", title: "[Wide-Stay] 후지산 아트와 모던함이 공존하는 도쿄의 은신처 (신주쿠 5분)", location: "신주쿠", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { id: "1392442325059157145", title: "가족 여행 추천! 이케부쿠로 인근 2층 독채 스테이 (최대 6인/오츠카역 근처)", location: "토시마(이케부쿠로), 오츠카역", maxGuests: 6, bedrooms: 2, beds: 4, baths: 1 },
  { id: "1430054082144104764", title: "시부야역 도보 10분! 도심 한복판에서 즐기는 세련된 감성 스테이", location: "시부야", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { id: "1320038674843027812", title: "도쿄 여행의 최중심! 신주쿠 30㎡ 넓은 객실 | 취사 가능·무료 세탁기 (최대 5인)", location: "신주쿠", maxGuests: 5, bedrooms: 1, beds: 3, baths: 1 },
  { id: "fhtvhsrl", title: "(독채사용&셀프체크인)도쿄타워, 아자부다이힐즈 도보거리! 쾌적한 5인실 독채 Asahistay-Roppongi", location: "미나토(롯폰기, 도쿄타워)", maxGuests: 5, bedrooms: 1, beds: 3, baths: 1 },
  { id: "uzpfynug", title: "[High-Floor] 신주쿠 야경이 보이는 발코니 | 히가시신주쿠역 도보 3분 & 세탁건조기 완비", location: "히가시신주쿠역 도보 3분, 신주쿠", maxGuests: 3, bedrooms: 1, beds: 2, baths: 1 },
  { id: "xy9bkypi", title: "도쿄 로컬 감성 가득한 아사쿠사 인근 숙소 | 혼조아즈마바시역 도보 8분 (건조기 완비)", location: "스미다(스카이트리), 혼조아즈마바시역", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { id: "3cuba5kr", title: "[Work & Stay] 듀얼 모니터 완비! 신주쿠 1정거장, 디지털 노마드를 위한 완벽한 아지트", location: "시부야", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
];

// CSV 이스케이프
function escapeCsv(val) {
  if (val == null || val === "") return '""';
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function main() {
  const outPath = path.join(__dirname, "..", "minbak-tokyo-listings.csv");
  const header =
    "title,location,description,pricePerNight,cleaningFee,maxGuests,bedrooms,beds,baths,imageUrls,category,isPromoted,houseRules";

  const rows = ROOMS.map((r, i) => {
    const desc = `${r.title} - 도쿄민박에서 엄선한 도쿄 현지 숙소입니다.`;
    const price = 100000; // placeholder - minbak.tokyo는 날짜별 동적 가격이라 추출 불가
    const imagePlaceholder = `https://placehold.co/800x600/f7f7f7/525252?text=minbak+${i + 1}`; // minbak.tokyo에서 실제 이미지 URL로 교체 권장
    return [
      escapeCsv(r.title),
      escapeCsv(r.location),
      escapeCsv(desc),
      price,
      0,
      r.maxGuests,
      r.bedrooms,
      r.beds,
      r.baths,
      escapeCsv(imagePlaceholder),
      "아파트",
      0,
      escapeCsv(""),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  fs.writeFileSync(outPath, "\uFEFF" + csv, "utf8"); // BOM for Excel
  console.log(`✅ ${outPath} 생성 완료 (${ROOMS.length}개 숙소)`);
  console.log("");
  console.log("⚠️  다음 작업이 필요합니다:");
  console.log("  1. pricePerNight: 실제 1박 요금으로 수정 (현재 100,000원 placeholder)");
  console.log("  2. imageUrls: minbak.tokyo에서 이미지 URL 확보 후 교체 (또는 placeholder 그대로 사용)");
  console.log("  3. tokyominbak.net /admin/listings/import 에서 CSV 업로드");
}

main();
