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

## 참고

- Blob은 Vercel의 파일 스토리지 서비스입니다.
- 무료 플랜: 1GB 저장 용량
- [Vercel Blob 문서](https://vercel.com/docs/storage/vercel-blob)
