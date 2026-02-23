# Beds24 API V2 実装可否チェック

iCal ではなく Beds24 API V2 による当 OTA との連携が **実装可能か** を検証した結果です。

---

## 結論: **実装可能**

既存アーキテクチャが「外部ソースからのブロック日取得」を抽象化しており、Beds24 API を追加ソースとして組み込む設計が可能です。

---

## 1. 現状の OTA フロー

```
[検索・一覧]
  getListings() → 自社 DB の Listing
  getListingBlockedDateKeys() → 自社予約 + ListingAvailability + 外部(iCal)

[空室・料金]
  getNightlyAvailability() → 自社 DB + getExternalBlockedDateKeys(iCal)

[予約作成]
  createBooking()
    ① hasOverlappingBooking() - 自社予約重複チェック
    ② hasExternalBlockedOverlap() - 外部(iCal)ブロック重複チェック
    ③ getNightlyAvailability() - 料金・空室
    ④ prisma.booking.create()
```

**重要**: `lib/ical.ts` の `getExternalBlockedDateKeys()` 内に  
`// 추후: Beds24 등 API 소스에서 blocked dates 조회 후 merged에 add`  
というコメントがあり、API ソース追加を前提とした設計になっています。

---

## 2. Beds24 API V2 連携で必要な要素

| 要素 | Beds24 要求 | 当 OTA 現状 | 対応可否 |
|------|-------------|-------------|----------|
| 認証 | Invite Code → Refresh Token | なし | ✅ 新規実装 |
| プロパティ・ルーム ID | propId, roomId で在庫取得 | なし | ✅ Listing 拡張 |
| ブロック日取得 | GET /inventory/rooms/calendar または availability | getExternalBlockedDateKeys に統合 | ✅ 既存インターフェースに追加 |
| キャッシュ | 6 時間推奨 | iCal は 15 分 | ✅ Beds24 用 6h キャッシュ |
| 予約送信 | POST /bookings | なし | ✅ createBooking 後に追加呼び出し |

---

## 3. 必要な変更・追加

### 3-1. DB スキーマ

| 追加 | 内容 |
|------|------|
| Listing | `beds24PropId`, `beds24RoomId`, `beds24Enabled` (Boolean) |
| Beds24Credential | userId, refreshToken(暗号化), 有効期限 など |

### 3-2. 新規モジュール

| ファイル | 役割 |
|----------|------|
| `lib/beds24.ts` | 認証、Access Token 取得・更新、API 呼び出し |
| `lib/beds24-cache.ts` または beds24.ts 内 | カレンダー/ブロック日の 6h キャッシュ |

### 3-3. 既存の修正

| ファイル | 変更内容 |
|----------|----------|
| `lib/ical.ts` の `getExternalBlockedDateKeys` | Beds24 連携の Listing の場合、API からブロック日取得して `merged` にマージ |
| `lib/bookings.ts` の `createBooking` | Beds24 連携の Listing の場合、予約作成後に `POST /bookings` を Beds24 へ送信 |
| ホスト UI | Beds24 連携 ON/OFF、propId/roomId マッピング、Invite Code 入力 |

---

## 4. データフロー（API 連携時）

### 4-1. ブロック日（空室チェック）

```
getExternalBlockedDateKeys(listingId, checkIn, checkOut)
  ├─ 既存: icalImportUrls から ICS 取得 → パース → merged
  └─ 追加: listing.beds24Enabled なら
            beds24.getBlockedDateKeys(propId, roomId, checkIn, checkOut)
            → キャッシュ参照 or API 呼び出し
            → merged に add
```

### 4-2. 予約作成時

```
createBooking(input)
  … 既存チェック（重複、外部ブロック、空室）…
  booking = prisma.booking.create(...)
  if (listing.beds24Enabled) {
    await beds24.postBooking(propId, roomId, checkIn, checkOut, guests, ...)
  }
  return { ok: true, booking }
```

---

## 5. 注意点・制約

| 項目 | 内容 |
|------|------|
| 料金 | Beds24 の GET /inventory/rooms/offers で料金取得可能。現状は自社 DB の pricePerNight を使用。Beds24 料金を優先する場合は getNightlyAvailability の拡張が必要。 |
| レート制限 | Beds24 API は厳格な制限あり。6h キャッシュ・Cron 定期取得で対応。 |
| トークン管理 | Refresh Token の暗号化保存、Access Token の有効期限チェック・更新が必要。 |
| エラー処理 | POST /bookings 失敗時、当 OTA の予約をロールバックするか、再試行キューに入れるかの設計が必要。 |

---

## 6. 実装順序（推奨）

1. Beds24 テストアカウント取得、Invite Code 発行、Swagger で動作確認
2. `lib/beds24.ts` 実装（認証、GET /inventory/rooms/calendar または availability）
3. DB スキーマ拡張（Listing, Beds24Credential）・マイグレーション
4. `getExternalBlockedDateKeys` に Beds24 ソース追加
5. ホスト UI：Beds24 連携 ON、propId/roomId 設定、Invite Code 入力
6. `createBooking` に POST /bookings 呼び出し追加
7. Cron：トークン更新、必要に応じてカレンダー定期取得

---

## 7. まとめ

- **技術的には実装可能**。既存の `getExternalBlockedDateKeys` と `createBooking` の拡張で対応可能。
- 工数は中〜大（認証・キャッシュ・UI・エラー処理を含めて数週間程度想定）。
- 料金を Beds24 側に完全に委ねる場合は、`getNightlyAvailability` の改修が必要になり、工数が増加する。
