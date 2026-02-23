# Beds24 API V2 検証結果

ご提供いただいた情報と、公式ドキュメント・当プロジェクトの既存資料を突き合わせて検証しました。

---

## 1. 検証サマリ

| 項目 | ご提供情報 | 公式確認結果 | 一致 |
|------|------------|--------------|------|
| API V1 vs V2 | 新規開発は V2 推奨 | [OTA ガイド](https://wiki.beds24.com/index.php/OTAs:_How_to_connect_to_Beds24_using_API_V2) でも V2 推奨 | ✅ |
| 認証方式 | Invite Code → POST /authentication/setup | **GET** /authentication/setup（HTTP メソッドが異なる） | ⚠️ |
| Swagger UI | api.beds24.com/v2/swagger-ui | beds24.com/api/v2/#/ が有効（api.beds24.com は 401） | ⚠️ |
| レート制限 | クレジット制、キャッシュ推奨 | 「strict usage limits」「リアルタイム大量呼び出し不向き」 | ✅ |
| OTA 向けガイド | 存在 | OTAs: How to connect to Beds24 using API V2 | ✅ |

---

## 2. 認証フロー（公式 OTA ガイド準拠）

### 手順

1. **Invite Code 発行**  
   Beds24 管理画面 → [API page](https://beds24.com/control3.php?pagetype=apiv2) → Generate Invite Code → 必要なスコープを選択

2. **Refresh Token 取得**  
   `GET`（POST ではない）`/authentication/setup` に `code: {inviteCode}` ヘッダを付与してリクエスト

   ```
   GET https://beds24.com/api/v2/authentication/setup
   Headers: accept: application/json, code: abc123
   ```

3. **レスポンス**  
   - `token`: 短期 Access Token  
   - `expiresIn`: 秒単位の有効期限  
   - `refreshToken`: 将来の Access Token 再発行用

4. **API 呼び出し**  
   各リクエストに `token: {accessToken}` ヘッダを付与

5. **トークン更新**  
   `refreshToken` を使って `POST /authentication/token` で新しい Access Token を取得

---

## 3. 主要エンドポイント（OTA 連携用）

| 用途 | エンドポイント | 備考 |
|------|----------------|------|
| 認証 | GET /authentication/setup | Invite Code → token + refreshToken |
| トークン更新 | POST /authentication/token | Refresh Token → Access Token |
| プロパティ取得 | GET /properties | 初回のみ・マッピング用。`?includeAllRooms=true` でルーム詳細も取得可 |
| カレンダー（一括） | GET /inventory/rooms/calendar | 最大 1 年分。**6時間ごと**のキャッシュ更新を推奨 |
| 空室確認 | GET /inventory/rooms/availability | 検索・予約直前の空室チェック用 |
| オファー取得 | GET /inventory/rooms/offers | チェックイン/アウト・人数指定で価格・空室確認 |
| 予約送信 | POST /bookings | 当 OTA で確定した予約を Beds24 へ送信（他 OTA の空室をブロック） |

ベース URL: `https://beds24.com/api/v2/`

---

## 4. API Key / Prop Key について（日本向けサポート）

[株式会社コントリビューション（co-reception.com）](https://co-reception.com/beds24-for-apikeyandpropkey/) の説明では:

- **API Key**: アカウント > アカウントアクセス > APIキー 1 で確認
- **Prop Key**: 設定 > プロパティ > アクセス > Propキー で確認
- 空欄の場合は任意の文字列を入力して保存

これらは **API V1（レガシー）** の認証方式と考えられます。  
**API V2** では **Invite Code → Refresh Token → Access Token** が推奨されます。

API V2 を使う場合は、管理画面の「API page」から **Invite Code** を発行する流れになります。

---

## 5. レート制限と設計指針

公式 OTA ガイドより:

- Beds24 API には **厳しい利用制限** があり、設計時に考慮が必要
- **リアルタイムの大量呼び出しは想定されていない**
- 公開ページ用のリアルタイムデータは **当 OTA 側でキャッシュ** すべき
- **カレンダー取得は 6 時間に 1 回程度** で十分とされている
- 必要に応じてのみ API を呼び出し、キャッシュを活用する構成が望ましい

---

## 6. Swagger / ドキュメント URL

| リソース | URL |
|----------|-----|
| OTA 接続ガイド | https://wiki.beds24.com/index.php/OTAs:_How_to_connect_to_Beds24_using_API_V2 |
| API V2 カテゴリ | https://wiki.beds24.com/index.php/Category:API_V2 |
| Swagger UI（インタラクティブ） | https://beds24.com/api/v2/#/ |
| API 管理画面（Invite Code 発行） | https://beds24.com/control3.php?pagetype=apiv2 |
| 日本国内サポート（API Key / Prop Key） | https://co-reception.com/beds24-for-apikeyandpropkey/ |

※ `https://api.beds24.com/v2/swagger-ui/index.html` は 401 で、認証が必要な可能性があります。`beds24.com/api/v2/#/` がメインの Swagger として利用可能です。

---

## 7. 当プロジェクトとの対応

| 項目 | 既存資料（Beds24-連携企画.md） | 検証結果 |
|------|-------------------------------|----------|
| Phase 0（iCal） | 実装済み・連携可能 | 変更なし |
| Phase 1（API V2） | 将来検討 | 上記エンドポイント・認証フローで設計可能 |
| 認証 | Invite Code → Refresh Token | メソッドは **GET** /authentication/setup |
| ベース URL | beds24.com/api/v2/ | 一致 |
| カレンダー取得 | 6 時間キャッシュ推奨 | 公式と同じ |

---

## 8. 次のステップ（API V2 連携を進める場合）

1. Beds24 アカウントでテスト用プロパティを作成
2. [API page](https://beds24.com/control3.php?pagetype=apiv2) で Invite Code を発行し、スコープを選択
3. Swagger（https://beds24.com/api/v2/#/）で `GET /authentication/setup` を実行し、Refresh Token 取得を確認
4. `GET /properties` でプロパティ一覧を取得
5. `GET /inventory/rooms/calendar` で空室・価格データの取得とキャッシュ設計
6. `POST /bookings` による予約送信フローの実装
