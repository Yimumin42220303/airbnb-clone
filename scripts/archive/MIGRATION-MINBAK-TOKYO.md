# minbak.tokyo → tokyominbak.net 마이그레이션 가이드

[minbak.tokyo](https://minbak.tokyo/)에 등록된 숙소를 tokyominbak.net으로 이전하는 방법입니다.

## 1단계: CSV 생성

```bash
npm run import:minbak-tokyo
```

`minbak-tokyo-listings.csv` 파일이 프로젝트 루트에 생성됩니다.

## 2단계: CSV 보완 (선택)

| 항목 | 설명 |
|------|------|
| **pricePerNight** | minbak.tokyo는 날짜별 동적 가격이라 자동 추출 불가. 실제 1박 요금으로 수정 |
| **imageUrls** | placeholder 이미지 사용 가능. minbak.tokyo에서 이미지 URL 확보 시 교체 권장 |

## 3단계: 일괄 등록

1. tokyominbak.net (또는 로컬 `/admin`) 접속
2. **관리자**로 로그인
3. **숙소 목록** → **일괄 등록**
4. `minbak-tokyo-listings.csv` 업로드

## 제한 사항

- **가격**: minbak.tokyo는 예약 날짜에 따라 가격이 달라져 자동 추출이 불가능합니다. CSV에서 수동 입력 필요
- **이미지**: minbak.tokyo 이미지는 동적 로딩되어 URL 추출이 어렵습니다. placeholder 또는 별도 확보한 URL 사용
- **상세 설명**: 기본 설명만 포함. minbak.tokyo 상세 페이지의 풀 텍스트는 필요 시 수동 복사
