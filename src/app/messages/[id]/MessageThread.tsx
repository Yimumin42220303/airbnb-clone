"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  isFromMe: boolean;
  senderName: string;
};

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
};

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  bookingIdForPayment,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "전송에 실패했습니다.");
        setInput(text);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          body: data.body,
          createdAt: data.createdAt,
          senderId: data.senderId,
          isFromMe: true,
          senderName: data.senderName,
        },
      ]);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
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
                  <p className="text-minbak-body whitespace-pre-wrap break-words">
                    {m.body}
                  </p>
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
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-minbak-light-gray flex gap-2"
      >
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
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-minbak-primary text-white text-minbak-body font-medium rounded-minbak hover:bg-minbak-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "전송 중..." : "전송"}
        </button>
      </form>
    </>
  );
}
