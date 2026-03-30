/**
 * DB에 저장된 한국어 알림 제목을 일본어로 변환 (locale=ja 표시용)
 */

export function notificationTitleToJa(koTitle: string): string {
  let s = koTitle;

  // 고정 문구 (순서 유의: 더 구체적인 패턴 먼저)
  if (s === "호스트가 예약을 승인했어요. 24시간 이내에 결제해 주세요.")
    return "ホストが予約を承認しました。24時間以内に支払いしてください。";
  if (s === "호스트가 예약을 거절했어요. 다른 숙소를 찾아보세요.")
    return "ホストが予約を拒否しました。他の宿泊施設を探してください。";
  if (s === "결제 기한이 약 4시간 남았습니다. 기한 내 결제하지 않으면 예약이 자동 취소됩니다.")
    return "支払い期限まであと約4時間です。期限内に支払いがないと予約は自動キャンセルされます。";
  if (s === "결제 기한(24시간)이 만료되어 예약이 자동 취소되었습니다.")
    return "支払い期限（24時間）が過ぎたため、予約は自動的にキャンセルされました。";

  // ~님의 예약이 취소되었어요.
  const cancelMatch = s.match(/^(.+?)님의 예약이 취소되었어요\.$/);
  if (cancelMatch) return `${cancelMatch[1]}さんの予約がキャンセルされました。`;

  // ~님이 메시지를 보냈어요.
  const messageMatch = s.match(/^(.+?)님이 메시지를 보냈어요\.$/);
  if (messageMatch) return `${messageMatch[1]}さんがメッセージを送りました。`;

  // ~님이 결제를 완료했어요. 예약이 확정되었습니다.
  const paymentMatch = s.match(/^(.+?)님이 결제를 완료했어요\. 예약이 확정되었습니다\.$/);
  if (paymentMatch) return `${paymentMatch[1]}さんが支払いを完了しました。予約が確定しました。`;

  // ~님이 {listingTitle}에 즉시 예약을 신청했어요. 결제 완료 시 자동 확정됩니다.
  const instantMatch = s.match(/^(.+?)님이 (.+?)에 즉시 예약을 신청했어요\. 결제 완료 시 자동 확정됩니다\.$/);
  if (instantMatch) return `${instantMatch[1]}さんが${instantMatch[2]}に即時予約を申請しました。支払い完了で自動確定します。`;

  // 숙소 "{title}"가 승인되어 게재되었습니다.
  const approvedMatch = s.match(/^숙소 "(.+?)"가 승인되어 게재되었습니다\.$/);
  if (approvedMatch) return `宿泊施設「${approvedMatch[1]}」が承認され、掲載されました。`;

  // 숙소 "{title}" 등록이 거절되었습니다. 사유: {reason}
  const rejectedReasonMatch = s.match(/^숙소 "(.+?)" 등록이 거절되었습니다\. 사유: (.+)$/);
  if (rejectedReasonMatch) return `宿泊施設「${rejectedReasonMatch[1]}」の登録が拒否されました。理由：${rejectedReasonMatch[2]}`;

  // 숙소 "{title}" 등록이 거절되었습니다.
  const rejectedMatch = s.match(/^숙소 "(.+?)" 등록이 거절되었습니다\.$/);
  if (rejectedMatch) return `宿泊施設「${rejectedMatch[1]}」の登録が拒否されました。`;

  // "{listingTitle} 숙박은 어떠셨나요? 리뷰를 남겨 주세요."
  const reviewRequestMatch = s.match(/^(.+?) 숙박은 어떠셨나요\? 리뷰를 남겨 주세요\.$/);
  if (reviewRequestMatch) return `${reviewRequestMatch[1]}の宿泊はいかがでしたか？レビューを残してください。`;

  return s;
}
