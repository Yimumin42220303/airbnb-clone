/** 숙소 신뢰 카드·관리용 체크인 방식 라벨 */
export const CHECK_IN_METHOD_LABELS: Record<string, string> = {
  keybox: "키박스",
  smart_lock: "스마트락",
  front_desk: "대면 체크인",
  self_checkin: "셀프 체크인",
  other: "기타",
};

export const CHECK_IN_METHOD_OPTIONS = Object.entries(CHECK_IN_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);
