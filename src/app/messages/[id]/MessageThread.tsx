"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  isFromMe: boolean;
  senderName: string;
};

type Props = {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
};

export default function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
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
        alert(data.error || "전송에 실패했습니다.");
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
      alert("네트워크 오류가 발생했습니다.");
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="min-h-[320px] max-h-[60vh] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-airbnb-caption text-airbnb-gray text-center py-8">
            대화를 시작해 보세요.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.isFromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-airbnb px-3 py-2 ${
                  m.isFromMe
                    ? "bg-airbnb-red text-white"
                    : "bg-airbnb-bg text-airbnb-black"
                }`}
              >
                {!m.isFromMe && (
                  <p className="text-airbnb-caption opacity-80 mb-0.5">
                    {m.senderName}
                  </p>
                )}
                <p className="text-airbnb-body whitespace-pre-wrap break-words">
                  {m.body}
                </p>
                <p
                  className={`text-airbnb-caption mt-0.5 ${
                    m.isFromMe ? "text-white/80" : "text-airbnb-gray"
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
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-airbnb-light-gray flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          maxLength={2000}
          className="flex-1 px-4 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body placeholder:text-airbnb-gray focus:outline-none focus:ring-2 focus:ring-airbnb-black/20"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-airbnb-red text-white text-airbnb-body font-medium rounded-airbnb hover:bg-airbnb-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "전송 중..." : "전송"}
        </button>
      </form>
    </>
  );
}
