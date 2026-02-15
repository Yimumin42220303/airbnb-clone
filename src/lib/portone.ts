/**
 * Portone Server-side API utilities
 *
 * @see https://developers.portone.io/api/rest-v2
 */

const PORTONE_API_BASE = "https://api.portone.io";

function getApiSecret(): string {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    throw new Error("PORTONE_API_SECRET is not set");
  }
  return secret;
}

export interface PortonePayment {
  id: string;
  transactionId?: string;
  status: string;
  totalAmount: number;
  currency: string;
  method?: {
    type: string;
    provider?: string;
  };
  orderName?: string;
  requestedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  failedAt?: string;
  cancellations?: Array<{
    id: string;
    totalAmount: number;
    reason: string;
    cancelledAt: string;
  }>;
  pgTxId?: string;
  channel?: {
    pgProvider: string;
  };
}

export async function getPayment(paymentId: string): Promise<PortonePayment> {
  const secret = getApiSecret();
  const url = PORTONE_API_BASE + "/payments/" + encodeURIComponent(paymentId);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "PortOne " + secret,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error("Portone payment lookup failed (" + res.status + "): " + errorBody);
  }

  return res.json();
}

/**
 * 빌링키로 결제 실행 (카드 등록 후 자동 결제 시 사용)
 * @see https://developers.portone.io/api/rest-v2/billingKey.pay
 */
export async function payWithBillingKey(params: {
  billingKey: string;
  paymentId: string;
  amount: number;
  orderName: string;
  currency?: string;
}): Promise<PortonePayment> {
  const secret = getApiSecret();
  const url =
    PORTONE_API_BASE +
    "/billing-keys/" +
    encodeURIComponent(params.billingKey) +
    "/payments";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "PortOne " + secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment: {
        id: params.paymentId,
        orderName: params.orderName,
        amount: {
          total: params.amount,
        },
        currency: params.currency || "KRW",
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      "Portone billing key payment failed (" + res.status + "): " + errorBody
    );
  }

  return res.json();
}

/**
 * 빌링키 삭제 (미결제 상태 취소 시 사용)
 * @see https://developers.portone.io/api/rest-v2/billingKey.delete
 */
export async function deleteBillingKey(billingKey: string): Promise<void> {
  const secret = getApiSecret();
  const url =
    PORTONE_API_BASE +
    "/billing-keys/" +
    encodeURIComponent(billingKey);
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: "PortOne " + secret,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      "Portone billing key delete failed (" + res.status + "): " + errorBody
    );
  }
}

export async function cancelPayment(
  paymentId: string,
  reason: string,
  amount?: number
): Promise<{ cancellation: { id: string; totalAmount: number } }> {
  const secret = getApiSecret();
  const body: Record<string, unknown> = { reason };
  if (amount !== undefined) {
    body.amount = amount;
  }

  const url =
    PORTONE_API_BASE +
    "/payments/" +
    encodeURIComponent(paymentId) +
    "/cancel";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "PortOne " + secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error("Portone payment cancel failed (" + res.status + "): " + errorBody);
  }

  return res.json();
}