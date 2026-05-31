"use client";

import { useState } from "react";
import {
  BLOG_SHORTCODE_EXAMPLES,
  getListingCardInsertOptions,
  hasBlogListingEmbed,
} from "@/lib/blog-body-shortcodes";

type Props = {
  slug: string;
  onInsert: (text: string) => void;
};

export default function BlogBodyShortcodePanel({ slug, onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const cardOptions = getListingCardInsertOptions(slug);
  const hasEmbed = hasBlogListingEmbed(slug);

  return (
    <div className="mb-3 rounded-minbak border border-minbak-primary/20 bg-minbak-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-minbak-body font-medium text-minbak-black hover:bg-minbak-primary/10 transition-colors"
      >
        <span>본문 shortcode · 내부 링크 가이드</span>
        <span className="text-minbak-caption text-minbak-gray">{open ? "접기" : "펼치기"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 text-minbak-caption text-minbak-gray border-t border-minbak-primary/15">
          <p className="pt-3 leading-relaxed">
            모든 링크는 <strong className="text-minbak-black">[텍스트](URL)</strong> 형식으로 넣으면
            사이트에서 <code className="text-minbak-black">&lt;a href&gt;</code>로 렌더됩니다. HTML·
            onclick은 사용하지 마세요.
          </p>

          <div className="flex flex-wrap gap-2">
            <InsertBtn
              label="내부 링크 템플릿"
              onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.internalLink)}
            />
            <InsertBtn
              label="비교표"
              onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.compareTable)}
            />
            <InsertBtn
              label="일반 이미지"
              onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.imagePlain)}
            />
            <InsertBtn
              label="숙소 연결 이미지"
              onClick={() => onInsert(BLOG_SHORTCODE_EXAMPLES.imageListing)}
            />
          </div>

          {hasEmbed ? (
            <div>
              <p className="font-medium text-minbak-black mb-2">
                이 글 slug에 등록된 숙소 카드 ({slug})
              </p>
              <div className="flex flex-wrap gap-2">
                {cardOptions.map((opt) => (
                  <InsertBtn
                    key={opt.key}
                    label={`카드: ${opt.label}`}
                    onClick={() => onInsert(`[LISTING_CARD:${opt.key}]`)}
                  />
                ))}
              </div>
              <p className="mt-2">
                카드·비교표는 공개 페이지에서 DB 숙소 정보와 함께 표시됩니다. 미리보기에서는 shortcode
                위치만 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <p>
              숙소 카드·비교표 shortcode는 <code>blog-listing-embeds.ts</code>에 slug를 등록한 글만
              사용할 수 있습니다. 카드 키 예: <code>[LISTING_CARD:classic]</code>
            </p>
          )}

          <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-minbak-black">숙소 이미지</strong>: 클릭 시 상세페이지로 이동 —
              <code>|listing:숙소ID|alt</code> 추가. 일반 설명 사진은 <code>[IMG:url]</code>만 사용.
            </li>
            <li>
              <strong className="text-minbak-black">raw URL</strong> 본문에 붙이지 마세요. 추천 CTA는
              사이트가 글 하단에 자동 노출합니다.
            </li>
            <li>
              <strong className="text-minbak-black">앵커 예시</strong>: 「○○ 자세히 보기」+{" "}
              <code>/listing/...</code>
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
