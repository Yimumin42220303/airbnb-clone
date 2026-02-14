# 구글 로그인 redirect_uri_mismatch 해결

## 추가할 URI (복사해서 붙여넣기)

Google Cloud Console → 사용자 인증 정보 → OAuth 클라이언트 ID → **승인된 리디렉션 URI**에 아래를 **추가**:

```
https://tokyominbak.net/api/auth/callback/google
```

www 사용 시:
```
https://www.tokyominbak.net/api/auth/callback/google
```

## 빠른 링크

- [Google Cloud Console - 사용자 인증 정보](https://console.cloud.google.com/apis/credentials)
