/**
 * UI State Configuration
 * 사용자 인터페이스 관련 기본값 및 상태 정의
 */

/**
 * UI 기본값
 */
export const UI_DEFAULTS = {
  // Zoom settings
  zoom: {
    default: 1,
    min: 0.25,
    max: 3,
    step: 0.1,
  },

  // Sidebar visibility
  showLeftSidebar: false,
  showRightPanel: false,

  // Preview mode
  spreadMode: false, // true = 2쪽씩, false = 1쪽씩

  // Print Preview mode (전체보기)
  showPrintPreview: true, // true = 전체보기 기본, false = 스프레드 모드 기본

  // Current page index
  currentIndex: 0,

  // Sync status
  syncStatus: 'idle' as const,
} as const;

/**
 * Sync Status Types
 */
export const SYNC_STATUSES = ['idle', 'loading', 'success', 'error'] as const;
export type SyncStatus = typeof SYNC_STATUSES[number];
