/**
 * Print Configuration
 * 인쇄 및 제본 관련 설정
 */

/**
 * Print Settings
 * 인쇄 시 UI 요소 제어 및 기본 인쇄 설정
 */
export const PRINT_SETTINGS = {
  // 용지 크기 (기본값)
  paperSize: 'A5',
  // 용지 방향
  orientation: 'portrait',
  // 프린트 문서 제목
  documentTitle: 'e-book-print',
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
   * CROP MARK (재단선): A5 경계선 표시
   * 인쇄소에서 정확한 재단을 위한 가이드 라인
   */
  cropMark: {
    strokeWidth: 1.5, // px (SVG stroke width)
    color: '#FF1493', // 마젠타 (인쇄 산업 표준)
  },

  /**
   * SAFE ZONE (안전 영역): 콘텐츠 최소 여백
   * 콘텐츠가 이 영역 안에 있어야 출혈 또는 재단 위험 없음
   */
  safeMargin: 0, // mm
} as const;
