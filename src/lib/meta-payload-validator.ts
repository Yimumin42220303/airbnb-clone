import { createHash } from "crypto";

export type MetaValidationIssue = {
  field: string;
  message: string;
};

export type MetaValidationResult = {
  valid: boolean;
  eventName: string;
  issues: MetaValidationIssue[];
};

/** ISO 4217 (3자 대문자) */
const ISO4217 = /^[A-Z]{3}$/;

/** Meta CAPI user_data 해시: 소문자 hex SHA-256 (64자) */
const SHA256_HEX = /^[a-f0-9]{64}$/;

/** Unix epoch seconds (Meta CAPI event_time) */
export function isValidUnixEventTime(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0 &&
    value < 4_102_444_800 // ~2100년
  );
}

export function isValidIso4217Currency(value: unknown): value is string {
  return typeof value === "string" && ISO4217.test(value);
}

export function isValidSha256Hex(value: unknown): value is string {
  return typeof value === "string" && SHA256_HEX.test(value);
}

/** Meta CAPI user_data 해싱 규격 (trim + lowercase + SHA-256) */
export function hashMetaUserData(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function isCorrectlyHashedMetaEmail(
  plainEmail: string,
  hashedValue: unknown
): boolean {
  if (Array.isArray(hashedValue)) {
    return hashedValue.length > 0 && hashedValue.every((h) => h === hashMetaUserData(plainEmail));
  }
  return hashedValue === hashMetaUserData(plainEmail);
}

function issue(field: string, message: string): MetaValidationIssue {
  return { field, message };
}

function result(eventName: string, issues: MetaValidationIssue[]): MetaValidationResult {
  return { valid: issues.length === 0, eventName, issues };
}

/** 브라우저 Pixel ViewContent 파라미터 (fbq 2번째 인자) */
export function validateViewContentPixelPayload(params: {
  content_ids?: unknown;
  content_name?: unknown;
  content_category?: unknown;
  content_type?: unknown;
  value?: unknown;
  currency?: unknown;
}): MetaValidationResult {
  const issues: MetaValidationIssue[] = [];

  if (!Array.isArray(params.content_ids) || params.content_ids.length === 0) {
    issues.push(issue("content_ids", "비어 있지 않은 문자열 배열이어야 합니다."));
  } else if (!params.content_ids.every((id) => typeof id === "string" && id.length > 0)) {
    issues.push(issue("content_ids", "모든 항목은 비어 있지 않은 문자열이어야 합니다."));
  }

  if (typeof params.content_name !== "string" || !params.content_name.trim()) {
    issues.push(issue("content_name", "비어 있지 않은 문자열이어야 합니다."));
  }

  if (typeof params.content_category !== "string" || !params.content_category.trim()) {
    issues.push(issue("content_category", "비어 있지 않은 문자열(지역 등)이어야 합니다."));
  }

  if (typeof params.value !== "number" || !Number.isFinite(params.value) || params.value < 0) {
    issues.push(issue("value", "0 이상의 유한 숫자여야 합니다."));
  }

  const currency = params.currency ?? "JPY";
  if (!isValidIso4217Currency(currency)) {
    issues.push(issue("currency", `ISO 4217 3자 코드여야 합니다. (현재: ${String(currency)})`));
  }

  return result("ViewContent", issues);
}

/** Schedule / InitiateCheckout / Purchase 공통 픽셀 파라미터 */
export function validateFunnelPixelPayload(
  eventName: string,
  params: {
    content_ids?: unknown;
    value?: unknown;
    currency?: unknown;
    content_type?: unknown;
  }
): MetaValidationResult {
  const issues: MetaValidationIssue[] = [];

  if (!Array.isArray(params.content_ids) || params.content_ids.length === 0) {
    issues.push(issue("content_ids", "비어 있지 않은 문자열 배열이어야 합니다."));
  } else if (!params.content_ids.every((id) => typeof id === "string" && id.length > 0)) {
    issues.push(issue("content_ids", "모든 항목은 비어 있지 않은 문자열이어야 합니다."));
  }

  if (typeof params.value !== "number" || !Number.isFinite(params.value) || params.value < 0) {
    issues.push(issue("value", "0 이상의 유한 숫자여야 합니다."));
  }

  const currency = params.currency ?? "JPY";
  if (!isValidIso4217Currency(currency)) {
    issues.push(issue("currency", `ISO 4217 3자 코드여야 합니다. (현재: ${String(currency)})`));
  }

  return result(eventName, issues);
}

/** 브라우저 Pixel Purchase 파라미터 */
export function validatePurchasePixelPayload(
  params: {
    value?: unknown;
    currency?: unknown;
    content_ids?: unknown;
    content_type?: unknown;
  },
  options?: { eventID?: unknown }
): MetaValidationResult {
  const base = validateFunnelPixelPayload("Purchase", params);
  const issues = [...base.issues];

  if (typeof options?.eventID !== "string" || !options.eventID.trim()) {
    issues.push(issue("eventID", "중복 제거용 비어 있지 않은 eventID가 필요합니다."));
  }

  return result("Purchase", issues);
}

/** CAPI 단일 이벤트 객체 */
export function validateCapiPurchaseEvent(event: Record<string, unknown>): MetaValidationResult {
  const issues: MetaValidationIssue[] = [];

  if (event.event_name !== "Purchase") {
    issues.push(issue("event_name", `'Purchase'여야 합니다. (현재: ${String(event.event_name)})`));
  }

  if (!isValidUnixEventTime(event.event_time)) {
    issues.push(
      issue("event_time", `Unix 초 단위 정수 타임스탬프여야 합니다. (현재: ${String(event.event_time)})`)
    );
  }

  if (typeof event.event_id !== "string" || !event.event_id.trim()) {
    issues.push(issue("event_id", "비어 있지 않은 event_id가 필요합니다."));
  }

  if (event.action_source !== "website") {
    issues.push(issue("action_source", `'website'여야 합니다. (현재: ${String(event.action_source)})`));
  }

  const custom = event.custom_data;
  if (!custom || typeof custom !== "object" || Array.isArray(custom)) {
    issues.push(issue("custom_data", "객체여야 합니다."));
  } else {
    const cd = custom as Record<string, unknown>;
    if (typeof cd.value !== "number" || !Number.isFinite(cd.value) || cd.value < 0) {
      issues.push(issue("custom_data.value", "0 이상의 유한 숫자여야 합니다."));
    }
    if (!isValidIso4217Currency(cd.currency)) {
      issues.push(
        issue("custom_data.currency", `ISO 4217 3자 코드여야 합니다. (현재: ${String(cd.currency)})`)
      );
    }
  }

  const userData = event.user_data;
  if (userData && typeof userData === "object" && !Array.isArray(userData)) {
    const ud = userData as Record<string, unknown>;
    for (const [key, val] of Object.entries(ud)) {
      if (key === "em" || key === "ph") {
        const hashes = Array.isArray(val) ? val : [val];
        for (const h of hashes) {
          if (!isValidSha256Hex(h)) {
            issues.push(
              issue(`user_data.${key}`, "SHA-256 소문자 hex(64자) 해시여야 하며 평문을 보내면 안 됩니다.")
            );
          }
        }
      }
    }
  }

  return result("Purchase", issues);
}

export type MetaCapiResponseLog = {
  ok: boolean;
  httpStatus: number;
  eventId?: string;
  eventsReceived?: number;
  fbtraceId?: string;
  errorMessage?: string;
  errorType?: string;
  errorCode?: number;
  errorSubcode?: number;
  rawBody?: string;
};

/** Meta Graph API CAPI 응답 파싱 및 개발자 로그용 요약 */
export function parseMetaCapiResponse(
  httpStatus: number,
  rawBody: string,
  eventId?: string
): MetaCapiResponseLog {
  const log: MetaCapiResponseLog = {
    ok: httpStatus >= 200 && httpStatus < 300,
    httpStatus,
    eventId,
    rawBody: rawBody.slice(0, 500),
  };

  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    log.errorMessage = "JSON 파싱 실패";
    return log;
  }

  if (json.events_received != null) {
    log.eventsReceived = Number(json.events_received);
  }
  if (typeof json.fbtrace_id === "string") {
    log.fbtraceId = json.fbtrace_id;
  }

  const err = json.error as Record<string, unknown> | undefined;
  if (err) {
    log.ok = false;
    log.errorMessage = typeof err.message === "string" ? err.message : "Unknown Meta API error";
    log.errorType = typeof err.type === "string" ? err.type : undefined;
    log.errorCode = typeof err.code === "number" ? err.code : undefined;
    log.errorSubcode = typeof err.error_subcode === "number" ? err.error_subcode : undefined;
  }

  return log;
}

