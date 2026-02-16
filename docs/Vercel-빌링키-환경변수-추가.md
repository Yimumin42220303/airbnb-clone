# Vercel 빌링키 환경변수 추가 (1분 설정)

## 1. Vercel 대시보드 접속

1. https://vercel.com 로그인
2. **minbaktokyos-projects** 팀 선택
3. **airbnb-clone** 프로젝트 클릭 (또는 실제 배포된 프로젝트명)

## 2. 환경변수 추가

1. 상단 **Settings** 탭 클릭
2. 왼쪽 메뉴 **Environment Variables** 클릭
3. **Add New** 버튼 클릭
4. 아래 값 입력:

| 항목 | 값 |
|------|-----|
| **Key** | `NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY` |
| **Value** | `channel-key-f5d898c3-3e08-4e34-905e-ce562024b615` |
| **Environments** | Production, Preview, Development **모두 체크** |

5. **Save** 클릭

## 3. 재배포

1. **Deployments** 탭으로 이동
2. 최신 배포의 **⋮** (더보기) 클릭
3. **Redeploy** 선택
4. **Redeploy** 확인

---

완료 후 체크인 7일 이상 전 예약 시 카드 등록(빌링키) 흐름이 동작합니다.
