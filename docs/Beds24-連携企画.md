# Beds24（チャネルマネージャー）連携企画

Beds24（日本で利用される vacation rental チャネルマネージャー）との連携を準備するための企画書です。

---

## 1. Beds24 とは

- **概要**: 民泊・宿泊施設向けチャネルマネージャー。Airbnb・Booking.com など複数 OTA の予約・空室・価格を一元管理。
- **日本での利用**: 日本国内の民泊オペレーターに広く利用されている。
- **公式**: https://www.beds24.com/  
- **日本版**: https://www.beds24.com/ (同一プラットフォーム、多言語対応)

---

## 2. 連携方式の選択肢

### 方式A: iCal/ICS 経由（現行 OTA 連携と同等）

| 項目 | 内容 |
|------|------|
| **仕組み** | 当 OTA の **Export ICS URL** を Beds24 に登録。Beds24 の **Export ICS URL** を当 OTA の Import に登録。 |
| **メリット** | 既存 iCal 機能をそのまま活用できる。追加開発がほぼ不要。 |
| **デメリット** | 同期が定期取得ベース（15〜30分キャッシュ）で、即時反映ではない。Beds24 固有の機能（価格連携など）は使えない。 |
| **準備** | ドキュメント整備（Beds24 向け連携手順）、LP/ヘルプに「Beds24 連携」を追記。 |

### 方式B: Beds24 API V2 直接連携

| 項目 | 内容 |
|------|------|
| **仕組み** | Beds24 API でプロパティ・価格・空室を取得し、当 OTA 側で検索・予約フローを構築。予約確定時に Beds24 へ POST /bookings で送信。 |
| **メリット** | リアルタイム性が高い。価格・空室を直接制御可能。Beds24 側の他 OTA 連携と一括で整合が取れる。 |
| **デメリット** | 開発工数が大きい。API 制限（5分あたりの呼び出し数、1リクエストずつ等）への対応が必要。 |
| **準備** | API キー発行フロー、プロパティマッピング、予約同期ロジック、エラーハンドリング、キャッシュ設計。 |

### 推奨: 段階的導入

1. **Phase 0（準備・即時）**: 方式A で Beds24 対応の「準備完了」とする。既存 iCal Export/Import の使い方を Beds24 向けにドキュメント化。
2. **Phase 1（将来）**: 方式B を検討。Beds24 を利用する管理代行会社などからの需要が明確になった時点で API 連携を開発。

---

## 3. Phase 0: iCal 経由での準備（即時実施可能）

### 3-1. 当 OTA 側の既存機能

| 機能 | 状態 | Beds24 連携での利用 |
|------|------|----------------------|
| **Export ICS** | `GET /api/listings/[id]/calendar.ics` | Beds24 の「外部カレンダー取り込み」に URL を登録 |
| **Import ICS** | Listing に `icalImportUrls` を保存 | Beds24 の「Export iCal URL」を 1 つ追加 |
| **外部ブロック日** | `getExternalBlockedDateKeys()` | Import した Beds24 予約をブロック日に反映 |

→ **追加実装なし** で Beds24 連携は可能。

### 3-2. 実施タスク

| タスク | 内容 |
|--------|------|
| T1 | ヘルプ/ドキュメントに「Beds24 連携の手順」を追加（Export URL の取得方法、Beds24 での設定手順） |
| T2 | ホスト向けキャルンダー連携 UI に「Beds24 の場合」の説明文を追記 |
| T3 | `.env.example` などに Beds24 関連の環境変数（将来用）のプレースホルダーをコメントで記載 |

### 3-3. Beds24 側の設定手順（ドキュメント用）

**当 OTA → Beds24（当 OTA の予約を Beds24 に反映）**

1. 当 OTA の「Export iCal URL」を取得（例: `https://tokyominbak.net/api/listings/[listingId]/calendar.ics`）
2. Beds24 管理画面 → プロパティ → カレンダー → カレンダー取り込み（iCal Import）
3. 上記 URL を追加

**Beds24 → 当 OTA（Beds24 側の予約を当 OTA でブロック）**

