# お名前.com (onamae.com) 도메인 설정 - tokyominbak.net

Vercel에 도메인을 추가했습니다. **お名前.com**에서 아래 DNS 레코드를 설정하세요.

---

## 1. お名前.com 로그인

1. https://www.onamae.com 접속
2. **お名前.com Navi** 로그인
3. **ドメイン** → **DNSレコード設定** (DNS 레코드 설정)

---

## 2. 추가할 DNS 레코드

### A 레코드 (apex 도메인: tokyominbak.net)

| 호스트 | タイプ | 内容 (값) |
|--------|--------|-----------|
| @ | A | 76.76.21.21 |

### TXT 레코드 (Vercel 인증용 - 다른 계정에서 이전 시 필수)

| ホスト | タイプ | 内容 (値) |
|--------|--------|-----------|
| _vercel | TXT | vc-domain-verify=tokyominbak.net,746b0813e3469436878e |
| _vercel | TXT | vc-domain-verify=www.tokyominbak.net,42373e3288b309267cbf |

※ "다른 Vercel 계정에 연결됨" 오류 시 위 TXT 레코드 추가 후 인증됩니다.

### CNAME 레코드 (www 서브도메인)

| ホスト | タイプ | 内容 (値) |
|--------|--------|-----------|
| www | CNAME | d95426e8b6bfa426.vercel-dns-017.com |

---

## 3. お名前.com 설정 절차

1. **ドメイン一覧**에서 `tokyominbak.net` 선택
2. **DNSレコード設定を利用する** 클릭
3. **レコードを追加** 클릭
4. 위 표대로 각 레코드 추가:
   - **A**: ホスト=@, タイプ=A, 内容=76.76.21.21
   - **TXT**: ホスト=_vercel, タイプ=TXT, 内容=vc-domain-verify=tokyominbak.net,746b0813e3469436878e
   - **TXT**: ホスト=_vercel, タイプ=TXT, 内容=vc-domain-verify=www.tokyominbak.net,42373e3288b309267cbf
   - **CNAME**: ホスト=www, タイプ=CNAME, 内容=d95426e8b6bfa426.vercel-dns-017.com
5. **設定する** 저장

---

## 4. 반영 시간

DNS 변경은 **수 분 ~ 48시간** 걸릴 수 있습니다.  
Vercel 대시보드 → **Settings** → **Domains**에서 인증 상태를 확인하세요.

---

## 5. 이전 계정에서 도메인 제거

minbaktokyo 계정에 tokyominbak.net이 연결되어 있다면:

1. minbaktokyo Vercel 로그인
2. 해당 프로젝트 → **Settings** → **Domains**
3. tokyominbak.net **Remove** (충돌 방지)
