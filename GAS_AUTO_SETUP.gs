/**
 * 🚀 e-book-artisan 기존 Sheet 설정 (원클릭!)
 * 기존 Google Sheet에 필요한 시트 구조를 자동으로 설정합니다
 */
function autoSetupEbookSheets() {
  Logger.log('🚀 e-book-artisan 기존 Sheet 설정 시작...');
  
  // ===== 1. 기존 Google Sheet ID (수정 필요) =====
  // 아래 Sheet ID를 자신의 Sheet ID로 변경하세요
  const SHEET_ID = '1gwvXdXGV8IEjQ5q82Fo9gEusW8k9ZVXVzQ6R_4iex24';
  
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log('✅ 기존 Sheet 열기: ' + SHEET_ID);
  
  // ===== 2. 시트 설정 =====
  const sheetConfig = {
    'Metadata': ['title', 'theme', 'standard', 'bindingMargin'],
    'Cover': ['id', 'title', 'subtitle', 'author'],
    'TOC': ['id', 'title', 'tocEntries_json'],
    'Chapter': ['id', 'chapterTitle', 'chapterSubtitle', 'content'],
    'Sequence': ['id', 'title', 'content', 'items_json'],
    'Body': ['id', 'title', 'content'],
    'Header-Body': ['id', 'title', 'content'],
    'Quote': ['id', 'title', 'content']
  };
  
  // ===== 3. 각 시트 생성 및 헤더 추가 =====
  Object.entries(sheetConfig).forEach(([sheetName, headers], index) => {
    let sheet = ss.getSheetByName(sheetName);
    
    // 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('✅ 시트 생성: ' + sheetName);
    } else {
      Logger.log('✅ 기존 시트 발견: ' + sheetName);
    }
    
    // 헤더 추가
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  });
  
  Logger.log('✅ 8개 시트 구조 설정 완료');
  
  // ===== 4. Metadata 시트 기본값 입력 =====
  const metadataSheet = ss.getSheetByName('Metadata');
  if (!metadataSheet.getRange(2, 1).getValue()) {
    metadataSheet.getRange(2, 1, 1, 4).setValues([[
      '빈야사 플로우: 새벽의 요가',
      'classic',
      'A5',
      5
    ]]);
    Logger.log('✅ Metadata 기본값 입력 완료');
  } else {
    Logger.log('⚠️ Metadata에 이미 데이터가 있습니다.');
  }
  
  // ===== 5. 결과 정리 =====
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';
  
  // ===== 6. 정보 표시 (Logger 사용) =====
  const message = 
    '\n\n✅ 시트 구조 설정 완료!\n\n' +
    '🔗 Sheet URL:\n' + sheetUrl + '\n\n' +
    '⚠️ 다음 단계:\n' +
    '1. 위의 Sheet를 구글드라이브에서 열기\n' +
    '2. 우상단 "⋮" → "Apps Script" 클릭\n' +
    '3. GAS_SCRIPT.gs 코드 전체 복사 후 붙여넣기\n' +
    '4. "배포" → "새 배포" → "웹 앱" 선택\n' +
    '5. 설정: 다음 사용자로 실행 = 본인, 액세스 = 모든 사람\n' +
    '6. 배포 후 나온 URL을 .env.local에 입력\n';
  
  Logger.log(message);
}
