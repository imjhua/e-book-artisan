// ====== Google Apps Script for e-book-artisan ======
// Deploy as Web App: Execute as Me, Anyone can access

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAMES = {
  metadata: 'Metadata',
  cover: 'Cover',
  toc: 'TOC',
  chapter: 'Chapter',
  sequence: 'Sequence',
  body: 'Body',
  headerBody: 'Header-Body',
  quote: 'Quote'
};

const PAGE_TYPE_SHEETS = {
  'cover': 'Cover',
  'toc': 'TOC',
  'chapter': 'Chapter',
  'sequence': 'Sequence',
  'header-body': 'Header-Body',
  'body': 'Body',
  'quote': 'Quote'
};

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = {};
    
    // 모든 시트를 한 번에 가져오기
    ss.getSheets().forEach(s => { sheets[s.getName()] = s; });
    
    // Load Metadata
    const metadataSheet = sheets[SHEET_NAMES.metadata];
    const metadataRow = metadataSheet.getRange(2, 1, 1, 4).getValues()[0];
    const metadata = {
      title: metadataRow[0] || '',
      theme: metadataRow[1] || 'classic',
      standard: metadataRow[2] || 'A5',
      bindingMargin: metadataRow[3] || 5
    };

    // Load PageOrder 정보
    const pageOrderMap = {};
    const pageOrderSheet = sheets['PageOrder'];
    if (pageOrderSheet && pageOrderSheet.getLastRow() > 1) {
      const orderData = pageOrderSheet.getRange(2, 1, pageOrderSheet.getLastRow() - 1, 3).getValues();
      for (let i = 0; i < orderData.length; i++) {
        if (orderData[i][0]) {
          pageOrderMap[orderData[i][0]] = orderData[i][2] !== '' ? orderData[i][2] : i;
        }
      }
    }

    // Load all pages from each PageType sheet
    let pages = [];
    
    Object.entries(PAGE_TYPE_SHEETS).forEach(([pageType, sheetName]) => {
      const sheet = sheets[sheetName];
      if (!sheet || sheet.getLastRow() <= 1) return;
      
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || row[0].toString().trim() === '') continue;
        
        const pageData = _rowToObject(pageType, row, i + 2);
        pages.push(pageData);
      }
    });

    // PageOrder 기준으로 정렬
    pages.sort((a, b) => {
      const orderA = pageOrderMap[a.id] !== undefined ? pageOrderMap[a.id] : 999;
      const orderB = pageOrderMap[b.id] !== undefined ? pageOrderMap[b.id] : 999;
      return orderA - orderB;
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      metadata: metadata,
      pages: pages
    }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // 요청 파싱
    let params;
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No POST data received');
    }
    
    const { action, pageType, rowIndex, data } = params;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ===== METADATA UPDATE =====
    if (action === 'updateMetadata') {
      const metadataSheet = ss.getSheetByName(SHEET_NAMES.metadata);
      metadataSheet.getRange(2, 1, 1, 4).setValues([[
        data.title || '',
        data.theme || 'classic',
        data.standard || 'A5',
        data.bindingMargin || 5
      ]]);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Metadata updated'
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== SYNC ALL (전체 동기화) =====
    if (action === 'syncAll') {
      const allPages = data.pages || [];
      const orderEntries = [];

      // 각 시트의 기존 데이터 삭제 후 새로 작성
      Object.entries(PAGE_TYPE_SHEETS).forEach(([pType, sName]) => {
        const s = ss.getSheetByName(sName);
        if (!s) return;
        if (s.getLastRow() > 1) {
          s.deleteRows(2, s.getLastRow() - 1);
        }
      });

      // 페이지 데이터 작성 + 순서 기록
      allPages.forEach((page, idx) => {
        const pType = page.type;
        const sName = PAGE_TYPE_SHEETS[pType];
        if (!sName) return;
        const s = ss.getSheetByName(sName);
        if (!s) return;
        const rowValues = _objectToRow(pType, page);
        s.appendRow(rowValues);
        orderEntries.push([page.id, pType, idx]);
      });

      // PageOrder 시트 갱신
      const pageOrderSheet = ss.getSheetByName('PageOrder');
      if (pageOrderSheet) {
        if (pageOrderSheet.getLastRow() > 1) {
          pageOrderSheet.deleteRows(2, pageOrderSheet.getLastRow() - 1);
        }
        if (orderEntries.length > 0) {
          pageOrderSheet.getRange(2, 1, orderEntries.length, 3).setValues(orderEntries);
        }
      }

      // Metadata 저장
      if (data.metadata) {
        const metadataSheet = ss.getSheetByName(SHEET_NAMES.metadata);
        metadataSheet.getRange(2, 1, 1, 4).setValues([[
          data.metadata.title || '',
          data.metadata.theme || 'classic',
          data.metadata.standard || 'A5',
          data.metadata.bindingMargin || 5
        ]]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'All pages synced'
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ===== PAGE CRUD =====
    if (!PAGE_TYPE_SHEETS[pageType]) {
      throw new Error(`Invalid pageType: ${pageType}`);
    }

    const sheet = ss.getSheetByName(PAGE_TYPE_SHEETS[pageType]);
    if (!sheet) throw new Error(`Sheet not found: ${pageType}`);

    // DELETE
    if (action === 'delete' && rowIndex) {
      sheet.deleteRow(parseInt(rowIndex));
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Page deleted'
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // UPDATE
    if (action === 'update' && rowIndex && data) {
      const rowValues = _objectToRow(pageType, data);
      sheet.getRange(parseInt(rowIndex), 1, 1, rowValues.length).setValues([rowValues]);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Page updated'
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // CREATE (SAVE)
    if (action === 'save' && data) {
      const rowValues = _objectToRow(pageType, data);
      sheet.appendRow(rowValues);
      
      // PageOrder 시트에도 새 페이지 추가
      const pageOrderSheet = ss.getSheetByName('PageOrder');
      if (pageOrderSheet) {
        const lastOrder = pageOrderSheet.getLastRow() - 1; // 헤더 제외
        const maxOrder = Math.max(0, lastOrder);
        pageOrderSheet.appendRow([data.id, pageType, maxOrder]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Page created',
        data: data
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error('Invalid action or missing parameters');

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== HELPER FUNCTIONS =====

function _rowToObject(pageType, row, rowIndex) {
  const obj = {
    id: `${pageType}-row-${rowIndex}`,
    type: pageType,
  };

  switch (pageType) {
    case 'cover':
      obj.title = row[1] || '';
      obj.subtitle = row[2] || '';
      obj.author = row[3] || '';
      break;
    case 'toc':
      obj.title = row[1] || '';
      try {
        obj.tocEntries = row[2] ? JSON.parse(row[2]) : [];
      } catch {
        obj.tocEntries = [];
      }
      break;
    case 'chapter':
      obj.chapterTitle = row[1] || '';
      obj.chapterSubtitle = row[2] || '';
      obj.content = row[3] || '';
      break;
    case 'sequence':
      obj.title = row[1] || '';
      obj.content = row[2] || '';
      try {
        obj.items = row[3] ? JSON.parse(row[3]) : [];
      } catch {
        obj.items = [];
      }
      break;
    case 'body':
      obj.content = row[1] || '';
      break;
    case 'header-body':
      obj.title = row[1] || '';
      obj.content = row[2] || '';
      break;
    case 'quote':
      obj.title = row[1] || '';
      obj.content = row[2] || '';
      break;
  }

  return obj;
}

function _objectToRow(pageType, obj) {
  switch (pageType) {
    case 'cover':
      return [
        obj.id || '',
        obj.title || '',
        obj.subtitle || '',
        obj.author || ''
      ];
    case 'toc':
      return [
        obj.id || '',
        obj.title || '',
        obj.tocEntries ? JSON.stringify(obj.tocEntries) : '[]'
      ];
    case 'chapter':
      return [
        obj.id || '',
        obj.chapterTitle || '',
        obj.chapterSubtitle || '',
        obj.content || ''
      ];
    case 'sequence':
      return [
        obj.id || '',
        obj.title || '',
        obj.content || '',
        obj.items ? JSON.stringify(obj.items) : '[]'
      ];
    case 'body':
      return [
        obj.id || '',
        obj.content || ''
      ];
    case 'header-body':
      return [
        obj.id || '',
        obj.title || '',
        obj.content || ''
      ];
    case 'quote':
      return [
        obj.id || '',
        obj.title || '',
        obj.content || ''
      ];
  }
}
