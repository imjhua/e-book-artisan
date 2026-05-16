import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Layout, 
  Type, 
  Hash, 
  Columns, 
  FileText,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Flower2,
  AlertCircle,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { BOOK_STANDARDS, BookStandard, PageData, PageType, PageData as IPageData, BookTheme, BookProject } from './types.ts';
import { useEbookSheet } from './hooks/useEbookSheet';
import { GAS_URL, MM_TO_PX, UI_DEFAULTS, PRINT_BINDING_SPECS, getContentSizes, type SyncStatus } from './constants';

export default function App() {
  const { load, savePage, updatePage, deletePage, saveMetadata, syncAll, loading, error } = useEbookSheet(GAS_URL);
  const [currentIndex, setCurrentIndex] = useState(UI_DEFAULTS.currentIndex);
  const [spreadMode, setSpreadMode] = useState(UI_DEFAULTS.spreadMode);
  const [zoom, setZoom] = useState(UI_DEFAULTS.zoom.default);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(UI_DEFAULTS.syncStatus);
  const [syncMessage, setSyncMessage] = useState('');
  const [showLeftSidebar, setShowLeftSidebar] = useState(UI_DEFAULTS.showLeftSidebar);
  const [showRightPanel, setShowRightPanel] = useState(UI_DEFAULTS.showRightPanel);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize with empty project - wait for Google Sheets load
  const [project, setProject] = useState<BookProject | null>(null);

  const currentPage = project?.pages[currentIndex];
  const standardInfo = project ? BOOK_STANDARDS[project.standard] : null;

  // 앱 시작 시 자동으로 Google Sheets에서 데이터 로드
  useEffect(() => {
    const autoLoad = async () => {
      try {
        const loadedProject = await load();
        setProject(loadedProject);
        setCurrentIndex(0);
        console.log('✅ Google Sheets 데이터 로드 성공:', loadedProject);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '알 수 없는 에러';
        console.error('❌ Google Sheets 데이터 로드 실패:', errorMsg);
      }
    };
    autoLoad();
  }, [load]);

  // 프린트 이벤트 리스너 - 사이드바 복구 보장
  useEffect(() => {
    const handleBeforePrint = () => setIsPrintMode(true);
    const handleAfterPrint = () => setIsPrintMode(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Helper to add a new page
  const addPage = (type: PageType = 'body') => {
    const newPage: PageData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: '',
      chapterTitle: '',
      content: '',
    };
    const nextPages = [...project.pages];
    nextPages.splice(currentIndex + 1, 0, newPage);
    setProject({ ...project, pages: nextPages });
    setCurrentIndex(currentIndex + 1);
  };

  const removePage = (index: number) => {
    if (project.pages.length <= 1) return;
    const nextPages = project.pages.filter((_, i) => i !== index);
    setProject({ ...project, pages: nextPages });
    setCurrentIndex(Math.max(0, index - 1));
  };

  const updateCurrentPage = (data: Partial<PageData>) => {
    const nextPages = [...project.pages];
    nextPages[currentIndex] = { ...nextPages[currentIndex], ...data };
    setProject({ ...project, pages: nextPages });
  };

  const changeLayout = (type: PageType) => {
    updateCurrentPage({ type });
  };

  const movePage = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= project.pages.length) return;
    const nextPages = [...project.pages];
    const [movedPage] = nextPages.splice(index, 1);
    nextPages.splice(newIndex, 0, movedPage);
    setProject({ ...project, pages: nextPages });
    if (currentIndex === index) setCurrentIndex(newIndex);
    else if (currentIndex === newIndex) setCurrentIndex(index);
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextPages = [...project.pages];
    const [movedPage] = nextPages.splice(fromIndex, 1);
    nextPages.splice(toIndex, 0, movedPage);
    setProject({ ...project, pages: nextPages });
    if (currentIndex === fromIndex) setCurrentIndex(toIndex);
    else if (currentIndex >= Math.min(fromIndex, toIndex) && currentIndex <= Math.max(fromIndex, toIndex)) {
      setCurrentIndex(currentIndex + (fromIndex > toIndex ? 1 : -1));
    }
  };

  // Save to Google Sheets
  const handleSaveToSheets = async () => {
    try {
      setIsSaving(true);
      setSyncStatus('loading');
      setSyncMessage('저장 중...');
      
      // 전체 동기화 (기존 데이터 삭제 후 새로 작성)
      await syncAll(project);

      setSyncStatus('success');
      setSyncMessage('저장 완료!');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : 'Save failed');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview dimensions (use A5 default if standardInfo is null)
  const defaultStandardInfo = standardInfo || BOOK_STANDARDS['A5'];
  const previewWidth = defaultStandardInfo.width * MM_TO_PX;
  const previewHeight = defaultStandardInfo.height * MM_TO_PX;
  const marginPx = project?.bindingMargin ? project.bindingMargin * MM_TO_PX : 0;

  // New logic: index 0 (p1) is Left, index 1 (p2) is Right.
  const isLeftPage = currentIndex % 2 === 0; 
  const paddingLeft = !isLeftPage ? `${marginPx + 24}px` : '24px';
  const paddingRight = isLeftPage ? `${marginPx + 24}px` : '24px';

  const getChapterTitle = (idx: number) => {
    for (let i = idx; i >= 0; i--) {
      if (project.pages[i].type === 'chapter' && project.pages[i].chapterTitle) {
        return project.pages[i].chapterTitle;
      }
    }
    return '';
  };

  // 프린트 핸들러: 선택한 표준에 맞춰 페이지 크기 동적 설정
  const handlePrint = () => {
    if (!project) return;

    // 선택된 표준 정보 가져오기
    const standard = BOOK_STANDARDS[project.standard];
    const width = standard.width;
    const height = standard.height;

    // 기존 프린트 스타일이 있으면 제거
    const existingStyle = document.getElementById('print-page-size');
    if (existingStyle) {
      existingStyle.remove();
    }

    // @page 크기만 동적 설정 (폰트, 색상 등은 모두 CSS에서 관리)
    const style = document.createElement('style');
    style.id = 'print-page-size';
    style.textContent = `
      @page {
        size: ${width}mm ${height}mm;
        margin: 0;
      }
    `;
    document.head.appendChild(style);

    // 폰트 로딩 완료 후 프린트 대화 열기
    document.fonts.ready.then(() => {
      window.print();
    });
  };

  return (
    <>
      {error ? (
        <div className="flex h-screen w-screen items-center justify-center bg-canvas">
          <div className="text-center max-w-2xl">
            <div className="mb-6 flex justify-center">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-3">데이터 로드 실패</h2>
            <div className="text-sm text-accent mb-6 bg-red-50 p-6 rounded-sm border border-red-200 text-left whitespace-pre-wrap font-mono">
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-ink text-white rounded-sm text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : !project ? (
        <div className="flex h-screen w-screen items-center justify-center bg-canvas">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-ink"></div>
            </div>
            <p className="text-sm text-accent font-medium">데이터를 로드하는 중...</p>
          </div>
        </div>
      ) : (
      <div className="flex h-screen bg-canvas overflow-hidden font-sans relative">
      {/* 저장 중 투명 오버레이 */}
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-ink"></div>
        </div>
      )}
      {/* Sidebar: Navigation & Controls */}
      {showLeftSidebar && !isPrintMode && (
      <aside className="w-80 bg-white border-r border-line flex flex-col z-10 transition-all duration-300">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">Document Structure</span>
            <button 
              onClick={() => addPage()}
              className="p-1.5 hover:bg-canvas rounded-full transition-colors group"
            >
              <Plus className="w-4 h-4 text-accent group-hover:text-ink" />
            </button>
          </div>
          {(project.pages || []).filter(Boolean).map((page, idx) => (
            <div
              key={page.id}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
              onDrop={() => { if (dragIndex !== null) reorderPages(dragIndex, idx); setDragIndex(null); setDragOverIndex(null); }}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full flex items-center gap-3 p-3 rounded-sm text-left transition-all group border cursor-grab active:cursor-grabbing ${
                idx === currentIndex ? 'bg-ink text-white border-ink shadow-lg' : 'hover:bg-neutral-50 text-ink border-transparent hover:border-line'
              } ${dragIndex === idx ? 'opacity-40' : ''} ${dragOverIndex === idx && dragIndex !== idx ? 'border-t-2 !border-t-ink' : ''}`}
            >
              <span className={`text-[10px] font-mono w-4 ${idx === currentIndex ? 'text-accent' : 'text-line'}`}>
                {(idx + 1).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 truncate">
              <span className="text-xs font-semibold truncate uppercase tracking-tight">
                {page.type === 'chapter' ? (page.chapterTitle || '(제목없음)') : page.type === 'body' ? '(제목없음)' : (page.title || '(제목없음)')}
              </span>
                <p className={`text-[9px] uppercase tracking-[0.15em] font-medium ${idx === currentIndex ? 'text-accent' : 'text-accent/60'}`}>
                  {page.type}
                </p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  disabled={idx === 0}
                  onClick={(e) => { e.stopPropagation(); movePage(idx, -1); }}
                  className={`p-0.5 rounded disabled:opacity-0 transition-all ${idx === currentIndex ? 'text-white/60 hover:text-white' : 'text-accent hover:text-ink'}`}
                >
                  <ChevronLeft className="w-3 h-3 rotate-90" />
                </button>
                <button 
                  disabled={idx === project.pages.length - 1}
                  onClick={(e) => { e.stopPropagation(); movePage(idx, 1); }}
                  className={`p-0.5 rounded disabled:opacity-0 transition-all ${idx === currentIndex ? 'text-white/60 hover:text-white' : 'text-accent hover:text-ink'}`}
                >
                  <ChevronLeft className="w-3 h-3 -rotate-90" />
                </button>
              </div>
              {project.pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(idx);
                  }}
                  className="p-0.5 rounded hover:bg-neutral-200 transition-all"
                >
                  <Trash2 
                    className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      idx === currentIndex ? 'text-accent hover:text-white' : 'text-accent hover:text-red-500'
                    }`}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-white border-t border-line">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest">Chapters / Pages</span>
              <span className="text-xs font-mono font-bold text-ink">{project.pages.length}</span>
            </div>
           <button 
             onClick={handlePrint}
             className="w-full bg-ink text-white py-3 rounded-sm flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-all shadow-sm"
             title={`${project.standard} 크기로 프린트 (${standardInfo?.width}mm × ${standardInfo?.height}mm)`}
           >
             <Download className="w-3.5 h-3.5" />
             Print Preview
           </button>
        </div>
      </aside>
      )}

      {/* Main Preview Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-canvas" data-print-preview={isPrintMode}>
        <header className="h-16 border-b border-line bg-white flex items-center justify-between px-8 z-10 shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="p-2 hover:bg-canvas rounded transition-colors text-accent hover:text-ink"
              title="Toggle Left Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-8 flex-1 overflow-hidden">
             <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
                {[
                  { type: 'cover' as PageType, label: '표지' },
                  { type: 'toc' as PageType, label: '목차' },
                  { type: 'chapter' as PageType, label: '챕터' },
                  { type: 'sequence' as PageType, label: '시퀀스' },
                  { type: 'body' as PageType, label: '본문' },
                  { type: 'header-body' as PageType, label: '제목/본문' },
                  { type: 'quote' as PageType, label: '인용구' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => changeLayout(item.type)}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all relative py-5 shrink-0 ${
                      currentPage.type === item.type 
                        ? 'text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-ink' 
                        : 'text-accent hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
             </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
            <button 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(spreadMode ? Math.max(0, currentIndex - 2) : currentIndex - 1)}
              className="p-2 border border-line rounded-sm hover:bg-canvas disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold text-accent px-4 border-x border-line">
              {spreadMode 
                ? `${Math.floor(currentIndex / 2) + 1} / ${Math.ceil(project.pages.length / 2)}`
                : `${currentIndex + 1} / ${project.pages.length}`
              }
            </span>
            <button 
              disabled={spreadMode ? currentIndex >= project.pages.length - 1 : currentIndex === project.pages.length - 1}
              onClick={() => setCurrentIndex(spreadMode ? Math.min(project.pages.length - 1, currentIndex + 2) : currentIndex + 1)}
              className="p-2 border border-line rounded-sm hover:bg-canvas disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="p-2 hover:bg-canvas rounded transition-colors text-accent hover:text-ink"
            title="Toggle Right Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </header>

        <div className="flex-1 flex items-center justify-center p-16 overflow-auto relative">
          {isPrintMode ? (
            // 프린트 모드: 2쪽씩 페어로 렌더링 (PrintComponent 사용)
            <div className="w-full flex flex-col gap-0">
              {Array.from({ length: Math.ceil(project.pages.length / 2) }).map((_, pairIdx) => {
                const leftIdx = pairIdx * 2;
                const rightIdx = leftIdx + 1;
                
                return (
                  <div key={`print-pair-${pairIdx}`} style={{ pageBreakAfter: 'always' }}>
                    <PrintComponent 
                      leftPage={project.pages[leftIdx]}
                      rightPage={rightIdx < project.pages.length ? project.pages[rightIdx] : undefined}
                      leftIndex={leftIdx}
                      rightIndex={rightIdx}
                      width={previewWidth}
                      height={previewHeight}
                      theme={project.theme}
                      standard={project.standard}
                      chapterTitle={getChapterTitle(leftIdx)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // 일반 모드: 현재 페이지/스프레드만 표시
            <AnimatePresence mode="wait">
              <motion.div 
                key={spreadMode ? `spread-${currentIndex}-${zoom}` : `${currentPage.id}-${zoom}`}
                initial={{ opacity: 0, scale: zoom * 0.98 }}
                animate={{ opacity: 1, scale: zoom }}
                exit={{ opacity: 0, scale: zoom * 1.02 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'center center' }}
                className="flex items-center gap-0"
              >
                {/* 2쪽/1쪽 모드 분기 */}
                {spreadMode ? (
                  (() => {
                    const leftIdx = Math.floor(currentIndex / 2) * 2;
                    const rightIdx = leftIdx + 1;
                    return (
                      <DoublePageComponent 
                        leftPage={project.pages[leftIdx]} 
                        rightPage={rightIdx < project.pages.length ? project.pages[rightIdx] : undefined}
                        leftIndex={leftIdx}
                        rightIndex={rightIdx}
                        width={previewWidth}
                        height={previewHeight}
                        theme={project.theme}
                        standard={project.standard}
                        chapterTitle={getChapterTitle(leftIdx)}
                      />
                    );
                  })()
                ) : (
                  <SinglePageComponent 
                    page={currentPage} 
                    index={currentIndex}
                    width={previewWidth}
                    height={previewHeight}
                    theme={project.theme}
                    standard={project.standard}
                    chapterTitle={getChapterTitle(currentIndex)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Floating Zoom Controls */}
          {!isPrintMode && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-line rounded-full px-4 py-2 flex items-center gap-4 shadow-xl z-20 transition-all hover:bg-white">
             <button 
              onClick={() => setZoom(Math.max(UI_DEFAULTS.zoom.min, zoom - UI_DEFAULTS.zoom.step))}
              className="p-1.5 hover:bg-canvas rounded-full transition-colors text-accent hover:text-ink"
              title="Zoom Out"
             >
                <ZoomOut className="w-4 h-4" />
             </button>
             <div className="w-12 text-center text-[10px] font-mono font-bold text-accent select-none">
                {Math.round(zoom * 100)}%
             </div>
             <button 
              onClick={() => setZoom(Math.min(UI_DEFAULTS.zoom.max, zoom + UI_DEFAULTS.zoom.step))}
              className="p-1.5 hover:bg-canvas rounded-full transition-colors text-accent hover:text-ink"
              title="Zoom In"
             >
                <ZoomIn className="w-4 h-4" />
             </button>
             <div className="w-[1px] h-4 bg-line mx-1" />
             <button 
              onClick={() => setZoom(1)}
              className="p-1.5 hover:bg-canvas rounded-full transition-colors text-accent hover:text-ink"
              title="Reset Zoom"
             >
                <Maximize2 className="w-4 h-4" />
             </button>
          </div>
          )}
        </div>
      </main>

      {/* Editor Panel (Right Side) */}
      {showRightPanel && !isPrintMode && (
      <aside className="w-80 bg-white border-l border-line p-6 z-10 flex flex-col gap-8 overflow-y-auto">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-6">Document Specs</h2>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-accent font-bold">미리보기 설정</label>
              <div className="flex bg-canvas/30 p-1 rounded-sm border border-line">
                <button 
                  onClick={() => setSpreadMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all ${
                    !spreadMode ? 'bg-white text-ink shadow-sm' : 'text-accent hover:text-ink'
                  }`}
                >
                  1쪽씩
                </button>
                <button 
                  onClick={() => setSpreadMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all ${
                    spreadMode ? 'bg-white text-ink shadow-sm' : 'text-accent hover:text-ink'
                  }`}
                >
                  2쪽씩
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-accent font-bold">Book Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(['classic', 'modern', 'academic', 'zen'] as BookTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setProject({ ...project, theme: t })}
                    className={`px-2 py-2.5 text-[10px] uppercase font-bold border transition-all rounded-sm ${
                      project.theme === t ? 'bg-ink text-white border-ink' : 'bg-canvas/30 text-accent border-line hover:border-ink hover:text-ink'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-line/20">
               {currentPage.type === 'cover' && (
                 <>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">책 제목</label>
                     <input 
                       type="text"
                       value={currentPage.title || ''}
                       onChange={(e) => updateCurrentPage({ title: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                     />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">서브타이틀</label>
                     <input 
                       type="text"
                       value={currentPage.subtitle || ''}
                       onChange={(e) => updateCurrentPage({ subtitle: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                     />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">저자명</label>
                     <input 
                       type="text"
                       value={currentPage.author || ''}
                       onChange={(e) => updateCurrentPage({ author: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                     />
                   </div>
                 </>
               )}

               {currentPage.type === 'toc' && (
                 <div className="flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">목차 항목</label>
                     <button 
                       onClick={() => {
                         const currentEntries = currentPage.tocEntries || [];
                         updateCurrentPage({ 
                           tocEntries: [...currentEntries, { chapter: 'Chapter ' + (currentEntries.length + 1), title: '' }] 
                         });
                       }}
                       className="p-1 hover:bg-canvas rounded-full transition-colors"
                     >
                        <Plus className="w-4 h-4 text-accent" />
                     </button>
                   </div>
                   
                   <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                     {(currentPage.tocEntries || []).map((entry, idx) => (
                       <div key={idx} className="p-3 bg-canvas/30 rounded border border-line/10 space-y-2 group relative">
                         <button 
                           onClick={() => {
                             const nextEntries = [...(currentPage.tocEntries || [])];
                             nextEntries.splice(idx, 1);
                             updateCurrentPage({ tocEntries: nextEntries });
                           }}
                           className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                         <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="text-[8px] uppercase tracking-widest text-accent/60 font-bold mb-1 block">Chapter</label>
                             <input 
                               type="text"
                               value={entry.chapter}
                               onChange={(e) => {
                                 const nextEntries = [...(currentPage.tocEntries || [])];
                                 nextEntries[idx] = { ...nextEntries[idx], chapter: e.target.value };
                                 updateCurrentPage({ tocEntries: nextEntries });
                               }}
                               className="w-full bg-white/50 px-2 py-1 text-[10px] border border-line/20 focus:border-ink outline-none"
                               placeholder="CH 01"
                             />
                           </div>
                           <div>
                             <label className="text-[8px] uppercase tracking-widest text-accent/60 font-bold mb-1 block">Page #</label>
                             <input 
                               type="text"
                               value={entry.pageNumber || ''}
                               onChange={(e) => {
                                 const nextEntries = [...(currentPage.tocEntries || [])];
                                 nextEntries[idx] = { ...nextEntries[idx], pageNumber: e.target.value };
                                 updateCurrentPage({ tocEntries: nextEntries });
                               }}
                               className="w-full bg-white/50 px-2 py-1 text-[10px] border border-line/20 focus:border-ink outline-none"
                               placeholder={String(idx + 1).padStart(2, '0')}
                             />
                           </div>
                         </div>
                         <div>
                            <label className="text-[8px] uppercase tracking-widest text-accent/60 font-bold mb-1 block">Title</label>
                            <input 
                              type="text"
                              value={entry.title}
                              onChange={(e) => {
                                const nextEntries = [...(currentPage.tocEntries || [])];
                                nextEntries[idx] = { ...nextEntries[idx], title: e.target.value };
                                updateCurrentPage({ tocEntries: nextEntries });
                              }}
                              className="w-full bg-white/50 px-2 py-1 text-[10px] border border-line/20 focus:border-ink outline-none"
                              placeholder="항목 제목"
                            />
                         </div>
                       </div>
                     ))}
                     {(currentPage.tocEntries || []).length === 0 && (
                       <div className="py-10 text-center border border-dashed border-line/20 rounded">
                         <p className="text-[10px] text-accent/50 uppercase tracking-widest">No entries added</p>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {currentPage.type === 'chapter' && (
                 <>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">챕터 제목</label>
                     <input 
                       type="text"
                       value={currentPage.chapterTitle || ''}
                       onChange={(e) => updateCurrentPage({ chapterTitle: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                       />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">챕터 서브타이틀</label>
                     <input 
                       type="text"
                       value={currentPage.chapterSubtitle || ''}
                       onChange={(e) => updateCurrentPage({ chapterSubtitle: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                     />
                   </div>
                 </>
               )}

               {(currentPage.type === 'sequence' || currentPage.type === 'header-body') && (
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] uppercase tracking-widest text-accent font-bold">페이지 제목</label>
                   <input 
                     type="text"
                     value={currentPage.title || ''}
                     onChange={(e) => updateCurrentPage({ title: e.target.value })}
                     className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                   />
                 </div>
               )}

               {(currentPage.type === 'sequence' || currentPage.type === 'body' || currentPage.type === 'header-body' || currentPage.type === 'quote') && (
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] uppercase tracking-widest text-accent font-bold">내용</label>
                   <textarea 
                     value={currentPage.content || ''}
                     onChange={(e) => updateCurrentPage({ content: e.target.value })}
                     className="w-full h-80 p-3 bg-canvas/30 border border-line rounded-sm text-sm leading-[1.8] focus:bg-white focus:border-ink transition-all resize-none outline-none"
                   />
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          {/* Sync Status Message */}
          {syncStatus !== 'idle' && (
            <div className={`p-3 rounded-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 ${
              syncStatus === 'success' ? 'bg-green-100 text-green-800' :
              syncStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <AlertCircle className="w-3 h-3" />
              {syncMessage}
            </div>
          )}

          <button 
            onClick={handleSaveToSheets}
            disabled={loading || !GAS_URL}
            className="w-full border border-line text-ink py-3 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-ink hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!GAS_URL ? "VITE_GAS_WEB_APP_URL not configured" : ""}
          >
            <Save className="w-3.5 h-3.5 mr-2 inline" />
            {loading ? 'Saving...' : 'Save to Sheets'}
          </button>
        </div>
      </aside>
      )}
      </div>
      )}
    </>
  );
}

/**
 * SinglePageComponent - 1쪽 보기 모드
 * 레이아웃: 스파인 공간 제외
 * 페이지 너비: 100 - 5(spine) = 95px
 * 최종 너비: 95 - 5(safe-left) - 5(safe-right) = 85
 */
function SinglePageComponent({ 
  page, 
  index, 
  width, 
  height, 
  theme,
  standard,
  chapterTitle
}: { 
  page: IPageData; 
  index: number; 
  width: number; 
  height: number; 
  theme: BookTheme;
  standard: BookStandard;
  chapterTitle: string;
}) {
  const sizes = getContentSizes(standard);
  const spineMarginPx = PRINT_BINDING_SPECS.spine * MM_TO_PX;
  const safeMarginPx = PRINT_BINDING_SPECS.safeMargin * MM_TO_PX;
  
  // 1쪽 모드에서는 스파인 공간을 제외한 너비
  const pageWidth = width - (spineMarginPx / 2);
 
  return (
    <div 
      style={{ 
        width: pageWidth,
        height: height,
        maxHeight: height,
        overflow: 'hidden',
      }}
      className={`bg-paper relative flex flex-col group overflow-hidden shrink-0 theme-${theme} print:shadow-none print:border-0`}
    >
      {/* 스크린에서만 보이는 그림자와 테두리 */}
      <div className="absolute inset-0 pointer-events-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] border border-line/40 print:shadow-none print:border-0" />
      
      {/* Content Area with SafeMargin (스파인 제외) - 강력한 overflow 처리 */}
      <div 
        className="flex-1 relative flex flex-col overflow-hidden h-full w-full"
        style={{ padding: `${safeMarginPx}px`, minWidth: 0, boxSizing: 'border-box' }}
      >
        <div className="flex-1 overflow-hidden w-full h-full" style={{ minWidth: 0 }}>
          <PageContent page={page} theme={theme} standard={standard} chapterTitle={chapterTitle} />
        </div>
      </div>
 
      {/* 페이지 번호 */}
      <div style={{ fontSize: sizes.pageNumber }} className="absolute bottom-8 right-12 font-mono font-bold text-accent/50 print:text-ink/30 print:bottom-4">
        {index + 1}
      </div>
    </div>
  );
}

/**
 * DoublePageComponent - 2쪽 보기 모드
 * 중앙에 명확한 스파인 divider 배치
 * 각 페이지: 100px | 중앙 spine: 15px | 각 페이지: 100px
 */
function DoublePageComponent({ 
  leftPage,
  rightPage,
  leftIndex,
  rightIndex,
  width, 
  height, 
  theme,
  standard,
  chapterTitle
}: { 
  leftPage: IPageData | undefined; 
  rightPage: IPageData | undefined;
  leftIndex: number;
  rightIndex: number;
  width: number; 
  height: number; 
  theme: BookTheme;
  standard: BookStandard;
  chapterTitle: string;
}) {
  const sizes = getContentSizes(standard);
  const spineMarginPx = PRINT_BINDING_SPECS.spine * MM_TO_PX;
  const safeMarginPx = PRINT_BINDING_SPECS.safeMargin * MM_TO_PX;

  const PageContent_Wrapper = ({ page, index }: { page: IPageData | undefined; index: number }) => {
    if (!page) return <div style={{ width: width - (spineMarginPx / 2), height: height }} className="bg-paper/50" />;
    
    return (
      <div 
        style={{ 
          width: width - (spineMarginPx / 2),
          height: height,
          maxHeight: height,
          overflow: 'hidden',
        }}
        className={`bg-paper relative flex flex-col group overflow-hidden shrink-0 theme-${theme}`}
      >
        {/* 스크린에서만 보이는 그림자와 테두리 */}
        <div className="absolute inset-0 pointer-events-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] border border-line/40" />
        
        {/* Content Area with SafeMargin (spine 제외) - 강력한 overflow 처리 */}
        <div 
          className="flex-1 relative flex flex-col overflow-hidden h-full w-full"
          style={{ padding: `${safeMarginPx}px`, minWidth: 0, boxSizing: 'border-box' }}
        >
          <div className="flex-1 overflow-hidden w-full h-full" style={{ minWidth: 0, boxSizing: 'border-box' }}>
            <PageContent page={page} theme={theme} standard={standard} chapterTitle={chapterTitle} />
          </div>
        </div>

        {/* 페이지 번호 */}
        <div style={{ fontSize: sizes.pageNumber }} className={`absolute bottom-8 font-mono font-bold text-accent/50 ${index % 2 === 0 ? 'left-12' : 'right-12'}`}>
          {index + 1}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-stretch gap-0 bg-line/10 border border-line/20 rounded shadow-2xl overflow-hidden" style={{ width: (width - (spineMarginPx / 2)) * 2 + spineMarginPx, height: height }}>
      {/* 좌측 페이지 */}
      <PageContent_Wrapper page={leftPage} index={leftIndex} />
      
      {/* 중앙 Spine Divider */}
      <div 
        className="flex-shrink-0 pointer-events-none h-full"
        style={{ width: `${spineMarginPx}px` }}
      >
        <div className="w-full h-full flex items-center justify-center print:invisible bg-blue-500/5 border-x border-blue-400/20">
          <span className="text-[8px] font-bold tracking-tighter text-blue-400/50 whitespace-nowrap print:hidden">
            SPINE
          </span>
        </div>
      </div>
      
      {/* 우측 페이지 */}
      <PageContent_Wrapper page={rightPage} index={rightIndex} />
    </div>
  );
}

/**
 * PrintComponent - 프린트 모드 (DoublePageComponent를 래핑)
 * 각 페이지에 Bleed를 추가함
 */
function PrintComponent({ 
  leftPage,
  rightPage,
  leftIndex,
  rightIndex,
  width, 
  height, 
  theme,
  standard,
  chapterTitle
}: { 
  leftPage: IPageData | undefined; 
  rightPage: IPageData | undefined;
  leftIndex: number;
  rightIndex: number;
  width: number; 
  height: number; 
  theme: BookTheme;
  standard: BookStandard;
  chapterTitle: string;
}) {
  const bleedPx = PRINT_BINDING_SPECS.bleed * MM_TO_PX;
  const totalWidth = width + bleedPx * 2;
  const totalHeight = height + bleedPx * 2;
  
  return (
    <div style={{ padding: `${bleedPx}px`, width: totalWidth * 2, height: totalHeight }}>
      <DoublePageComponent
        leftPage={leftPage}
        rightPage={rightPage}
        leftIndex={leftIndex}
        rightIndex={rightIndex}
        width={width}
        height={height}
        theme={theme}
        standard={standard}
        chapterTitle={chapterTitle}
      />
    </div>
  );
}

function PageContent({ page, theme, standard, chapterTitle }: { page: IPageData, theme: BookTheme, standard: BookStandard, chapterTitle: string }) {
  const sizes = getContentSizes(standard);
  const titleFont = theme === 'classic' ? 'font-serif' : theme === 'modern' ? 'font-sans font-black tracking-tighter' : theme === 'zen' ? 'font-serif tracking-tight' : 'font-sans font-bold';
  const bodyFont = theme === 'classic' ? 'font-serif' : theme === 'modern' ? 'font-sans' : theme === 'zen' ? 'font-serif' : 'font-serif leading-relaxed';
 
  // Running Header Helper
  const RunningHeader = () => {
    if (page.type === 'cover' || page.type === 'chapter' || page.type === 'body' || page.type === 'quote') return null;
    
    // Sequence와 Header-Body는 제목만 표시 (chapterTitle 미표시)
    if (page.type === 'sequence' || page.type === 'header-body') {
      return (
        <div style={{ fontSize: sizes.runningHeader }} className="flex items-center gap-4 py-1.5 border-b border-line/20 mb-10 uppercase tracking-[0.15em] font-sans font-bold text-accent/50">
           <span className="truncate max-w-[180px] text-left">{page.title || ''}</span>
        </div>
      );
    }
    
    return (
      <div style={{ fontSize: sizes.runningHeader }} className="flex items-center gap-4 py-1.5 border-b border-line/20 mb-10 uppercase tracking-[0.15em] font-sans font-bold text-accent/50">
         <span className="truncate max-w-[180px] text-left">{chapterTitle || ''}</span>
         <span className="w-[1px] h-2 bg-line/20" />
         <span className="truncate max-w-[180px] text-left">{page.title || ''}</span>
      </div>
    );
  };

  switch (page.type) {
    case 'sequence':
      return (
        <div style={{ padding: `${sizes.padSm}px`, maxHeight: '100%' }} className="flex-1 flex flex-col h-full overflow-hidden">
          <RunningHeader />
          <div className="space-y-4 flex-1 overflow-hidden">
             {page.content?.split('\n').filter(l => l.trim()).map((line, i) => {
               const parts = line.trim().split(' ');
               const pose = parts.length > 1 ? parts.pop() : '';
               const lyric = parts.join(' ');
               
               return (
                 <div key={i} className="flex items-center gap-6 group">
                   <div className="flex-1 border-b border-line/5 flex items-center">
                     <p style={{ fontSize: sizes.sequenceText, wordBreak: 'break-word' }} className={`leading-relaxed overflow-hidden ${bodyFont} ${theme === 'zen' ? 'text-accent' : 'text-ink/80'}`}>
                       {lyric}
                     </p>
                     <div className="flex-1 ml-4" />
                   </div>
                   <div className="w-32 text-right flex items-center justify-end">
                     <p style={{ fontSize: sizes.sequencePose, wordBreak: 'break-word' }} className={`font-bold uppercase tracking-widest overflow-hidden ${titleFont} text-ink/90`}>
                       {pose}
                     </p>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      );
    case 'cover':
      return (
        <div style={{ padding: `${sizes.padLg}px ${sizes.padSm}px`, maxHeight: '100%' }} data-page-content className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
           <div className={`w-16 h-[2px] bg-line/20 mb-12 ${theme === 'modern' ? 'bg-ink w-24 h-[4px]' : ''}`} />
           <h1 style={{ fontSize: theme === 'modern' ? sizes.coverTitleLarge : sizes.coverTitle, wordBreak: 'break-word' }} className={`font-bold tracking-tight leading-[1.1] mb-6 whitespace-pre-wrap overflow-hidden ${titleFont} ${theme === 'modern' ? 'uppercase' : 'text-ink'}`}>
             {page.title}
           </h1>
           <div className="w-8 h-[1px] bg-line/30 mb-6" />
           <p style={{ fontSize: sizes.coverSubtitle, wordBreak: 'break-word' }} className={`tracking-[0.3em] uppercase mb-20 max-w-[80%] mx-auto leading-relaxed font-sans overflow-hidden ${theme === 'modern' ? 'font-black text-ink bg-ink text-white px-4 py-1' : 'font-normal text-accent'}`}>
             {page.subtitle}
           </p>
           <div className="mt-auto pt-12 flex flex-col items-center">
             <span style={{ fontSize: sizes.authorLabel }} className="uppercase tracking-[0.4em] text-accent/40 mb-3 font-sans font-bold">Author</span>
             <p style={{ fontSize: sizes.authorName }} className={`tracking-[0.05em] font-sans font-bold ${theme === 'modern' ? 'uppercase underline underline-offset-4' : ''}`}>
               {page.author}
             </p>
           </div>
        </div>
      );
    case 'toc':
      return (
        <div style={{ padding: `${sizes.padLg}px ${sizes.padMd}px`, maxHeight: '100%' }} data-page-content className="flex-1 flex flex-col items-center h-full overflow-hidden">
          <div className="w-full max-w-[320px] overflow-hidden flex-1 flex flex-col">
            <div className="flex flex-col items-center mb-16">
              <span style={{ fontSize: sizes.tocLabel }} className="uppercase tracking-[0.5em] text-accent/40 font-bold mb-3">Index</span>
              <h2 style={{ fontSize: sizes.tocTitle }} className={`font-bold text-ink ${titleFont}`}>목차</h2>
              <div className="w-12 h-[1px] bg-ink mt-4" />
            </div>
            <div className="space-y-8">
              {(page.tocEntries && page.tocEntries.length > 0) ? (
                page.tocEntries.map((entry, i) => (
                  <div key={i} className="flex flex-col gap-1 group cursor-default">
                    <div className="flex items-baseline justify-between mb-1">
                      <span style={{ fontSize: sizes.tocChapter }} className="font-mono font-normal text-accent/60 tracking-widest uppercase">{entry.chapter}</span>
                      <span style={{ fontSize: sizes.tocPageNum }} className="font-mono font-normal text-accent/30 tracking-widest uppercase">P.{entry.pageNumber || String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-baseline gap-3 group">
                    <span style={{ fontSize: sizes.tocEntry, wordBreak: 'break-word' }} className={`font-medium group-hover:text-ink transition-colors uppercase tracking-[0.12em] text-ink/90 overflow-hidden ${bodyFont}`}>{entry.title}</span>
                      <div className="flex-1 border-b border-line/10" />
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      );
    case 'chapter':
      return (
        <div style={{ padding: sizes.padMd, maxHeight: '100%' }} data-page-content className="flex-1 flex flex-col items-center justify-center text-center h-full overflow-hidden relative">
           <div className="mb-12">
             <span style={{ fontSize: sizes.chapterLabel }} className="font-mono font-normal text-accent/50 tracking-[0.5em] uppercase block mb-6">Part</span>
             <h2 style={{ fontSize: sizes.chapterTitle, wordBreak: 'break-all' }} className={`font-bold mb-8 text-ink overflow-hidden ${titleFont}`}>{page.chapterTitle}</h2>
           </div>
           <h3 style={{ fontSize: sizes.chapterSubtitle, wordBreak: 'break-all' }} className={`italic font-normal text-accent tracking-tighter leading-normal max-w-[80%] mx-auto ${bodyFont}`}>
            {page.chapterSubtitle}
           </h3>
           {theme === 'modern' && (
             <div className="w-24 h-[6px] bg-ink mt-12" />
           )}
        </div>
      );
    case 'header-body':
      return (
        <div style={{ padding: `${sizes.padSm}px`, maxHeight: '100%' }} data-page-content className="flex-1 flex flex-col h-full overflow-hidden">
          <RunningHeader />
          <p style={{ fontSize: sizes.bodyText, wordBreak: 'break-word' }} className={`leading-relaxed font-normal text-ink/80 whitespace-pre-wrap flex-1 overflow-hidden ${bodyFont}`}>
            {page.content}
          </p>
        </div>
      );
    case 'quote':
      return (
        <div style={{ padding: `${sizes.padQuoteY}px ${sizes.padMd}px`, maxHeight: '100%' }} data-page-content className="flex-1 flex flex-col items-center justify-center text-center h-full overflow-hidden">
           <RunningHeader />
           <div style={{ fontSize: sizes.quoteText, wordBreak: 'break-word' }} className={`font-serif italic font-light text-ink/90 leading-[1.6] max-w-[90%] overflow-hidden ${titleFont}`}>
             "{page.content}"
           </div>
        </div>
      );
    case 'body':
    default:
      return (
        <div style={{ padding: `${sizes.padSm}px`, maxHeight: '100%' }} data-page-content className="flex-1 flex flex-col h-full overflow-hidden">
           <RunningHeader />
           <div className="flex-1 overflow-hidden">
           <p style={{ fontSize: sizes.bodyText, ['--drop-cap-size' as string]: `${sizes.firstLetter}px`, wordBreak: 'break-word' }} className={`leading-relaxed font-normal text-ink/80 whitespace-pre-wrap first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-ink overflow-hidden ${bodyFont} drop-cap`}>
               {page.content}
             </p>
           </div>
        </div>
      );
  }
}


