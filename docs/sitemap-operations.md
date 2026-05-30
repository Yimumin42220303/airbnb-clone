# sitemap.xml · robots.txt 운영 가이드

도쿄민박(`https://tokyominbak.net`)의 사이트맵은 **Next.js App Router** `src/app/sitemap.ts`에서 **DB 조회 기반으로 자동 생성**됩니다.  
블로그 글·숙소가 추가·수정되면 **재배포 없이** `revalidate = 3600`(최대 1시간) 이내 `/sitemap.xml`에 반영됩니다.

---

## 검색엔진 제출 (최초 1회)

### 네이버 서치어드바이저

1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 로그인
2. **웹마스터 도구** → `https://tokyominbak.net` 선택
3. **요청 → 사이트맵 제출**
4. `https://tokyominbak.net/sitemap.xml` 입력 → 확인
5. **요청 → RSS 제출** (블로그 보조 피드, 선택): `https://tokyominbak.net/rss.xml`

### Google Search Console

1. [Google Search Console](https://search.google.com/search-console) 접속
2. `tokyominbak.net` 속성 선택
3. **Sitemaps** 메뉴
4. `sitemap.xml` 입력 → 제출
5. 발견 URL 수·오류 주기적 확인

---

## 운영 기준

| 항목 | 기준 |
|------|------|
| 사이트맵 재제출 | **새 글마다 불필요** — 최초 1회 제출 후 자동 갱신 |
| RSS 재제출 | **새 글마다 불필요** — `/rss.xml` 자동 갱신 |
| 중요 새 글 | 네이버 **수집 요청** / Google **URL 검사 → 색인 생성 요청** |
| 네이버 블로그 체험단 | `blog.naver.com` URL — **sitemap에 넣지 않음** (외부 도메인) |

---

## 새 블로그 글 발행 시 체크리스트

1. `/blog/{slug}` 공개·200 응답 확인
2. `/blog` 목록에 링크되는지 확인
3. `node scripts/verify-sitemap.mjs` 또는 `/sitemap.xml`에서 새 URL 포함 확인
4. 중요 글이면 네이버 수집 요청 / Google URL 검사
5. 내부 링크: `/search`, `/trust`, 관련 `/listing/{id}` 연결

---

## sitemap에 포함되는 URL

- 정적: `/`, `/search`, `/about`, `/trust`, `/policy`, `/agreement`, `/recommend`, `/blog`, `/lp/host`
- 동적: 공개 블로그 글(`/blog/{slug}`, `publishedAt` 있음), 승인·비숨김 숙소(`/listing/{id}`)

## sitemap에서 제외

- `/messages`, `/mypage`, `/wishlist`, `/admin`, `/host`, `/auth`, `/api`, `/booking` 등
- noindex 페이지, draft 블로그, 비공개·숨김 숙소
- 외부 URL (`blog.naver.com` 등)

---

## lastmod 기준

| 유형 | 기준 |
|------|------|
| 정적 페이지 | `src/lib/sitemap-config.ts` 고정 날짜 (콘텐츠 수정 시만 갱신) |
| `/blog` 목록 | 최신 공개 글의 `updatedAt` (없으면 `publishedAt`) |
| 블로그 글 | `updatedAt` → `publishedAt` → `createdAt` |
| 숙소 상세 | `updatedAt` → `createdAt` (가격·재고 변동으로 매번 갱신하지 않음) |

---

## 로컬·배포 후 검수

```bash
node scripts/verify-sitemap.mjs
node scripts/verify-sitemap.mjs https://tokyominbak.net
```

```powershell
(Invoke-WebRequest -Uri "https://tokyominbak.net/sitemap.xml" -UseBasicParsing).StatusCode
(Invoke-WebRequest -Uri "https://tokyominbak.net/robots.txt" -UseBasicParsing).Content
```
