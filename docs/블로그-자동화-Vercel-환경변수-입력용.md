# 블로그 자동화 – Vercel에 넣을 환경 변수 (복사용)

로컬 `.env`에는 이미 반영되어 있습니다. **Vercel 대시보드**에서 아래 값을 **Production** 환경에 추가하세요.

1. Vercel 대시보드 → 프로젝트 선택 → **Settings** → **Environment Variables**
2. 각 변수 **Name** / **Value** 입력 후 **Environment**에서 **Production** 선택 후 Save
3. **전부 넣은 뒤** Deployments에서 **Redeploy** 한 번 실행

---

## 복사해서 넣을 값

| Name | Value (아래 한 줄 통째로 복사) |
|------|--------------------------------|
| **BLOG_AUTO_PUBLISH_API_KEY** | `eafb6390c7071e46c8412364459cdf34bbfc81f86a2282ac` |
| **CRON_SECRET** | `44cb78da6e3e37e4247a0f04e0c529d3c3e5d976accba02cdb1c8e88eba22281` |

- **BLOG_AUTHOR_USER_ID**: 선택. 비우면 DB의 첫 번째 admin이 작성자로 사용됩니다.
- **OPENAI_API_KEY**: 일일 크론(매일 1편 자동 작성)을 쓸 때만 필요. 이미 AI 추천용으로 쓰는 키가 있으면 같은 키를 Production에 넣으면 됩니다.

---

설정 후 Redeploy하면 블로그 자동 등록(Custom GPT·일일 크론)이 동작합니다.
