# 오가닉 색인·수동 제출 체크리스트

네이버 서치어드바이저·Google Search Console **수동 작업**용.  
코드 배포 후 24h / 72h / 7d / 14d에 반복 확인.

## 1. 색인 요청 우선 URL

### 핵심 입구
- https://tokyominbak.net/
- https://tokyominbak.net/search
- https://tokyominbak.net/blog

### SEO 랜딩 (1차)
- https://tokyominbak.net/tokyo-family-accommodation
- https://tokyominbak.net/tokyo-4-person-accommodation
- https://tokyominbak.net/tokyo-5-person-accommodation
- https://tokyominbak.net/shinjuku-family-accommodation
- https://tokyominbak.net/tokyo-korean-minbak

### 핵심 블로그 5개
- https://tokyominbak.net/blog/what-is-tokyominbak
- https://tokyominbak.net/blog/tokyo-minbak-vs-hotel
- https://tokyominbak.net/blog/shinjuku-family-accommodation-guide
- https://tokyominbak.net/blog/shibuya-ku-area-guide
- https://tokyominbak.net/blog/tokyo-travel-luggage-tips

### 숙소 상세 (등록 숙소 중 상위 10개 — GSC·네이버에서 URL 검사)
- 관리자 → 숙소 목록에서 `approved`·`hidden=false` 상위 노출 숙소 ID로  
  `https://tokyominbak.net/listing/{id}` 형식 제출

---

## 2. 네이버 서치어드바이저

| 항목 | URL/작업 |
|------|----------|
| 사이트 | https://searchadvisor.naver.com |
| 웹페이지 수집 요청 | 위 **색인 요청 우선 URL** 각각 |
| 사이트맵 제출 | https://tokyominbak.net/sitemap.xml |
| RSS 제출 | https://tokyominbak.net/rss.xml |
| robots 확인 | https://tokyominbak.net/robots.txt |

**확인 키워드 (site: 검색·브랜드):**  
`site:tokyominbak.net`, `도쿄민박`, `tokyominbak.net`

---

## 3. Google Search Console

| 항목 | 작업 |
|------|------|
| URL 검사 | 위 우선 URL → **색인 생성 요청** |
| Sitemaps | `sitemap.xml` 제출·마지막 읽기 일시 |
| Pages | noindex·리디렉션·Soft 404 오류 |
| `/blog/*` | 크롤링·색인 오류 24~72h 재확인 |

---

## 4. sitemap / RSS / robots

- [ ] sitemap에 랜딩 5개 URL 포함
- [ ] sitemap에 blog 5개 + listing 전체 포함
- [ ] RSS에 published blog item 포함 (noindex 글 제외)
- [ ] robots가 `/blog`, `/search`, `/listing`, 랜딩 경로 **Disallow 하지 않음**

로컬 QA: `npm run qa:organic-seo`  
(`QA_BASE=http://localhost:3000` 또는 운영 URL)

---

## 5. 확인 키워드 목록

| 키워드 | 기대 노출 페이지 |
|--------|----------------|
| 도쿄민박 | /, /blog/what-is-tokyominbak |
| 도쿄 민박 | /tokyo-korean-minbak, /search |
| 도쿄 한인민박 | /tokyo-korean-minbak |
| 도쿄 숙소 | /search |
| 도쿄 숙소 추천 | /search, /recommend |
| 도쿄 가족 숙소 | /tokyo-family-accommodation |
| 도쿄 4인 숙소 | /tokyo-4-person-accommodation |
| 도쿄 5인 숙소 | /tokyo-5-person-accommodation |
| 신주쿠 가족 숙소 | /shinjuku-family-accommodation, blog |
| 시부야 숙소 | /blog/shibuya-ku-area-guide, /search |
| 도쿄 짐 보관 | /blog/tokyo-travel-luggage-tips |

---

## 6. 체크 일정

### 24시간
- [ ] GSC URL 검사: `/search`, 랜딩 5개, blog 5개
- [ ] 네이버 수집 요청 10~20 URL
- [ ] `npm run qa:organic-seo` 실패 0

### 72시간
- [ ] GSC Pages — 신규 URL 색인·noindex 오류
- [ ] 네이버 site: 검색 — 랜딩·blog 노출 여부
- [ ] 숙소 상세 5개 URL 검사

### 7일
- [ ] 키워드 5개 site: 재검색
- [ ] sitemap lastmod 갱신 필요 페이지만 수동 갱신 (`sitemap-config.ts`)
- [ ] CMS: `scripts/upsert-core-blog-seo-fields.mjs` dry-run → 필드 수동 입력

### 14일
- [ ] 노출·클릭 전후 비교 (GSC·서치어드바이저)
- [ ] thin page·중복 메타 리라이트 후보 정리

---

## 7. 리라이트 기준

- meta description CTR 낮고 제목과 본문 불일치
- 랜딩 FAQ·체크리스트가 숙소 카드와 무관
- listing 상세 AEO 섹션이 데이터 부족으로 비어 있음 → 해당 섹션만 보강 (DB 숙소 데이터 수정 금지)

---

## 8. 블로그 SEO 필드 (CMS / dry-run)

```bash
node scripts/upsert-core-blog-seo-fields.mjs
```

- **--apply는 운영 승인 전 실행하지 않음**
- 출력 결과를 관리자 CMS에 수동 입력하거나, 승인 후 apply 검토
