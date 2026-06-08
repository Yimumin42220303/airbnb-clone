"use client";

import { linkifyMessageBody } from "@/lib/linkify-message-body";

type Props = {
  text: string;
  /** 내가 보낸 메시지(빨간 말풍선) vs 상대 */
  isFromMe?: boolean;
  className?: string;
};

export default function MessageBodyWithLinks({
  text,
  isFromMe = false,
  className = "",
}: Props) {
  const segments = linkifyMessageBody(text);

  const linkClass = isFromMe
    ? "underline break-all text-white hover:text-white/90"
    : "underline break-all text-minbak-primary hover:text-[#c91820]";

  return (
    <p className={className}>
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <a
            key={`${i}-${seg.href}`}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {seg.value}
          </a>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </p>
  );
}
