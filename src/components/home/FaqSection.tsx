"use client";

import { useState } from "react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

/** minbak.tokyo 자주 묻는 질문 (아코디언) - 번역 키로 ko/ja 대응 */
const FAQ_ITEMS: { qKey: HostTranslationKey; aKey: HostTranslationKey }[] = [
  { qKey: "guest.faq1Q", aKey: "guest.faq1A" },
  { qKey: "guest.faq2Q", aKey: "guest.faq2A" },
  { qKey: "guest.faq3Q", aKey: "guest.faq3A" },
  { qKey: "guest.faq4Q", aKey: "guest.faq4A" },
  { qKey: "guest.faq5Q", aKey: "guest.faq5A" },
  { qKey: "guest.faq6Q", aKey: "guest.faq6A" },
  { qKey: "guest.faq7Q", aKey: "guest.faq7A" },
  { qKey: "guest.faq8Q", aKey: "guest.faq8A" },
];

export default function FaqSection() {
  const { t } = useHostTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white border-y border-minbak-light-gray">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <h2 className="text-minbak-h2 font-semibold text-minbak-black mb-6 md:mb-8 text-center">
          {t("guest.faqTitle")}
        </h2>
        <ul className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <li
              key={i}
              className="bg-white border border-minbak-light-gray rounded-minbak overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full min-h-[48px] px-4 sm:px-5 py-4 text-left flex items-center justify-between gap-4 text-minbak-body font-medium text-minbak-black hover:bg-minbak-bg/50 transition-colors"
              >
                {t(item.qKey)}
                <span
                  className={`flex-shrink-0 text-minbak-primary transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 pt-0 text-minbak-body text-minbak-gray border-t border-minbak-light-gray">
                  {t(item.aKey)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
