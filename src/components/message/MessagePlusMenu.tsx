"use client";

import { useHostTranslations } from "@/components/host/HostLocaleProvider";

type Props = {
  onClose: () => void;
  /** 호스트 전용: 전송 예약된 빠른 답변 보기 */
  onViewScheduledReplies?: () => void;
  /** 사진 또는 동영상 추가 선택 시 (게스트·호스트 공통) */
  onAddPhotoVideo?: () => void;
};

/** 에어비앤비 스타일: '+' 버튼 클릭 시 뜨는 플로팅 메뉴 (전송 예약된 빠른 답변 보기, 사진 첨부 등) */
export default function MessagePlusMenu({
  onClose,
  onViewScheduledReplies,
  onAddPhotoVideo,
}: Props) {
  const { t } = useHostTranslations();

  const menuItems: { key: string; icon: "reply" | "clock-reply" | "photo" | "pin" | "phone"; onClick?: () => void }[] = [
    { key: "messageMenu.sendQuickReply", icon: "reply" },
    { key: "messageMenu.viewScheduledReplies", icon: "clock-reply", onClick: onViewScheduledReplies },
    {
      key: "messageMenu.addPhotoVideo",
      icon: "photo",
      onClick: onAddPhotoVideo
        ? () => {
            onClose();
            onAddPhotoVideo();
          }
        : undefined,
    },
    { key: "messageMenu.sharePlace", icon: "pin" },
    { key: "messageMenu.addCallButton", icon: "phone" },
  ];

  return (
    <>
    <div className="fixed inset-0 z-40" aria-hidden="true" onClick={onClose} />
    <div
      className="fixed left-4 right-4 bottom-20 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-sm mx-auto"
      role="dialog"
      aria-label={t("messageMenu.title" as Parameters<typeof t>[0])}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-500">{t("messageMenu.title" as Parameters<typeof t>[0])}</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 101.06 1.06L10 11.06l2.72 2.72a.75.75 0 101.06-1.06L11.06 10l2.72-2.72a.75.75 0 00-1.06-1.06L10 8.94 7.28 6.22z" />
          </svg>
        </button>
      </div>
      <ul className="py-1">
        {menuItems.map((item) => {
          const isActive = !!item.onClick;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  isActive
                    ? "text-minbak-black hover:bg-gray-50 active:bg-gray-100"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 shrink-0">
                  {item.icon === "reply" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L5.22 9.47l-2.22-2.22a.75.75 0 001.06 1.06l1.69 1.69 3.31 3.31a.75.75 0 001.06-1.06L8.28 8.28z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.icon === "clock-reply" && (
                    <span className="flex items-center gap-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 -ml-1">
                        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  {item.icon === "photo" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v7.94c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-7.94a.75.75 0 00-.22-.53L11.47 3.72a.75.75 0 00-1.06 0L3.22 10.53a.75.75 0 00-.22.53z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.icon === "pin" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.956 2.274-1.734C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.947 13.947 0 002.273 1.734 10.493 10.493 0 00.758.433c.079.04.176.095.281.14.06.03.119.063.18.098l.018.007.006.003z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.icon === "phone" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 01.43 8.326 13.019 13.019 0 010 5V3.5A1.5 1.5 0 011.5 2H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  {t(item.key as Parameters<typeof t>[0])}
                  {!item.onClick && (
                    <span className="ml-2 text-xs text-gray-400">({t("messageMenu.comingSoon" as Parameters<typeof t>[0])})</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
    </>
  );
}