export function logMetaCapiResponse(log: MetaCapiResponseLog): void {
  if (log.ok) {
    console.log("[meta-capi] ✅ Purchase 전송 성공", {
      eventId: log.eventId,
      httpStatus: log.httpStatus,
      eventsReceived: log.eventsReceived,
      fbtraceId: log.fbtraceId,
    });
    return;
  }

  const hint = metaCapiErrorHint(log.errorCode, log.errorMessage);
  console.error("[meta-capi] ❌ Purchase 전송 실패", {
    eventId: log.eventId,
    httpStatus: log.httpStatus,
    errorType: log.errorType,
    errorCode: log.errorCode,
    errorSubcode: log.errorSubcode,
    message: log.errorMessage,
    hint,
    fbtraceId: log.fbtraceId,
    rawBody: log.rawBody,
  });
}

function metaCapiErrorHint(code?: number, message?: string): string {
  if (code === 190) return "액세스 토큰이 만료되었거나 유효하지 않습니다. META_CAPI_ACCESS_TOKEN을 확인하세요.";
  if (code === 100) return "요청 파라미터가 잘못되었거나 필수 필드가 누락되었습니다.";
  if (message?.toLowerCase().includes("invalid pixel")) return "픽셀 ID가 올바르지 않습니다.";
  return "Meta Events Manager → Test Events 또는 Graph API Explorer에서 상세 원인을 확인하세요.";
}

export function assertValidOrThrow(result: MetaValidationResult, context: string): void {
  if (result.valid) return;
  const detail = result.issues.map((i) => `${i.field}: ${i.message}`).join("; ");
  throw new Error(`[meta-payload] ${context} ${result.eventName} 페이로드 규격 오류 — ${detail}`);
}
