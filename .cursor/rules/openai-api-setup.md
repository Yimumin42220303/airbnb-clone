# Cursor + OpenAI API 연동 가이드

이 프로젝트는 **OpenAI API 키**를 Cursor에 연결하여 ChatGPT Pro 계정의 토큰을 사용합니다.

## 1. OpenAI API 키 발급

1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) 접속
2. 로그인 (ChatGPT Pro와 동일한 계정)
3. **Create new secret key** 클릭
4. 키 복사 (한 번만 표시되므로 안전한 곳에 저장)

> ⚠️ **참고**: ChatGPT Pro 구독과 API 사용은 별도 과금입니다.  
> API 사용 시 [platform.openai.com](https://platform.openai.com) → Billing에서 결제 수단을 등록해야 합니다.

## 2. Cursor에 API 키 연결

1. Cursor에서 **Ctrl + ,** (설정 열기)
2. 왼쪽 메뉴에서 **Models** 클릭
3. **OpenAI API Key** 필드에 발급받은 키 붙여넣기
4. **Verify** 클릭하여 연결 확인

## 3. 모델 선택

- **Chat** / **Composer**: Models 설정에서 **OpenAI** 모델 선택 (예: GPT-4o, GPT-4o-mini)
- 이렇게 설정하면 Cursor가 해당 모델 호출 시 **본인 API 키**를 사용하고, 사용량은 OpenAI 계정으로 청구됩니다.

## 4. Codex 관련

OpenAI **Codex**는 2023년 말 서비스가 종료되었습니다.  
현재 코드 개발에는 **GPT-4o**, **GPT-4o-mini** 등이 사용됩니다. Cursor Models에서 이 중 하나를 선택하면 됩니다.
