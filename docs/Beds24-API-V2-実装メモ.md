# Beds24 API V2 実装メモ

## 実装済み内容

### 1. DB スキーマ (prisma/schema.prisma)

- **Listing** に追加:
  - `beds24Enabled` (Boolean, default: false)
  - `beds24PropId` (String?)
  - `beds24RoomId` (String?)

### 2. マイグレーション

- `prisma/migrations/20260218000000_add_beds24_fields/migration.sql`
- `npm run db:migrate` がプロジェクトのマイグレーション履歴の都合で失敗する場合、手動で SQL を実行してください:

```sql
ALTER TABLE "Listing" ADD COLUMN "beds24Enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "beds24PropId" TEXT;
ALTER TABLE "Listing" ADD COLUMN "beds24RoomId" TEXT;
```

### 3. 新規ファイル

- **src/lib/beds24.ts**
  - `getAccessToken()`: BEDS24_REFRESH_TOKEN で Access Token 取得
  - `getBeds24BlockedDateKeys()`: GET /inventory/rooms/availability でブロック日取得
  - `getBeds24BlockedDateKeysCached()`: 6h キャッシュ付き
  - `postBeds24Booking()`: POST /bookings で予約送信

### 4. 既存ファイルの修正

| ファイル | 変更 |
|----------|------|
| `lib/ical.ts` | `getExternalBlockedDateKeys` に Beds24 API ソースをマージ |
| `lib/bookings.ts` | `createBooking` 後に Beds24 へ POST /bookings 呼び出し |
| `lib/listings.ts` | `updateListing`, `getListingByIdForEdit` に beds24 フィールド追加 |
| `api/listings/[id]/route.ts` | PATCH で beds24 フィールド受け取り |
| `host/listings/[id]/edit/` | Beds24 API 連携セクション追加（チェックボックス、Prop ID、Room ID） |

### 5. 環境変数

- **BEDS24_REFRESH_TOKEN** (必須): Beds24 API ページで Invite Code を発行し、GET /authentication/setup で取得した Refresh Token

### 6. 使用方法

1. `.env` に `BEDS24_REFRESH_TOKEN=...` を設定
2. マイグレーションを適用
3. ホストが 숙소 수정 페이지で「Beds24 API 연동 사용」を ON にし、Prop ID・Room ID を入力
4. 検索・予約フローでは Beds24 のブロック日が自動で反映
5. 予約確定時に Beds24 へ自動送信

### 7. 補足

- トークン更新: GET /authentication/token に refreshToken ヘッダでリクエスト（Swagger で確認のこと）
- availability API のレスポンス形式は Beds24 の仕様に合わせて調整が必要な場合あり
- POST /bookings のリクエスト body も Beds24 の Swagger スキーマで確認推奨
