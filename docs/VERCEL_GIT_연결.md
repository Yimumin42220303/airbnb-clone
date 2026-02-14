# Vercel에 airbnb-clone 저장소 연결하기

현재 저장소: `Yimumin42220303/airbnb-clone`  
Vercel 연결 계정: `minbaktokyo`

→ **minbaktokyo 계정에는 Yimumin42220303의 저장소가 보이지 않습니다.**

---

## 해결: Yimumin42220303 GitHub 계정 추가

### 1단계: Vercel에 GitHub 계정 추가

1. Vercel 대시보드 → **airbnb-clone** 프로젝트
2. **Settings** → **Git**
3. "Connected Git Repository"에서 **"Add GitHub Account"** 클릭
4. **Yimumin42220303** 계정으로 GitHub 로그인
5. Vercel 앱 권한 허용

### 2단계: 저장소 연결

1. 추가된 계정 목록에서 **Yimumin42220303** 선택
2. `airbnb-clone` 저장소가 보이면 선택
3. Production Branch: **main** 확인

### 3단계: 자동 배포 확인

- push 시 자동 배포가 활성화됩니다.
- Deployments 탭에서 새 배포가 생성되는지 확인하세요.

---

## 완료 후

Cursor에서 수정 → `git push` → Vercel 자동 배포 → tokyominbak.net 반영
