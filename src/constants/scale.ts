/**
 * Visual Scale Configuration
 * 화면 렌더링을 위한 스케일 팩터
 */

import type { BookStandard } from '../types';

// Visual Scale Factor: mm을 px로 변환하는 계수
// A5 page (148mm × 210mm) → viewport에 맞춘 스케일
export const MM_TO_PX = 3.5;

/**
 * 판형별 콘텐츠 스케일 팩터
 *
 * A5(148×210mm)를 기준(1.0)으로, 판형 너비 비율로 산출합니다.
 * 폰트 크기, 여백 등 콘텐츠 요소가 이 비율로 조정됩니다.
 *
 * ┌──────────┬───────────┬─────────┬──────────────────────────┐
 * │ 판형      │ 크기(mm)   │ 스케일   │ 용도                      │
 * ├──────────┼───────────┼─────────┼──────────────────────────┤
 * │ 46판     │ 127×188   │ ×0.86   │ 시집, 에세이 (소형)        │
 * │ A5       │ 148×210   │ ×1.00   │ 소설, 에세이 (기준)        │
 * │ B5       │ 182×257   │ ×1.23   │ 잡지, 교재                │
 * │ A4       │ 210×297   │ ×1.42   │ 문제지, 보고서             │
 * └──────────┴───────────┴─────────┴──────────────────────────┘
 */
export const CONTENT_SCALE: Record<BookStandard, number> = {
  '46판': 0.86,   // 127 ÷ 148 ≈ 0.858
  'A5':   1.00,   // 기준
  'B5':   1.23,   // 182 ÷ 148 ≈ 1.230
  'A4':   1.42,   // 210 ÷ 148 ≈ 1.419
};

/**
 * A5 기준 콘텐츠 크기 (px)
 *
 * 아래 값들이 CONTENT_SCALE과 곱해져 각 판형에 맞는 크기가 됩니다.
 * 수정 시 참고:
 *   - 제목류: 시각적 임팩트를 위해 큰 값 (30~60px)
 *   - 본문류: 가독성을 위해 12~16px 범위 권장
 *   - 라벨류: 보조 정보로 작은 크기 (8~11px)
 *
 * 예) A5 본문 14px → 46판 12px, B5 17.2px, A4 19.9px
 */
const A5_BASE = {
  // ── 표지 (Cover) ──
  coverTitle:       36,    // 책 제목
  coverTitleLarge:  60,    // 모던 테마 대형 제목
  coverSubtitle:    11,    // 부제목
  authorLabel:      10,    // "Author" 라벨
  authorName:       14,    // 저자 이름

  // ── 목차 (TOC) ──
  tocLabel:          9,    // "Index" 라벨
  tocTitle:         30,    // "목차" 제목
  tocChapter:        9,    // 챕터 번호 (CHAPTER 01)
  tocPageNum:       10,    // 페이지 번호 (P.05)
  tocEntry:         13,    // 목차 항목 텍스트

  // ── 챕터 (Chapter) 구분 페이지 ──
  chapterLabel:     11,    // "Part" 라벨
  chapterTitle:     48,    // 챕터 제목 (CHAPTER 01)
  chapterSubtitle:  20,    // 챕터 부제목

  // ── 본문 (Body / Header-Body) ──
  bodyText:         14,    // 본문 텍스트
  firstLetter:      36,    // 본문 드롭캡 (첫 글자)

  // ── 시퀀스 (Sequence) ──
  sequenceText:     13,    // 시퀀스 항목 텍스트
  sequencePose:     11,    // 시퀀스 포즈 라벨

  // ── 인용 (Quote) ──
  quoteText:        30,    // 인용문

  // ── 공통 ──
  runningHeader:     8,    // 페이지 상단 러닝 헤더
  pageNumber:        9,    // 페이지 번호

  // ── 여백 (padding, px) ──
  padSm:            48,    // 작은 여백 (본문, 시퀀스)
  padMd:            64,    // 중간 여백 (목차, 챕터)
  padLg:            96,    // 큰 여백 (표지 상하, 목차 상하)
  padQuoteY:        80,    // 인용 상하 여백
} as const;

/** 콘텐츠 크기 타입 */
export type ContentSizes = { [K in keyof typeof A5_BASE]: number };

/**
 * 판형에 맞는 콘텐츠 크기를 반환합니다.
 *
 * @param standard - 판형 ('46판' | 'A5' | 'B5' | 'A4')
 * @returns 스케일이 적용된 px 단위 크기 객체
 *
 * 사용 예:
 *   const sizes = getContentSizes('B5');
 *   style={{ fontSize: sizes.bodyText }}  // → 17.2px
 */
export function getContentSizes(standard: BookStandard): ContentSizes {
  const scale = CONTENT_SCALE[standard];
  const result = {} as Record<string, number>;
  for (const [key, base] of Object.entries(A5_BASE)) {
    result[key] = Math.round(base * scale * 10) / 10;
  }
  return result as ContentSizes;
}
