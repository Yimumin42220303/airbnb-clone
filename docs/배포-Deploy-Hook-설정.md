# Vercel Deploy Hook 설정 가이드

push 후 자동으로 Vercel 배포가 되도록 Deploy Hook을 설정합니다.

**전체 배포 흐름**은 `docs/배포-가이드.md` 참고.

---

## 즉시 적용 방법

### 1. Vercel 대시보드 → 프로젝트 → Settings → Git

`npm run setup:deploy-hook` 실행 시 브라우저가 자동으로 열립니다.  
(기본: minbaktokyos = tokyominbak.net, chris-projects 사용 시 `VERCEL_TEAM=chris npm run setup:deploy-hook`)

- minbaktokyos: https://vercel.com/minbaktokyos-projects/airbnb-clone/settings/git
- chris-projects: https://vercel.com/chris-projects/airbnb-clone/settings/git

### 2. Deploy Hooks에서 main 브랜치용 URL 생성

- **Deploy Hooks** 섹션으로 이동
- **Create Hook** 클릭
- Name: `main 배포` (또는 원하는 이름)
- Branch: **main** 선택
- 생성된 URL 복사 (예: `https://api.vercel.com/v1/integrations/deploy/...`)

### 3. .env에 추가

프로젝트 루트 `.env` 파일에 다음 한 줄 추가:

```
VERCEL_DEPLOY_HOOK="생성된_URL"
```

`생성된_URL`을 2단계에서 복사한 URL로 교체하세요.

### 4. 확인

이후 `npm run deploy` 실행 시:

1. 변경사항이 있으면 git add → commit → push
2. push 직후 Deploy Hook이 자동 호출됨
3. Vercel 배포가 트리거됨

---

## 요약

| 단계 | 작업 |
|------|------|
| 1 | Vercel → Settings → Git 이동 |
| 2 | Deploy Hooks에서 main 브랜치용 URL 생성 |
| 3 | `.env`에 `VERCEL_DEPLOY_HOOK="URL"` 추가 |
| 4 | `npm run deploy` 실행 시 push 후 자동 배포 |

---

## 대안: VERCEL_TOKEN

Deploy Hook URL을 사용할 수 없으면 [Vercel 토큰](https://vercel.com/account/tokens)을 발급받아 `.env`에 설정:

```
VERCEL_TOKEN="토큰값"
```

동일하게 `npm run deploy` 시 push 후 API로 배포가 트리거됩니다.
