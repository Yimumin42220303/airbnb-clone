"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import MessagePlusMenu from "@/components/message/MessagePlusMenu";
import ScheduledTimelineModal from "@/components/host/ScheduledTimelineModal";

type Message = {
  id: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  senderId: string;
  isFromMe: boolean;
  senderName: string;
  /** 자동 번역 ON일 때 상대방 메시지 번역문 (없으면 body 사용) */
  bodyDisplay?: string;
};

const POLL_INTERVAL_MS = 6_000;
const TEMP_ID_PREFIX = "temp-";

/** 호스트 승인·미결제 시 이 메시지 본문 아래에 결제 버튼 노출 */
const APPROVAL_MESSAGE_MARKERS = [
  "호스트승인이 완료되었어요. 결제 안내드릴게요.",
  "예약이 승인되었습니다. 아래 버튼에서 결제를 완료해 주세요.",
];

function isApprovalMessage(fromMe: boolean, body: string): boolean {
  if (fromMe) return false;
  return APPROVAL_MESSAGE_MARKERS.some((t) => body.trim() === t);
}

type Props = {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  /** 게스트이고 결제 대기일 때만 전달 → 승인 메시지 아래에 결제하기 버튼 표시 */
  bookingIdForPayment?: string;
  /** 현재 사용자가 이 대화의 호스트인지 */
  isHost?: boolean;
};

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  bookingIdForPayment,
  isHost = false,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 호스트 승인 메시지를 새로 받았을 때 router.refresh() 한 번만 수행 (상단 결제 배너/버튼 갱신) */
  const hasRefreshedForApprovalRef = useRef(false);

  useEffect(() => {
    if (cooldownUntil == null) return;
    const ms = Math.max(0, cooldownUntil - Date.now());
    const t = setTimeout(() => setCooldownUntil(null), ms);
    return () => clearTimeout(t);
  }, [cooldownUntil]);
  const knownIdsRef = useRef<Set<string>>(
    new Set(initialMessages.map((m) => m.id))
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 상대방 메시지 수신: 주기적 폴링
  const fetchNewMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=50&order=desc`
      );
      if (!res.ok) return;
      const data = await res.json();
      const list: Message[] = data.messages ?? [];
      const known = new Set(knownIdsRef.current);
      const newMessages = list.filter((m) => !known.has(m.id));
      const hasNew = newMessages.length > 0;

      // 호스트 승인 메시지를 새로 수신했으면 페이지 데이터 갱신 → 상단 결제 배너/결제하기 버튼 표시
      if (
        hasNew &&
        !hasRefreshedForApprovalRef.current &&
        newMessages.some((m) => isApprovalMessage(m.isFromMe, m.body))
      ) {
        hasRefreshedForApprovalRef.current = true;
        router.refresh();
      }

      setMessages((prev) => {
        if (!hasNew) return prev;
        const prevIds = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const m of list) {
          if (!prevIds.has(m.id)) {
            merged.push(m);
            prevIds.add(m.id);
          }
        }
        merged.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return merged;
      });
      for (const m of list) knownIdsRef.current.add(m.id);
    } catch {
      // 폴링 실패는 무시 (다음 주기에 재시도)
    }
  }, [conversationId, router]);

  useEffect(() => {
    const t = setInterval(fetchNewMessages, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchNewMessages]);

  // 탭 포커스 시 한 번 즉시 갱신
  useEffect(() => {
    const onFocus = () => fetchNewMessages();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchNewMessages]);

  // 미리보기용 object URL 해제
  useEffect(() => {
    return () => {
      if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
    };
  }, [pendingImagePreviewUrl]);

  function clearPendingImage() {
    if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
    setPendingImageFile(null);
    setPendingImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 첨부할 수 있습니다. (JPEG/PNG/WebP/GIF)");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("파일 크기는 4MB 이하여야 합니다.");
      return;
    }
    if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
    setPendingImageFile(file);
    setPendingImagePreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    const fileToUpload = pendingImageFile;
    const hasContent = !!text || !!fileToUpload;
    if (!hasContent || sending) return;
    setSending(true);
    const tempId = `${TEMP_ID_PREFIX}${Date.now()}`;
    const optimisticBody = text || "(사진)";
    const optimistic: Message = {
      id: tempId,
      body: optimisticBody,
      imageUrl: pendingImagePreviewUrl ?? undefined,
      createdAt: new Date().toISOString(),
      senderId: currentUserId,
      isFromMe: true,
      senderName: "나",
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    clearPendingImage();

    try {
      let imageUrl: string | null = null;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await fetch("/api/upload/message", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadData.error || "이미지 업로드에 실패했습니다.");
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setInput(text);
          setSending(false);
          return;
        }
        imageUrl = uploadData.url ?? null;
      }

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "전송에 실패했습니다.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
        setSending(false);
        return;
      }
      if (!data?.id) {
        toast.error("전송에 실패했습니다.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
        setSending(false);
        return;
      }
      knownIdsRef.current.add(data.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: data.id,
                body: data.body,
                imageUrl: data.imageUrl ?? null,
                createdAt: data.createdAt,
                senderId: data.senderId,
                isFromMe: true,
                senderName: data.senderName ?? "나",
              }
            : m
        )
      );
      setCooldownUntil(Date.now() + 1_000);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="min-h-[320px] max-h-[60vh] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-minbak-caption text-minbak-gray text-center py-8">
            대화를 시작해 보세요.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="space-y-1">
              <div
                className={`flex ${m.isFromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-minbak px-3 py-2 ${
                    m.isFromMe
                      ? "bg-minbak-primary text-white"
                      : "bg-minbak-bg text-minbak-black"
                  }`}
                >
                  {!m.isFromMe && (
                    <p className="text-minbak-caption opacity-80 mb-0.5">
                      {m.senderName}
                    </p>
                  )}
                  {m.imageUrl && (
                    <a
                      href={m.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-1 rounded-minbak overflow-hidden max-w-[240px]"
                    >
                      <img
                        src={m.imageUrl}
                        alt="첨부 이미지"
                        className="w-full h-auto max-h-[200px] object-cover"
                      />
                    </a>
                  )}
                  {(m.bodyDisplay ?? m.body) && (
                    <p className="text-minbak-body whitespace-pre-wrap break-words">
                      {m.bodyDisplay ?? m.body}
                    </p>
                  )}
                  <p
                    className={`text-minbak-caption mt-0.5 ${
                      m.isFromMe ? "text-white/80" : "text-minbak-gray"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {bookingIdForPayment &&
                isApprovalMessage(m.isFromMe, m.body) && (
                  <div className="flex justify-start pl-0">
                    <Link
                      href={`/booking/${bookingIdForPayment}/pay`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-[14px] font-semibold text-white bg-minbak-primary hover:bg-[#c91820] transition-colors"
                    >
                      결제하기
                    </Link>
                  </div>
                )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {pendingImagePreviewUrl && (
        <div className="px-4 pt-2 pb-0 border-t border-minbak-light-gray flex items-center gap-2">
          <div className="relative inline-block">
            <img
              src={pendingImagePreviewUrl}
              alt="첨부 미리보기"
              className="w-16 h-16 object-cover rounded-minbak border border-minbak-light-gray"
            />
            <button
              type="button"
              onClick={clearPendingImage}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm hover:bg-gray-700"
              aria-label="첨부 취소"
            >
              ×
            </button>
          </div>
          <span className="text-minbak-caption text-minbak-gray">사진 첨부됨 (캡션 입력 가능)</span>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-minbak-light-gray flex gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => setShowPlusMenu(true)}
          title="메시지 옵션"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-minbak-primary text-white hover:bg-minbak-primary-hover shrink-0 transition-colors"
          aria-label="메시지 옵션"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          maxLength={2000}
          className="flex-1 px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20"
        />
        <button
          type="submit"
          disabled={sending || cooldownUntil != null || (!input.trim() && !pendingImageFile)}
          className="px-4 py-2 bg-minbak-primary text-white text-minbak-body font-medium rounded-minbak hover:bg-minbak-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "전송 중..." : cooldownUntil != null ? "잠시만요" : "전송"}
        </button>
      </form>

      {showPlusMenu && (
        <MessagePlusMenu
          onClose={() => setShowPlusMenu(false)}
          onViewScheduledReplies={
            isHost
              ? () => {
                  setShowPlusMenu(false);
                  setShowTimeline(true);
                }
              : undefined
          }
          onAddPhotoVideo={() => fileInputRef.current?.click()}
        />
      )}
      {showTimeline && (
        <ScheduledTimelineModal
          conversationId={conversationId}
          isHost={isHost}
          onClose={() => setShowTimeline(false)}
        />
      )}
    </>
  );
}