1. Beds24 管理画面 → プロパティ → カレンダー → カレンダーエクスポート（iCal Export）で URL を取得
2. 当 OTA の「キャルンダー連携」設定 → Import URL 一覧に上記 URL を追加

---

## 4. Phase 1: Beds24 API V2 直接連携（将来フェーズ）

### 4-1. API 概要

- **ベース URL**: `https://beds24.com/api/v2/`
- **認証**: Invite Code → Refresh Token → Access Token（OAuth2 的フロー）
- **Swagger**: https://beds24.com/api/v2/#/
- **制限**: 5分あたりの呼び出し制限、同時 1 リクエスト、複数リクエストは数秒間隔を空ける

### 4-2. 主要エンドポイント

| 用途 | エンドポイント | 用途 |
|------|----------------|------|
| 認証 | GET /authentication/setup | Invite Code → Refresh Token |
| 認証 | POST /authentication/token | Refresh Token → Access Token |
| プロパティ一覧 | GET /properties | Beds24 側プロパティ取得 |
| 空室・価格（一括） | GET /inventory/rooms/calendar | 最大 1 年分を取得しキャッシュ |
| 空室確認 | GET /inventory/rooms/availability | 特定日付の空室確認 |
| オファー | GET /inventory/rooms/offers | チェックイン/アウト・人数で価格・空室確認 |
| 予約送信 | POST /bookings | 当 OTA で確定した予約を Beds24 へ送信 |

### 4-3. 想定フロー

```
[ホスト]
  Beds24 アカウント
    ↓ API Key / Refresh Token 発行
[当 OTA]
  - ホストが Beds24 連携を「有効化」
  - プロパティ ID マッピング（Beds24 propId ↔ Listing.id）
  - 定期的に GET /inventory/rooms/calendar で空室・価格を取得 → キャッシュ（6時間程度）
  - 検索・予約フローではキャッシュを参照
  - 予約確定時に POST /bookings で Beds24 に送信
```

### 4-4. 必要な機能・テーブル（案）

| 項目 | 内容 |
|------|------|
| **Listing 拡張** | `beds24PropId`（Beds24 プロパティ ID）、`beds24RoomId`（ルーム ID）、`beds24Enabled` |
| **認証情報** | `Beds24Credential` テーブル（userId, refreshToken を暗号化保存） |
| **キャッシュ** | Redis または DB で room calendar を 6 時間 TTL でキャッシュ |
| **同期 job** |  cron で calendar 取得、または Webhook 受信（Beds24 が対応している場合） |
| **エラー処理** | レート制限・ネットワークエラー時のリトライ、ホストへの通知 |

### 4-5. 実装順序（Phase 1 着手時）

1. Beds24 アカウント取得、テストプロパティ作成、API キー発行
2. 認証フロー（Invite Code → Refresh Token）の実装
3. GET /properties でプロパティ取得、マッピング UI
4. GET /inventory/rooms/calendar の定期取得とキャッシュ
5. 検索・予約フローへの Beds24 空室・価格の組み込み
6. POST /bookings による予約送信
7. エラーハンドリング・監視

---

## 5. まとめ

| フェーズ | 内容 | 工数目安 |
|----------|------|-----------|
| **Phase 0** | iCal 経由の Beds24 対応（ドキュメント整備・UI 文言追加） | 小 |
| **Phase 1** | Beds24 API V2 直接連携（プロパティ・空室・予約同期） | 大 |

まずは **Phase 0** で「Beds24 と連携できます」という状態を整え、管理代行会社・ホストからの要望や利用実績を踏まえて Phase 1 の着手可否を判断するのが現実的です。

---

## 6. 参考リンク

- [Beds24 API V2 概要](https://www.beds24.com/api/)
- [OTAs: How to connect to Beds24 using API V2](https://wiki.beds24.com/index.php/OTAs:_How_to_connect_to_Beds24_using_API_V2)
- [Beds24 API V2 Swagger](https://beds24.com/api/v2/#/)
- 当プロジェクト: [OTA-중복예약방지-iCal-설계.md](./OTA-중복예약방지-iCal-설계.md)
