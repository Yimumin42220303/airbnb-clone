# 오가닉 콘텐츠 로드맵

블로그 CMS 2차 — **신규 글 대량 생성 전** 우선순위 계획.  
1차 랜딩(`/tokyo-*`, `/shinjuku-*`)과 내부링크 클러스터를 먼저 색인·전환 입구로 활용한다.

## 우선순위 기준

1. 상업 의도 키워드 (가족/4인/5인/지역/한인민박)
2. 기존 랜딩·숙소 상세·핵심 블로그 5개와 연결 가능
3. DB 숙소 데이터로 CTA·관련숙소 채울 수 있음

---

| 우선 | slug | H1 | 타깃 키워드 | 검색 의도 | 연결 랜딩 | 연결 숙소 유형 | CTA | 관련글 | 발행 |
|------|------|-----|------------|----------|----------|--------------|-----|--------|------|
| P0 | tokyo-minbak-faq | 도쿄민박 FAQ | 도쿄민박, 도쿄민박 이용 | 정보·신뢰 | /tokyo-korean-minbak | 전체 | /trust, /recommend | what-is-tokyominbak | 1 |
| P0 | tokyo-4-5-person-guide | 도쿄 4·5인 숙소 고르는 법 | 도쿄 4인 숙소, 5인 숙소 | 비교·선택 | /tokyo-4-person-accommodation, /tokyo-5-person-accommodation | maxGuests≥4 | /recommend | shinjuku-family, minbak-vs-hotel | 2 |
| P0 | tokyo-family-how-to-choose | 도쿄 가족여행 숙소 고르는 법 | 도쿄 가족 숙소 | 가족 숙소 선택 | /tokyo-family-accommodation | 가족·4인+ | /recommend | shinjuku-family, luggage-tips | 2 |
| P1 | tokyo-minbak-vs-airbnb | 도쿄 한인민박 vs 에어비앤비 | 도쿄 한인민박, 에어비앤비 | 비교 | /tokyo-korean-minbak | 전체 | /trust | what-is, minbak-vs-hotel | 3 |
| P1 | tokyo-3-person-stay | 도쿄 3인 숙소 추천 | 도쿄 3인 숙소 | 3인 여행 | /search?adults=3 | maxGuests≥3 | /recommend | minbak-vs-hotel | 3 |
| P1 | tokyo-group-6plus | 도쿄 6인 이상 단체 숙소 | 도쿄 단체 숙소 | 그룹 | /search?guests=6 | maxGuests≥6 | /recommend | family-how-to | 4 |
| P2 | hatsudai-area-guide | 하츠다이·初台 숙소 가이드 | 하츠다이 숙소 | 지역 | /search?location=하츠다이 | 시부야권 | /search | shibuya-ku-area-guide | 4 |
| P2 | kita-senju-area-guide | 키타센주 숙소 가이드 | 키타센주 숙소 | 지역 | /search | 키타센주 | /search | shibuya-ku-area-guide | 5 |
| P2 | narita-to-tokyo-stay | 나리타공항→도쿄 숙소 이동 | 나리타공항 숙소 | 교통 | /search | 공항 접근 | luggage-tips | luggage-tips | 3 |
| P2 | haneda-to-tokyo-stay | 하네다공항→도쿄 숙소 | 하네다공항 숙소 | 교통 | /search | 공항 접근 | luggage-tips | luggage-tips | 3 |
| P2 | tokyo-luggage-before-checkin | 체크인 전 짐 보관 | 도쿄 짐 보관 | 짐 | /tokyo-family-accommodation | 역세권 | /recommend | luggage-tips | 3 |
| P2 | tokyo-friends-stay | 도쿄 친구여행 숙소 | 도쿄 친구 숙소 | 친구 | /tokyo-4-person-accommodation | 3~4인 | /recommend | minbak-vs-hotel | 4 |
| P2 | tokyo-parents-stay | 부모님 동반 도쿄 숙소 | 도쿄 부모님 숙소 | 가족 | /tokyo-family-accommodation | 엘리베이터·역 | /trust | family-how-to | 4 |
| P2 | tokyo-with-kids-stay | 아이와 도쿄 숙소 | 도쿄 아이 숙소 | 가족 | /tokyo-family-accommodation | 가족 | /recommend | shinjuku-family | 4 |
| P1 | tokyo-booking-checklist | 도쿄 숙소 예약 전 체크리스트 | 도쿄 숙소 예약 | 예약 전 | /trust | 전체 | /trust, /search | what-is, minbak-vs-hotel | 2 |

---

## 클러스터 연결 (발행 시)

- **4인 클러스터**: `/tokyo-4-person-accommodation` ↔ `tokyo-4-5-person-guide` ↔ `minbak-vs-hotel` ↔ `/recommend`
- **가족 클러스터**: `/tokyo-family-accommodation` ↔ `shinjuku-family-guide` ↔ `luggage-tips` ↔ `/shinjuku-family-accommodation`
- **한인민박 클러스터**: `/tokyo-korean-minbak` ↔ `what-is-tokyominbak` ↔ `minbak-vs-airbnb` ↔ `/trust`

## 발행 시 CMS 체크

- metaDescription 80~140자, seoTitle 28~45자
- relatedPostSlugs·relatedListingIds 실존 slug/ID만
- noindex=false, placeholder/TODO 없음
