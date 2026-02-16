# AI 리뷰 요약 기능 사양

## 개요
숙소 상세 페이지 리뷰 섹션에서, **버튼 클릭 시에만** AI가 해당 숙소 리뷰 전체를 읽고 **좋은 점 / 아쉬운 점 / 이런 분에게 추천해요**를 요약해 표시한다.

## 요구사항
- **온디맨드**: "AI 요약 보기" 버튼 클릭 시에만 API 호출 (페이지 로드 시 호출 없음).
- **캐시**: 같은 숙소 요약은 DB에 저장하며, **24시간** 동안 재사용. 이후 재요청 시 다시 생성.
- **입력 제한**: 최근 리뷰 **최대 30개**, 각 리뷰 본문 **200자**로 잘라 전달해 토큰 상한 확보.
- **모델**: `gpt-4o-mini` 사용 (비용·속도 균형).

## 데이터
- **ListingReviewSummary**: `listingId`(유일), `prosJson`, `consJson`, `recommendedForJson`, `generatedAt`.
- **recommendedForJson**: "이런 분에게 추천해요" 문구 목록(JSON 배열). nullable(기존 캐시 호환).
- 응답: `{ pros: string[], cons: string[], recommendedFor: string[] }`.

## API
- **GET** `/api/listings/[id]/reviews/summary`
- 캐시 유효 시 캐시 반환, 없거나 만료 시 생성 후 저장·반환.
- 리뷰가 0개면 빈 배열(`pros`, `cons`, `recommendedFor`)과 메시지 반환.

## UI
- 리뷰가 1개 이상일 때만 "AI가 요약한 좋은 점·아쉬운 점·이런 분에게 추천해요" 버튼 노출.
- 클릭 시 로딩 → 요약 표시 (좋은 점 목록, 아쉬운 점 목록, **이런 분에게 추천해요** 목록).
