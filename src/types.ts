export type BookStandard = '46판' | 'A5' | 'B5' | 'A4';

export interface StandardInfo {
  width: number; // mm
  height: number; // mm
  description: string;
}

export const BOOK_STANDARDS: Record<BookStandard, StandardInfo> = {
  '46판': { width: 127, height: 188, description: '일반도서 - 시, 에세이' },
  'A5': { width: 148, height: 210, description: '일반도서 - 소설, 에세이' },
  'B5': { width: 182, height: 257, description: '문제지, 잡지' },
  'A4': { width: 210, height: 297, description: '문제지, 잡지' },
};

export type PageType = 'cover' | 'toc' | 'chapter' | 'sequence' | 'body' | 'header-body' | 'quote';

export type BookTheme = 'classic' | 'modern' | 'academic' | 'zen';

export interface TocEntry {
  chapter: string;
  title: string;
  pageNumber?: string;
}

export interface PageData {
  id: string;
  type: PageType;
  title?: string;
  chapterTitle?: string;
  subtitle?: string;
  chapterSubtitle?: string;
  author?: string;
  content?: string;
  items?: string[]; // Legacy TOC
  tocEntries?: TocEntry[]; // New TOC
}

export interface BookProject {
  title: string;
  theme: BookTheme;
  standard: BookStandard;
  pages: PageData[];
  bindingMargin: number; // mm
}
