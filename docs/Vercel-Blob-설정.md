# Vercel Blob 스토리지 설정 (이미지 업로드용)

숙소 등록 시 이미지 업로드가 동작하려면 Vercel Blob 스토리지가 필요합니다.

## 설정 방법

1. **Vercel 대시보드** → 프로젝트 선택 → **Storage** 탭
2. **Create Database** → **Blob** 선택 → 생성
3. 생성된 Blob 스토리지를 **프로젝트에 연결** (Connect to Project)
4. 연결 시 `BLOB_READ_WRITE_TOKEN` 환경 변수가 자동으로 추가됩니다.

## 확인

- Vercel 프로젝트 → **Settings** → **Environment Variables**
- `BLOB_READ_WRITE_TOKEN` 이 있는지 확인

## Forbidden 에러가 발생할 때

"이미지 업로드 실패: Forbidden" 또는 "Access denied" 에러가 나면:

1. **Reset Credentials** (가장 빠름): Vercel 대시보드 → Storage → Blob → 해당 스토리지 → **Settings** → **Reset Credentials** → **Reset** 클릭
2. 또는 **Disconnect 후 재연결**: Blob 스토리지 → **Projects** 탭에서 Disconnect 후 다시 Connect to Project
3. **환경 변수 확인**: Settings → Environment Variables → `BLOB_READ_WRITE_TOKEN`이 Production/Preview 모두에 설정되어 있는지 확인
4. **재배포 필수**: 토큰 변경 후 반드시 **Redeploy** 실행 (Deployments → 최신 배포 → ⋯ → Redeploy)

## 참고

- Blob은 Vercel의 파일 스토리지 서비스입니다.
- 무료 플랜: 1GB 저장 용량
- [Vercel Blob 문서](https://vercel.com/docs/storage/vercel-blob)
