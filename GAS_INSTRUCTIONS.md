# Google Sheets 연동 설정 가이드 (GAS)

## 문서 정보

- [앱스크립트](https://script.google.com/u/0/home/projects/14OwbxGTXvHiPCrjmN4DAPNQvkOYT26eLUghYHaZz80rWyHjjiNFeAbok/edit)
- [구글드라이브](https://docs.google.com/spreadsheets/d/1gwvXdXGV8IEjQ5q82Fo9gEusW8k9ZVXVzQ6R_4iex24)

## 🤔 GAS(Google Apps Script)가 뭐래?

**GAS = 구글에서 제공하는 무료 서버 언어**

- 일반 서버 없이도 웹 API를 만들 수 있음
- Google Sheets 데이터를 읽고/쓰고/삭제할 수 있음
- 앱에서 HTTP 요청 보내면 GAS가 처리해줌
- 비용 걱정 없음! 무료임

```
┌─────────────────┐
│  e-book-artisan │  (React 앱)
│  (로컬에서 실행) │
└────────┬────────┘
         │ HTTP 요청 (Save/Load)
         │
         ▼
┌─────────────────┐
│  Google Apps    │  (웹 서버 역할)
│  Script (GAS)   │  구글 클라우드에서 실행
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Google Sheets   │  (데이터베이스)
│ (8개 시트)      │
└─────────────────┘
```

---

## 📋 전체 설정 흐름

```
🚀 초고속 설정 (원클릭!)
   ↓
[Google Apps Script에서 autoSetupEbookSheets() 실행]
   ↓
1️⃣ Google Sheet 자동 생성
2️⃣ 8개 시트 자동 생성
3️⃣ 헤더 자동 추가
4️⃣ 메인 코드 자동 배포
5️⃣ 웹 앱 URL 자동 생성
   ↓
6️⃣ URL 복사 → .env.local에 붙여넣기
7️⃣ npm run dev
   ↓
✅ 완료!
```

---

## 🎯 **5분 안에 완료하기 (초고속)**

### **1️⃣ Google Apps Script에서 자동 설정**

1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성 (프로젝트명: 아무거나 OK)
3. 프로젝트 루트에서 **`GAS_AUTO_SETUP.gs`** 파일 **전체 복사**
4. Google Apps Script에 **붙여넣기**
5. **▶️ 실행** 클릭
6. 권한 승인 요청 → 계정 선택 → 인증
7. 완료 후 뜨는 팝업에서 정보 확인 ✅

---

### **2️⃣ Google Sheet에서 Apps Script 설정**

1. 생성된 Google Sheet 열기
2. 우상단 **⋮ (더보기)** → **"Apps Script"** 클릭
3. Google Apps Script 에디터 열림
4. 기존 코드 모두 삭제
5. 프로젝트 루트의 **`GAS_SCRIPT.gs`** 파일 **전체 복사**
6. Google Apps Script에 **붙여넣기**
7. **저장** (Ctrl+S)

---

### **3️⃣ 웹 앱 배포**

1. 우측 상단 **`배포`** 버튼 클릭
2. **`새 배포`** 클릭
3. 배포 유형 선택:
   - **유형**: 웹 앱
   - **설명**: `e-book-artisan API`
   - **다음 사용자로 실행**: 본인 계정
   - **액세스할 수 있는 사용자**: **모든 사람 (Anyone)** ⚠️ 필수!
4. **배포** 클릭
5. 승인 → 웹 앱 URL 복사

---

### **4️⃣ .env.local 생성**

프로젝트 루트에 파일 생성:

```bash
# 파일명: .env.local

VITE_GAS_WEB_APP_URL="https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercache_XXXXX/do"
```

**STEP 3에서 복사한 URL 붙여넣기**

---

### **5️⃣ 앱 실행**

```bash
npm run dev
```

브라우저: `http://localhost:3000` 접속 ✅

---

## ✅ 테스트해보기

### **Test 1: Google Sheets에서 로드**

1. Google Sheet을 열어서 `Body` 시트 2행에 테스트 데이터 입력:

   ```
   A2: row-2
   B2: 테스트 페이지
   C2: 로드 테스트 콘텐츠
   ```

2. e-book-artisan 앱 열기

3. 하단 **`Load from Sheets`** 버튼 클릭

4. **성공**: 앱에 새 페이지가 나타남 ✅

### **Test 2: 앱에서 Google Sheets에 저장**

1. 앱에서 새 페이지 추가 (좌측 사이드바 `+` 버튼)

2. 제목/내용 입력

3. 하단 **`Save to Sheets`** 버튼 클릭

4. Google Sheets 열어서 해당 PageType 시트 확인

5. **성공**: 새 행이 추가됨 ✅

### **Test 3: 앱 새로고침 후 데이터 유지**

1. 앱에서 페이지 추가 후 저장
2. 앱 새로고침 (F5)
3. **`Load from Sheets`** 클릭
4. **성공**: 저장했던 페이지가 다시 로드됨 ✅

---

## 🆘 문제 해결

### **"Save to Sheets" 버튼이 비활성화됨**

- ❌ `.env.local` 파일이 없음
- ✅ 해결: `.env.local` 파일 생성 후 `VITE_GAS_WEB_APP_URL` 추가

### **"Unauthorized" 에러**

- ❌ Google Apps Script 배포 시 "액세스할 수 있는 사용자"를 "모든 사람"으로 설정하지 않음
- ✅ 해결:
  1. [Google Apps Script](https://script.google.com)로 이동
  2. 우측 상단 "배포" → "배포 관리"
  3. 배포 클릭 → "권한 변경" → "모든 사람"으로 설정

### **"Sheet not found" 에러**

- ❌ 시트 이름이 정확하지 않음 (대소문자, 띄어쓰기 주의)
- ✅ 시트명:
  - Metadata (대문자 M)
  - Cover (대문자 C)
  - TOC (대문자 TOC)
  - Chapter (대문자 C)
  - Sequence (대문자 S)
  - Body (대문자 B)
  - Header-Body (하이픈 정확히, 대문자 H, B)
  - Quote (대문자 Q)

### **"CORS 오류" 또는 "요청 실패"**

- ❌ 네트워크 연결 문제 또는 GAS URL 잘못됨
- ✅ 확인:
  1. `VITE_GAS_WEB_APP_URL` URL 정확성 재확인
  2. 브라우저 개발자 도구 (F12) → Network 탭에서 요청 확인

### **Google Sheets에 데이터가 저장되지 않음**

- ❌ GAS 권한 부족
- ✅ Google Apps Script 코드가 현재 Sheet에 쓰기 권한이 있는지 확인
  - Sheet 우상단 "공유" → 모두에게 공유로 변경

---

## 📚 Google Sheets 데이터 구조 (최종 확인)

```
Metadata Sheet (1행만 사용)
├─ A2: 빈야사 플로우: 새벽의 요가
├─ B2: classic
├─ C2: A5
└─ D2: 5

Cover Sheet (여러 행 가능)
├─ 행 2: id, 표지 제목, 부제, 저자명
├─ 행 3: id, ...
└─ ...

Body Sheet (여러 행 가능)
├─ 행 2: id, 페이지제목, 본문내용
├─ 행 3: id, ...
└─ ...

[TOC, Chapter, Sequence, Header-Body, Quote도 동일한 패턴]
```

---

## 🎉 완료

이제 App에서:

- ✅ **Save to Sheets**: 페이지 저장
- ✅ **Load from Sheets**: 페이지 로드
- ✅ 구글 시트를 클라우드 데이터베이스처럼 사용

**문제 발생 시 위의 "문제 해결" 섹션을 참고하세요!**
