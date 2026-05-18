/**
 * Print Configuration
 * 인쇄 및 제본 관련 설정
 */

/**
 * Print Settings
 * 인쇄 및 프린트 UI 설정
 */
export const PRINT_SETTINGS = {
  // 용지 크기 (기본값)
  paperSize: 'A5',
  // 용지 방향
  orientation: 'portrait',
  // 프린트 문서 제목
  documentTitle: 'e-book-print',
  // 블리드 포함 여부 (프린트 시)
  includeBleed: true,
  // 프린트 시 숨길 요소들 (CSS 셀렉터)
  hiddenElements: [
    '.sidebar',
    '.editor-panel',
    '.floating-controls',
    'header',
    '.sync-status',
  ],
} as const;

/**
 * Available Paper Sizes
 * 선택 가능한 용지 크기 정의
 * 참고: '46판', 'A5', 'B5', 'A4'는 BOOK_STANDARDS와 동일한 크기값 사용
 */
export const AVAILABLE_PAPER_SIZES = {
  '46판': { width: 127, height: 188, label: '46판 (127×188mm)' },
  'A5': { width: 148, height: 210, label: 'A5 (148×210mm)' },
  'B5': { width: 182, height: 257, label: 'B5 (182×257mm)' },
  'A4': { width: 210, height: 297, label: 'A4 (210×297mm)' },
  'B6': { width: 128, height: 182, label: 'B6 (128×182mm)' },
  'Letter': { width: 215.9, height: 279.4, label: 'Letter (215.9×279.4mm)' },
  'Custom': { width: 200, height: 280, label: 'Custom (200×280mm)' },
} as const;

/**
 * Print Binding Specifications
 * 실제 인쇄 및 제본 시 필요한 여백 정의
 * 
 * 단위:
 * - BLEED, SPINE, SAFE_MARGIN: mm
 * - CROP_MARK_STROKE: px
 */
export const PRINT_BINDING_SPECS = {
  /**
   * SPINE (책등): 2쪽 사이의 제본선 여백
   * 스프레드 모드에서 두 페이지 중앙에 추가되는 여백
   */
  spine: 15, // mm

  /**
   * BLEED (출혈선): 재단 시 여유분
   * 인쇄된 이미지가 재단선까지 확장되는 영역
   */
  bleed: 3, // mm

  /**
   * CROP MARK (재단선): 세이프 마진 기준으로 그려지는 가이드 라인
   * 세이프 마진 경계를 표시하여 콘텐츠가 안전 영역 안에 있음을 시각화
   */
  cropMark: {
    strokeWidth: 1.5, // px (SVG stroke width)
    color: '#FF1493', // 마젠타 (인쇄 산업 표준)
  },

  /**
   * SAFE ZONE (안전 영역): 콘텐츠 최소 여백
   * 콘텐츠가 이 영역 안에 있어야 출혈 또는 재단 위험 없음
   * 크롭마크는 이 영역을 기준으로 그려짐
   */
  safeMargin: 5, // mm
} as const;
