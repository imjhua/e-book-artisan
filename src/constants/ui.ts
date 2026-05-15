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
  showLeftSidebar: true,
  showRightPanel: true,

  // Preview mode
  spreadMode: false, // true = 2쪽씩, false = 1쪽씩

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
