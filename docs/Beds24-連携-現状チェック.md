# Beds24 連携 — 現状チェック結果

現在のプロダクトが Beds24 と **iCal/ICS 経由で連携できる体制** になっているかを検証した結果です。

---

## 結論: **連携可能**

iCal/ICS 方式（Phase 0）であれば、**追加実装なし** で Beds24 と連携できます。  
以下、各機能の実装状況を記載します。

---

## 1. Export（当 OTA → Beds24）

| 項目 | 状態 | 詳細 |
|------|------|------|
| API エンドポイント | ✅ 実装済 | `GET /api/listings/[id]/calendar.ics` |
| 認証 | なし | リスティング ID さえ分かればアクセス可能（一般的な iCal Export の想定） |
| 出力内容 | 当 OTA の `status: "confirmed"` の予約を VEVENT として出力 |
| Content-Type | `text/calendar` | 標準 iCal 形式 |
| キャッシュ | 5分 | `Cache-Control: private, max-age=300` |

**Beds24 での利用**: Beds24 管理画面 → プロパティ → カレンダー取り込み（iCal Import）に  
`https://tokyominbak.net/api/listings/{listingId}/calendar.ics` を登録すれば、当 OTA の予約が Beds24 側に反映されます。

---

## 2. Import（Beds24 → 当 OTA）

| 項目 | 状態 | 詳細 |
|------|------|------|
| DB フィールド | ✅ あり | `Listing.icalImportUrls` (JSON 配列) |
| UI | ✅ あり | ホストの「 숙소 수정 」→ キャルンダー 연동 섹ション |
| URL 入力 | テキストエリア（1行1URL） | Airbnb の例と Beds24 の Export URL を同様に入力可能 |
| 保存処理 | ✅ 実装済 | PATCH /api/listings/[id] で `icalImportUrls` を配列として保存 |

**Beds24 での利用**: Beds24 管理画面で Export iCal URL を取得し、当 OTA の Import URL 一覧に追加します。

---

## 3. 外部ブロック日の反映

| 項目 | 状態 | 詳細 |
|------|------|------|
| ICS 取得・パース | ✅ 実装済 | `lib/ical.ts` の `fetchIcsBlockedDateKeys` |
| キャッシュ | 15分 TTL | 同一 URL の重複 fetch を抑制 |
| ブロック日取得 | ✅ 実装済 | `getExternalBlockedDateKeys(listingId, checkIn, checkOut)` |

**利用箇所**:
- `lib/bookings.ts` — `createBooking` 前に `hasExternalBlockedOverlap()` で重複チェック
- `lib/availability.ts` — `getNightlyAvailability` で外部ブロック日を `available: false` に反映
- `lib/availability.ts` — `getListingBlockedDateKeys` でカレンダー表示用ブロック日に含める

→ Beds24 の予約を Import すれば、当 OTA ではその期間が自動的に予約不可となります。

---

## 4. Beds24 特有の考慮

| 項目 | 対応 |
|------|------|
| iCal フォーマット | Beds24 は一般的な iCal Export を提供。当 OTA のパーサーは RFC 5545 ベースで共通利用可能 |
| 認証付き URL | Beds24 の Export URL がトークン付きでも、通常はそのまま URL 文字列として登録可能 |
| 複数 URL | `icalImportUrls` は配列のため、Beds24 以外（Airbnb など）と併用可能 |

---

## 5. 確認したファイル一覧

- `src/app/api/listings/[id]/calendar.ics/route.ts` — Export
- `src/lib/ical.ts` — Import（fetch, パース, キャッシュ, `getExternalBlockedDateKeys`）
- `src/lib/bookings.ts` — `hasExternalBlockedOverlap` による予約前チェック
- `src/lib/availability.ts` — `getNightlyAvailability`, `getListingBlockedDateKeys` での外部ブロック反映
- `prisma/schema.prisma` — `Listing.icalImportUrls`
- `src/app/host/listings/[id]/edit/EditListingForm.tsx` — Export URL 表示・Import URL 入力 UI

---

## 6. 現状のギャップ・推奨

| 項目 | 内容 |
|------|------|
| ドキュメント | 現在は Airbnb を例にした説明。「Beds24 連携の手順」をドキュメント・ヘルプに追加すると利用しやすい |
| UI 文言 | プレースホルダーが `https://www.airbnb.com/calendar/ical/...` のみ。Beds24 の例や説明を追記すると分かりやすい |

---

## 7. まとめ

- **iCal/ICS 連携（Phase 0）**: 追加実装なしで Beds24 と連携可能
- **Beds24 API V2 直接連携（Phase 1）**: 別途開発が必要（企画書参照）
