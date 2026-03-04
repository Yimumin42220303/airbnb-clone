# Custom GPT로 블로그 작성·업로드 설정 가이드

ChatGPT가 블로그 글을 쓰고 **tokyominbak.net에 바로 등록**하도록 Custom GPT를 만드는 방법을 단계별로 안내합니다.

---

## 준비물

| 항목 | 확인 |
|------|------|
| **ChatGPT Plus** | Custom GPT는 Plus 구독이 필요합니다. |
| **API 키** | `.env` 또는 Vercel에 설정한 `BLOG_AUTO_PUBLISH_API_KEY` 값(48자 영숫자). 없으면 프로젝트 루트 `.env`에서 확인하세요. |
| **배포된 사이트** | `https://tokyominbak.net` (또는 사용 중인 도메인)이 이미 배포되어 있어야 합니다. |

---

## 1단계: Custom GPT 만들기

1. **ChatGPT** 접속 후 왼쪽 사이드바에서 **Explore GPTs** 클릭.
2. 오른쪽 위 **Create** 버튼 클릭.
3. **Create a GPT** 화면이 나오면 왼쪽은 대화창, 오른쪽은 **Configure** 탭이 보입니다. **Configure** 탭이 선택된 상태로 진행합니다.

---

## 2단계: 기본 정보 입력 (Configure 탭)

| 필드 | 입력 예시 |
|------|-----------|
| **Name** | `도쿄민박 블로그 작성기` (원하는 이름으로) |
| **Description** | `도쿄민박(tokyominbak.net) 블로그용 SEO·AEO 최적화 글을 작성하고, 작성 후 사이트에 자동 등록합니다.` |

---

## 3단계: Instructions(지시사항) 붙여넣기

**Configure** 탭 안에서 **Instructions** 라는 큰 입력 칸이 있습니다. 아래 전체를 **복사해서 그대로 붙여넣습니다.**

```
당신은 도쿄민박(tokyominbak.net) 블로그 작성자입니다. 도쿄 숙소·민박·일본 여행 정보를 한국인 여행자에게 해요체로 전달합니다.

## 출력 형식
글을 작성한 뒤 반드시 JSON 하나만 출력합니다. 키: title, slug, excerpt, coverImage, body, published
- title: 글 제목 (30~50자, 키워드 앞에)
- slug: URL용. 한글 가능, 띄어쓰기는 - 로. 예: 신주쿠-숙소-추천-2026
- excerpt: 메타 설명 120~160자
- coverImage: URL이 없으면 "(제안) 구체적 이미지 설명"
- body: 본문. 순수 텍스트만. HTML·마크다운 금지. 줄바꿈은 \n, 소제목은 ◆ 사용. 이미지 위치는 [IMG:(제안) 설명] 형태로 3~5곳. 후반에 "◆ 자주 묻는 질문" + Q./A. 2~4개. 글 끝에 "도쿄민박에서 확인해 보세요 → tokyominbak.net" CTA. 1,500~3,500자.
- published: true

## 톤
해요체, 친근하고 신뢰감 있게. 구체적 수치(가격·거리·시간) 포함. 2026년 기준 시의성.

## 중요
글 작성이 완료되면 반드시 create_blog_post 액션을 호출하여 tokyominbak.net에 등록해 줘. 사용자가 "업로드하지 마"라고 하지 않는 한, JSON 출력 후 곧바로 API를 호출해 줘.
```

- 더 상세한 규칙이 필요하면 `docs/블로그-작성-가이드라인-ChatGPT.md` 1~10절 내용을 이 Instructions 뒤에 추가해도 됩니다.

---

## 4단계: Actions(액션) 추가

1. **Configure** 탭에서 **Actions** 섹션으로 내려갑니다.
2. **Create new action** 버튼을 클릭합니다.
3. **Import from URL** 은 쓰지 않고, **Schema** 입력 칸에 아래 YAML 전체를 **복사해 붙여넣습니다.**

