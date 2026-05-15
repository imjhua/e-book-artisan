/**
 * Page Configuration
 * 책 페이지 레이아웃 및 마진 설정
 */

/**
 * Book Margin Settings
 * 각 페이지 타입별 내부 여백 (Tailwind 클래스 기반)
 */
export const BOOK_MARGINS = {
  // 기본 페이지 여백 (px-8, py-10)
  default: {
    paddingX: 'px-8',
    paddingY: 'py-10',
  },
  // 목차 페이지 여백 (px-16, py-24)
  toc: {
    paddingX: 'px-16',
    paddingY: 'py-24',
  },
  // 챕터 페이지 여백 (p-16)
  chapter: {
    padding: 'p-16',
  },
  // 시퀀스 페이지 여백 (px-12, py-12)
  sequence: {
    paddingX: 'px-12',
    paddingY: 'py-12',
  },
  // 인용구 페이지 여백 (px-16, py-20)
  quote: {
    paddingX: 'px-16',
    paddingY: 'py-20',
  },
} as const;
