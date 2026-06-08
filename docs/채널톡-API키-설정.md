# 채널톡 API 키 설정 (결제 확정 알림용)

예약·결제 확정 시 채널톡으로 봇 알림을 보내려면 Open API용 키를 발급해 환경 변수에 넣어야 합니다.

---

## 1. API 키 발급

1. **채널톡 데스크**에 로그인합니다.
2. **설정** 메뉴를 엽니다.
3. **API Key 관리**에서 **Access Key**와 **Access Secret**을 발급받습니다.
   - (메뉴명이 "보안 및 개발" 등일 수 있으니, API Key 관리 항목을 찾으면 됩니다.)

---

## 2. 환경 변수 설정

발급한 값을 아래 이름으로 설정합니다.

| 환경 변수명 | 넣을 값 |
|-------------|---------|
| `CHANNEL_ACCESS_KEY` | 발급받은 **Access Key** |
| `CHANNEL_ACCESS_SECRET` | 발급받은 **Access Secret** |

> 이 키는 **서버 전용**입니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

### 2-1. 로컬 (.env)

프로젝트 루트 `.env` 파일에 다음 두 줄을 추가합니다.

```
CHANNEL_ACCESS_KEY=여기에_Access_Key_붙여넣기
CHANNEL_ACCESS_SECRET=여기에_Access_Secret_붙여넣기
```

### 2-2. Vercel (배포 환경) — 상세 절차

배포된 사이트(tokyominbak.net 등)에서 채널톡 알림을 쓰려면 **Vercel 대시보드**에서 동일한 변수를 추가해야 합니다.

1. **Vercel 대시보드 접속**  
   https://vercel.com 로그인 후, 해당 프로젝트(예: airbnb-clone, tokyominbak.net 연결된 프로젝트)를 클릭합니다.

2. **설정 열기**  
   상단 탭에서 **Settings**를 선택합니다.

3. **환경 변수 페이지로 이동**  
   왼쪽 메뉴에서 **Environment Variables**를 클릭합니다.

4. **변수 추가**  
   - **Key**: `CHANNEL_ACCESS_KEY`  
     **Value**: 채널톡 데스크에서 복사한 Access Key  
     **Environment**: 결제가 일어나는 환경에 체크 (보통 **Production** 필수, Preview도 쓰면 체크)  
     → **Save** 클릭  
   - 같은 방식으로 한 번 더 추가:  
     **Key**: `CHANNEL_ACCESS_SECRET`  
     **Value**: 채널톡 데스크에서 복사한 Access Secret  
     **Environment**: Production(및 필요 시 Preview)  
     → **Save** 클릭  

5. **재배포로 반영**  
   환경 변수는 **새 배포**가 되어야 적용됩니다.  
   - **방법 A**: Vercel 대시보드에서 **Deployments** 탭 → 최신 배포 오른쪽 **⋮** → **Redeploy** 선택 후 **Redeploy** 버튼 클릭.  
   - **방법 B**: 로컬에서 `npm run deploy:cli` 또는 `git push` 후 자동 배포.  

재배포가 끝나면 다음 결제 확정부터 채널톡 알림이 발송됩니다.

---

## 3. 동작 방식

- **키가 설정된 경우**: 결제가 확정되면 채널톡으로  
  `"예약이 확정되었습니다. 메시지창에서 자세한 내용을 확인하세요."`  
  메시지가 발송됩니다.
- **키가 없거나 잘못된 경우**: 채널톡 알림만 발송되지 않습니다. **결제 처리와 메시지창 리다이렉트는 그대로 동작**합니다.

---

관련: [채널톡-예약확정-알림-구현-기획.md](./채널톡-예약확정-알림-구현-기획.md)
