<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# e-book-artisan

전자책 편집 도구 with Google Sheets 클라우드 저장소

## 🚀 빠른 시작

### 📋 사전 요구사항

- Node.js 18+
- Google 계정

### 🎯 설정 및 실행

**전체 설정 과정은 [GAS_INSTRUCTIONS.md](GAS_INSTRUCTIONS.md) 에서 확인하세요.**

간단히 말하면:

1. Google Apps Script에서 `GAS_AUTO_SETUP.gs` 복사 후 `autoSetupEbookSheets()` 실행 → 시트 자동 생성
2. Google Sheet에 `GAS_SCRIPT.gs` 코드 배포
3. `.env.local` 파일 생성 후 GAS 웹 앱 URL 입력
4. `npm install && npm run dev`

---

## 🎯 주요 기능

- ✅ **8가지 페이지 타입**: Cover, TOC, Chapter, Sequence, Body, Header-Body, Quote
- ✅ **클라우드 저장**: Google Sheets을 데이터베이스로 사용
- ✅ **실시간 로드/저장**: "Save to Sheets", "Load from Sheets" 버튼
- ✅ **WYSIWYG 에디터**: 실시간 미리보기
- ✅ **다중 테마**: Classic, Modern, Academic, Zen

---

## 📁 프로젝트 구조

```
e-book-artisan/
├── src/
│   ├── App.tsx           # 메인 앱 (Google Sheets 연동)
│   ├── hooks/
│   │   └── useEbookSheet.ts   # Google Sheets 동기화 훅
│   ├── types.ts          # TypeScript 타입 정의
│   └── main.tsx
├── GAS_AUTO_SETUP.gs      # 자동 설정 스크립트 (STEP 1)
├── GAS_SCRIPT.gs         # API 백엔드 (STEP 2)
├── .env.local            # 로컬 설정 (VITE_GAS_WEB_APP_URL)
└── README.md
```

---

## 📚 기술 스택

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets
- **UI**: Lucide React, Motion/Framer Motion

---

## 🧪 테스트

앱을 실행한 후:

1. **Save to Sheets**: 좌측에서 페이지를 작성한 후 하단의 "Save to Sheets" 버튼 클릭
2. **Load from Sheets**: 하단의 "Load from Sheets" 버튼으로 저장된 데이터 불러오기
3. Google Sheets를 열어서 데이터가 정상적으로 저장/로드되는지 확인

---

## 🆘 문제 해결

자세한 트러블슈팅 가이드는 [GAS_INSTRUCTIONS.md - 문제 해결](GAS_INSTRUCTIONS.md#-문제-해결) 참고하세요.

---

## 📖 자세한 가이드

- **Google Sheets 연동 설정**: [GAS_INSTRUCTIONS.md](GAS_INSTRUCTIONS.md)
- **데이터 구조**: [GAS_INSTRUCTIONS.md - 데이터 구조](GAS_INSTRUCTIONS.md#-google-sheets-데이터-구조-최종-확인)
# e-book-artisan
