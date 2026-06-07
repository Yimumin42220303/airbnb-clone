# 날짜 선택 모달 PC 화면 하단 잘림 버그 수정

## 증상

PC 화면에서 예약 폼의 날짜 선택 버튼을 클릭하면 달력 모달이 뷰포트 하단을 벗어나 잘려나온다.

---

## 원인

**파일:** `src/components/listing/BookingForm.tsx`

`useLayoutEffect` 안의 `calendarPosition` 계산 로직에서 PC 분기(`isMobile === false`)에 `maxHeight`를 설정하지 않는다.

현재 코드 (244~252번째 줄):

```ts
const rect = calendarWrapRef.current.getBoundingClientRect();
const left = Math.max(16, win ? rect.right - width : rect.left);
const spaceBelow = win ? win.innerHeight - rect.bottom - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
const spaceAbove = win ? rect.top - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
const top =
  win && spaceBelow < CALENDAR_APPROX_HEIGHT && spaceAbove >= CALENDAR_APPROX_HEIGHT
    ? rect.top - CALENDAR_APPROX_HEIGHT - CALENDAR_MARGIN
    : rect.bottom + CALENDAR_MARGIN;
setCalendarPosition({ top, left, width }); // maxHeight 없음
```

문제점 두 가지:
1. `maxHeight` 미설정 → 달력이 뷰포트 아래로 넘쳐도 클리핑 없이 잘림
2. 위로 올리는 조건(`spaceBelow < CALENDAR_APPROX_HEIGHT`)의 기준값 `CALENDAR_APPROX_HEIGHT = 440`이 실제 달력 높이보다 작으면, 위로도 못 올라가고 아래로도 잘리는 상황 발생

---

## 수정 방법

**파일:** `src/components/listing/BookingForm.tsx`

PC 분기 계산 로직을 아래로 교체한다.

### 변경 전

```ts
const rect = calendarWrapRef.current.getBoundingClientRect();
const left = Math.max(16, win ? rect.right - width : rect.left);
const spaceBelow = win ? win.innerHeight - rect.bottom - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
const spaceAbove = win ? rect.top - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
const top =
  win && spaceBelow < CALENDAR_APPROX_HEIGHT && spaceAbove >= CALENDAR_APPROX_HEIGHT
    ? rect.top - CALENDAR_APPROX_HEIGHT - CALENDAR_MARGIN
    : rect.bottom + CALENDAR_MARGIN;
setCalendarPosition({ top, left, width });
```

### 변경 후

```ts
const rect = calendarWrapRef.current.getBoundingClientRect();
const left = Math.max(16, win ? rect.right - width : rect.left);
const spaceBelow = win ? win.innerHeight - rect.bottom - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
const spaceAbove = win ? rect.top - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;

// 아래 공간이 부족하고 위 공간이 충분하면 위로 열기
const openAbove =
  win && spaceBelow < CALENDAR_APPROX_HEIGHT && spaceAbove >= CALENDAR_APPROX_HEIGHT;

const top = openAbove
  ? rect.top - CALENDAR_APPROX_HEIGHT - CALENDAR_MARGIN
  : rect.bottom + CALENDAR_MARGIN;

// 위로 열든 아래로 열든 뷰포트를 벗어나지 않도록 maxHeight 설정
const maxHeight = openAbove
  ? Math.min(CALENDAR_APPROX_HEIGHT, spaceAbove)
  : Math.min(CALENDAR_APPROX_HEIGHT, spaceBelow);

setCalendarPosition({ top, left, width, maxHeight });
```

---

## 주의사항

- `CALENDAR_APPROX_HEIGHT = 440` 값 자체는 변경하지 않는다
- 모바일 분기(`isMobile === true`) 로직은 건드리지 않는다
- 예약/결제 로직은 건드리지 않는다
- `maxHeight`는 달력 컴포넌트(`ListingBookingCalendar`)가 `overflow-hidden`이므로 내부 스크롤 없이 자연스럽게 클리핑된다. 달력 내부 레이아웃 수정은 불필요하다

---

## QA

```bash
npm run lint
npm run build
```

**로컬에서 확인:**

1. PC 브라우저(1280px 이상)에서 숙소 상세 페이지 접속
2. 예약 폼에서 날짜 선택 클릭
3. 달력이 뷰포트 안에 온전히 표시되는지 확인
4. 브라우저 창 높이를 줄여서(`600~700px`) 공간이 좁을 때도 확인
5. 위로 열리는 케이스: 브라우저 창을 아래로 스크롤해서 예약 폼이 화면 하단에 위치할 때 달력이 위로 열리는지 확인
6. 모바일 뷰(`768px 미만`)에서 기존 동작에 변화 없는지 확인
7. 날짜 선택 후 예약 버튼 클릭까지 기능 정상 동작 확인
