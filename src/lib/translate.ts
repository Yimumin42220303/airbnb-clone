/**
 * 메시지 자동 번역 (한↔일)
 * DeepL API 사용, 결과는 TranslationCache에 저장해 재호출 시 비용 절감
 */

import { prisma } from "./prisma";

const DEEPL_API_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_API_PRO = "https://api.deepl.com/v2/translate";

type TargetLang = "ko" | "ja";

function getDeepLTargetLang(lang: TargetLang): string {
  return lang === "ko" ? "KO" : "JA";
}

/**
 * 캐시 조회 → 없으면 DeepL 호출 → 캐시 저장 후 반환
 * messageId가 있으면 DB 캐시 사용, 없으면 API만 호출(캐시 미저장)
 */
export async function translateMessageBody(
  text: string,
  targetLang: TargetLang,
  messageId?: string
): Promise<string> {
  const key = process.env.DEEPL_AUTH_KEY?.trim();
  if (!key || !text.trim()) return text;

  if (messageId) {
    const cached = await prisma.translationCache.findUnique({
      where: {
        messageId_targetLang: { messageId, targetLang },
      },
      select: { translatedText: true },
    });
    if (cached) return cached.translatedText;
  }

  try {
    const baseUrl = key.endsWith(":fx") ? DEEPL_API_FREE : DEEPL_API_PRO;
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `DeepL-Auth-Key ${key}`,
      },
      body: JSON.stringify({
        text: [text.trim().slice(0, 5000)], // DeepL 제한
        target_lang: getDeepLTargetLang(targetLang),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[translate] DeepL error:", res.status, errText);
      return text;
    }

    const data = (await res.json()) as {
      translations?: { text?: string }[];
    };
    const translated =
      data.translations?.[0]?.text?.trim() ?? text;

    if (messageId && translated !== text) {
      await prisma.translationCache.upsert({
        where: {
          messageId_targetLang: { messageId, targetLang },
        },
        create: {
          messageId,
          targetLang,
          translatedText: translated,
        },
        update: { translatedText: translated },
      });
    }

    return translated;
  } catch (err) {
    console.error("[translate]", err);
    return text;
  }
}