```yaml
openapi: 3.0.0
info:
  title: 도쿄민박 블로그 등록 API
  version: 1.0.0
servers:
  - url: https://tokyominbak.net
paths:
  /api/admin/blog/from-api:
    post:
      summary: 블로그 글을 도쿄민박 사이트에 등록
      operationId: create_blog_post
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, body]
              properties:
                title: { type: string, description: "글 제목" }
                slug: { type: string, description: "URL용 슬러그 (한글 가능, - 구분)" }
                excerpt: { type: string, description: "메타 설명 120~160자" }
                coverImage: { type: string, description: "대표 이미지 URL 또는 (제안) 설명" }
                body: { type: string, description: "본문 전체. 줄바꿈 \\n, 이미지 [IMG:url]" }
                published: { type: boolean, description: "true=즉시 공개, false=초안" }
      responses:
        "200":
          description: 등록 성공
        "400":
          description: 필수 필드 누락 등
        "401":
          description: API 키 오류
```

4. **도메인 확인**  
   - `servers.url` 이 `https://tokyominbak.net` 인지 확인합니다.  
   - 다른 도메인(예: `https://airbnb-clone-xxx.vercel.app`)을 쓰면 그 주소로 바꿉니다.

---

## 5단계: Authentication(인증) 설정

같은 **Actions** 화면 안에서 **Authentication** 영역을 찾습니다.

1. **Authentication** 드롭다운에서 **API Key** 를 선택합니다.
2. **Auth Type** 에서 **Bearer** 를 선택합니다.
3. **API Key** 입력 칸에 **BLOG_AUTO_PUBLISH_API_KEY** 값을 붙여넣습니다.  
   - 로컬: 프로젝트 폴더의 `.env` 파일에서 `BLOG_AUTO_PUBLISH_API_KEY=` 뒤의 48자 문자열을 복사합니다.  
   - Vercel: Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에서 Production의 `BLOG_AUTO_PUBLISH_API_KEY` 값을 복사합니다.
4. 앞뒤 공백이나 따옴표 없이 **키 값만** 넣는지 확인합니다.

---

## 6단계: 저장 후 테스트

1. 오른쪽 위 **Update** 또는 **Save** 버튼을 눌러 GPT를 저장합니다.
2. 저장 시 **Only me** / **Anyone with a link** 등 공개 범위를 선택할 수 있습니다. 본인만 쓸 경우 **Only me** 로 두면 됩니다.
3. 새 채팅을 열고 방금 만든 GPT를 선택한 뒤, 아래처럼 입력해 봅니다.

   ```
   오늘 블로그 글 써줘. 주제: 신주쿠 1인 숙소 추천
   ```

4. ChatGPT가 글을 작성한 뒤 **create_blog_post** 액션을 호출하면, 곧바로 tokyominbak.net 블로그에 글이 올라갑니다.  
   - 성공 시 응답에 글 URL이 포함됩니다.  
   - 실패 시 "401" 등 오류가 나오면 **5단계**의 API 키가 서버의 `BLOG_AUTO_PUBLISH_API_KEY`와 **완전히 동일한지** 다시 확인합니다.

---

## 자주 하는 실수

| 증상 | 확인할 것 |
|------|------------|
| 401 Unauthorized | ChatGPT Actions에 넣은 API Key와 서버(Vercel/로컬)의 `BLOG_AUTO_PUBLISH_API_KEY`가 같은지, 공백/따옴표가 없는지 확인. |
| 글은 쓰는데 업로드 안 함 | Instructions 마지막에 "create_blog_post 액션을 호출해 줘" 문구가 들어갔는지 확인. |
| wrong URL / 연결 실패 | Schema의 `servers.url` 이 실제 배포 주소(https 포함)인지 확인. |

---

## 요약 체크리스트

- [ ] ChatGPT Plus 구독
- [ ] Configure → Name, Description 입력
- [ ] Configure → Instructions에 위 지시문 전체 붙여넣기
- [ ] Actions → Create new action → Schema에 위 YAML 붙여넣기
- [ ] Schema의 `servers.url` 이 `https://tokyominbak.net` (또는 사용 도메인)인지 확인
- [ ] Authentication → API Key → Bearer → `BLOG_AUTO_PUBLISH_API_KEY` 값 입력
- [ ] Save 후 "오늘 블로그 글 써줘. 주제: …" 로 테스트

이대로 하면 Custom GPT가 블로그 글 작성과 업로드까지 한 번에 수행합니다.
