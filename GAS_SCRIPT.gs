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
  'body': 'Body',
  'header-body': 'Header-Body',
  'quote': 'Quote'
};

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Load Metadata (1행 only)
    const metadataSheet = ss.getSheetByName(SHEET_NAMES.metadata);
    const metadataRow = metadataSheet.getRange(2, 1, 1, 4).getValues()[0];
    const metadata = {
      title: metadataRow[0] || '',
      theme: metadataRow[1] || 'classic',
      standard: metadataRow[2] || 'A5',
      bindingMargin: metadataRow[3] || 5
    };

    // Load all pages from each PageType sheet
    const pages = [];
    
    Object.entries(PAGE_TYPE_SHEETS).forEach(([pageType, sheetName]) => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;
      
      const data = sheet.getDataRange().getValues();
      
      // 2행부터 데이터 시작 (1행은 헤더)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || row[0].toString().trim() === '') continue;
        
        const pageData = _rowToObject(pageType, row, i + 1);
        pages.push(pageData);
      }
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
    const params = JSON.parse(e.postData.contents);
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
    id: `row-${rowIndex}`,
    type: pageType,
    title: row[1] || '',
    content: ''
  };

  switch (pageType) {
    case 'cover':
      obj.subtitle = row[2] || '';
      obj.author = row[3] || '';
      break;
    case 'toc':
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
      obj.content = row[2] || '';
      try {
        obj.items = row[3] ? JSON.parse(row[3]) : [];
      } catch {
        obj.items = [];
      }
      break;
    case 'body':
    case 'header-body':
    case 'quote':
      obj.title = row[1] || '';
      obj.content = row[2] || '';
      break;
  }

  return obj;
}

function _objectToRow(pageType, obj) {
  const row = [obj.id || '', obj.title || ''];

  switch (pageType) {
    case 'cover':
      row.push(obj.subtitle || '');
      row.push(obj.author || '');
      break;
    case 'toc':
      row.push(obj.tocEntries ? JSON.stringify(obj.tocEntries) : '[]');
      break;
    case 'chapter':
      row.push(obj.chapterSubtitle || '');
      row.push(obj.content || '');
      break;
    case 'sequence':
      row.push(obj.content || '');
      row.push(obj.items ? JSON.stringify(obj.items) : '[]');
      break;
    case 'body':
    case 'header-body':
    case 'quote':
      row.push(obj.content || '');
      break;
  }

  return row;
}
