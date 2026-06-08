"use client";

import { useState } from "react";
import { BLOG_SHORTCODE_EXAMPLES, BLOG_SHORTCODE_HELP } from "@/lib/blog-body-shortcodes";

type Props = {
  onInsert: (text: string) => void;
};

export default function BlogBodyShortcodePanel({ onInsert }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 rounded-minbak border border-minbak-primary/20 bg-minbak-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-minbak-body font-medium text-minbak-black hover:bg-minbak-primary/10 transition-colors"
      >
        <span>본문 shortcode · 내부 링크 가이드 (숙소 ID)</span>
        <span className="text-minbak-caption text-minbak-gray">{open ? "접기" : "펼치기"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 text-minbak-caption text-minbak-gray border-t border-minbak-primary/15">
          <p className="pt-3 leading-relaxed">
            <strong className="text-minbak-black">코드 배포 없이</strong> 글마다 아래 shortcode만 넣으면
            됩니다. ID는 관리자 숙소 목록 또는 상세 URL에서 확인하세요.
          </p>

          <div className="flex flex-wrap gap-2">
            <InsertBtn label="내부 링크" onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.internalLink)} />
            <InsertBtn
              label="숙소 카드 (최소)"
              onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.listingCardMinimal)}
            />
            <InsertBtn label="숙소 카드 (상세)" onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.listingCard)} />
            <InsertBtn label="비교표 (ID 나열)" onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.compareTable)} />
            <InsertBtn label="비교표 (카드 순)" onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.compareAuto)} />
            <InsertBtn label="일반 이미지" onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.imagePlain)} />
            <InsertBtn
              label="숙소 연결 이미지"
              onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.imageListing)}
            />
            <InsertBtn label="결론 요약 박스" onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.conclusion)} />
          </div>

          <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
            {BLOG_SHORTCODE_HELP.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>
              예전 <code>classic</code> 같은 키도 당분간 동작하지만, 새 글은{" "}
              <strong className="text-minbak-black">LISTING_ID</strong>를 쓰세요.
            </li>
            <li>
              raw URL·중복 추천 CTA 문구는 넣지 마세요. 하단 CTA는 사이트가 자동 노출합니다.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

function InsertBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1.5 text-minbak-caption font-medium border border-minbak-light-gray rounded-minbak bg-white hover:border-minbak-primary/40 hover:text-minbak-primary transition-colors"
    >
      + {label}
    </button>
  );
}
