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
  Upload,
  AlertCircle
} from 'lucide-react';
import { BOOK_STANDARDS, BookStandard, PageData, PageType, PageData as IPageData, BookTheme, BookProject } from './types.ts';
import { useEbookSheet } from './hooks/useEbookSheet';

const MM_TO_PX = 3.5; // Visual scale factor

const DEFAULT_PAGE: IPageData = {
  id: '1',
  type: 'cover',
  title: '빈야사 플로우: 새벽의 요가',
  subtitle: '팝송과 움직임의 완벽한 조화',
  author: '요가 안내자',
  content: '',
};

export default function App() {
  const gasWebAppUrl = import.meta.env.VITE_GAS_WEB_APP_URL || '';
  const { load, savePage, updatePage, deletePage, saveMetadata, loading, error } = useEbookSheet(gasWebAppUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spreadMode, setSpreadMode] = useState(true);
  const [zoom, setZoom] = useState(0.7);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Initialize with default project
  const [project, setProject] = useState<BookProject>({
    title: '빈야사 플로우: 새벽의 요가',
    theme: 'classic',
    standard: 'A5',
    bindingMargin: 5,
    pages: [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'cover',
      title: '빈야사 플로우: 새벽의 요가',
      subtitle: '팝송과 움직임의 완벽한 조화',
      author: '요가 안내자',
      content: '',
    }],
  });

  const currentPage = project.pages[currentIndex];
  const standardInfo = BOOK_STANDARDS[project.standard];

  // Helper to add a new page
  const addPage = (type: PageType = 'body') => {
    const newPage: PageData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: '',
      chapterTitle: type === 'chapter' ? `CHAPTER ${project.pages.filter(p => p.type === 'chapter').length + 1}` : '',
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

  // Load from Google Sheets
  const handleLoadFromSheets = async () => {
    try {
      setSyncStatus('loading');
      setSyncMessage('Google Sheets에서 불러오는 중...');
      const loadedProject = await load();
      setProject(loadedProject);
      setCurrentIndex(0);
      setSyncStatus('success');
      setSyncMessage('Google Sheets에서 로드 완료!');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : 'Load failed');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Save to Google Sheets
  const handleSaveToSheets = async () => {
    try {
      setSyncStatus('loading');
      setSyncMessage('Google Sheets에 저장 중...');
      
      // Save metadata
      await saveMetadata({
        title: project.title,
        theme: project.theme,
        standard: project.standard,
        bindingMargin: project.bindingMargin,
      });

      // Save all pages
      for (const page of project.pages) {
        await savePage(page);
      }

      setSyncStatus('success');
      setSyncMessage('Google Sheets에 저장 완료!');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : 'Save failed');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Preview dimensions
  const previewWidth = standardInfo.width * MM_TO_PX;
  const previewHeight = standardInfo.height * MM_TO_PX;
  const marginPx = project.bindingMargin * MM_TO_PX;

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

  return (
    <div className="flex h-screen bg-canvas overflow-hidden font-sans">
      {/* Sidebar: Navigation & Controls */}
      <aside className="w-80 bg-white border-r border-line flex flex-col z-10 transition-all duration-300">
        <div className="p-6 border-b border-line/50">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-2 block">Standard</label>
                <select 
                  value={project.standard}
                  onChange={(e) => setProject({ ...project, standard: e.target.value as BookStandard })}
                  className="w-full px-3 py-2 bg-canvas/30 border-b border-line text-sm focus:outline-none cursor-pointer hover:border-ink transition-colors"
                >
                  {Object.keys(BOOK_STANDARDS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-2 block">Binding Gutter</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={project.bindingMargin}
                    onChange={(e) => setProject({ ...project, bindingMargin: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-canvas/30 border-b border-line text-sm focus:outline-none hover:border-ink transition-colors"
                  />
                  <span className="text-[10px] text-accent">mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
          {project.pages.map((page, idx) => (
            <div
              key={page.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full flex items-center gap-3 p-3 rounded-sm text-left transition-all group border cursor-pointer ${
                idx === currentIndex ? 'bg-ink text-white border-ink shadow-lg' : 'hover:bg-neutral-50 text-ink border-transparent hover:border-line'
              }`}
            >
              <span className={`text-[10px] font-mono w-4 ${idx === currentIndex ? 'text-accent' : 'text-line'}`}>
                {(idx + 1).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 truncate">
                <p className="text-xs font-semibold truncate uppercase tracking-tight">{page.title || (page.type === 'cover' ? 'Book Cover' : 'Untitled')}</p>
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
                    className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
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
           <button className="w-full bg-ink text-white py-3 rounded-sm flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-all shadow-sm">
             <Download className="w-3.5 h-3.5" />
             Print Preview
           </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-canvas">
        <header className="h-16 border-b border-line bg-white flex items-center justify-between px-8 z-10 shrink-0 gap-4">
          <div className="flex items-center gap-8 flex-1 overflow-hidden">
             <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
                {[
                  { type: 'cover' as PageType, label: '표지' },
                  { type: 'toc' as PageType, label: '목차' },
                  { type: 'chapter' as PageType, label: '챕터' },
                  { type: 'sequence' as PageType, label: '시퀀스' },
                  { type: 'header-body' as PageType, label: '제목/본문' },
                  { type: 'body' as PageType, label: '본문' },
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
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="p-2 border border-line rounded-sm hover:bg-canvas disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold text-accent px-4 border-x border-line">
              {currentIndex + 1} / {project.pages.length}
            </span>
            <button 
              disabled={currentIndex === project.pages.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="p-2 border border-line rounded-sm hover:bg-canvas disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

        <div className="flex-1 flex items-center justify-center p-16 overflow-auto relative">
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
              {/* If spread mode is on, we figure out which pages to show */}
              {spreadMode ? (
                <div 
                  className="flex items-center gap-0 bg-line/10 border border-line/20 rounded shadow-2xl overflow-hidden"
                  style={{ width: previewWidth * 2 }}
                >
                  {(() => {
                    const leftIdx = Math.floor(currentIndex / 2) * 2;
                    const rightIdx = leftIdx + 1;
                    
                    return (
                      <>
                        <SinglePage 
                          page={project.pages[leftIdx]} 
                          index={leftIdx}
                          isLeft={true}
                          width={previewWidth}
                          height={previewHeight}
                          bindingMargin={project.bindingMargin}
                          theme={project.theme}
                          chapterTitle={getChapterTitle(leftIdx)}
                        />
                        {rightIdx < project.pages.length ? (
                          <SinglePage 
                            page={project.pages[rightIdx]} 
                            index={rightIdx}
                            isLeft={false}
                            width={previewWidth}
                            height={previewHeight}
                            bindingMargin={project.bindingMargin}
                            theme={project.theme}
                            chapterTitle={getChapterTitle(rightIdx)}
                          />
                        ) : (
                          // Placeholder for empty right page in spread
                          <div 
                            style={{ 
                              width: previewWidth, 
                              height: previewHeight,
                            }}
                            className="bg-canvas border-l border-line/20 relative"
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-[9px] uppercase tracking-widest text-accent font-bold opacity-20">Blank Page</div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <SinglePage 
                  page={currentPage} 
                  index={currentIndex}
                  isLeft={isLeftPage}
                  width={previewWidth}
                  height={previewHeight}
                  bindingMargin={project.bindingMargin}
                  theme={project.theme}
                  chapterTitle={getChapterTitle(currentIndex)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-line rounded-full px-4 py-2 flex items-center gap-4 shadow-xl z-20 transition-all hover:bg-white">
             <button 
              onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
              className="p-1.5 hover:bg-canvas rounded-full transition-colors text-accent hover:text-ink"
              title="Zoom Out"
             >
                <ZoomOut className="w-4 h-4" />
             </button>
             <div className="w-12 text-center text-[10px] font-mono font-bold text-accent select-none">
                {Math.round(zoom * 100)}%
             </div>
             <button 
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
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
        </div>
      </main>

      {/* Editor Panel (Right Side) */}
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
                       placeholder="책 제목을 입력하세요"
                     />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">서브타이틀</label>
                     <input 
                       type="text"
                       value={currentPage.subtitle || ''}
                       onChange={(e) => updateCurrentPage({ subtitle: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                       placeholder="서브타이틀 또는 설명"
                     />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">저자명</label>
                     <input 
                       type="text"
                       value={currentPage.author || ''}
                       onChange={(e) => updateCurrentPage({ author: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                       placeholder="저자 이름"
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
                       placeholder="CHAPTER 01"
                     />
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] uppercase tracking-widest text-accent font-bold">챕터 서브타이틀</label>
                     <input 
                       type="text"
                       value={currentPage.chapterSubtitle || ''}
                       onChange={(e) => updateCurrentPage({ chapterSubtitle: e.target.value })}
                       className="w-full bg-canvas/30 p-3 border-b border-line focus:border-ink outline-none text-sm transition-all"
                       placeholder="챕터의 부제를 입력하세요"
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
                     placeholder="제목을 입력하세요"
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
                     placeholder={currentPage.type === 'sequence' ? "가사 동작\n예: Hold my heart 우르드바하스타" : "내용을 입력하세요..."}
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
            disabled={loading || !gasWebAppUrl}
            className="w-full border border-line text-ink py-3 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-ink hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!gasWebAppUrl ? "VITE_GAS_WEB_APP_URL not configured" : ""}
          >
            <Save className="w-3.5 h-3.5 mr-2 inline" />
            {loading ? 'Saving...' : 'Save to Sheets'}
          </button>

          <button 
            onClick={handleLoadFromSheets}
            disabled={loading || !gasWebAppUrl}
            className="w-full border border-line text-ink py-3 rounded-sm text-[10px] uppercase tracking-widest font-bold hover:bg-ink hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!gasWebAppUrl ? "VITE_GAS_WEB_APP_URL not configured" : ""}
          >
            <Upload className="w-3.5 h-3.5 mr-2 inline" />
            {loading ? 'Loading...' : 'Load from Sheets'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function SinglePage({ 
  page, 
  index, 
  isLeft, 
  width, 
  height, 
  bindingMargin,
  theme,
  chapterTitle
}: { 
  page: IPageData; 
  index: number; 
  isLeft: boolean; 
  width: number; 
  height: number; 
  bindingMargin: number;
  theme: BookTheme;
  chapterTitle: string;
}) {
  const marginPx = bindingMargin * MM_TO_PX;
  const paddingLeft = !isLeft ? `${marginPx + 24}px` : '24px';
  const paddingRight = isLeft ? `${marginPx + 24}px` : '24px';
 
  return (
    <div 
      style={{ 
        width, 
        height,
        paddingLeft,
        paddingRight,
      }}
      className={`bg-paper shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] relative flex flex-col group overflow-hidden border border-line/40 shrink-0 theme-${theme}`}
    >
      {/* Visual Guide: Binding Edge (gradient + labels) */}
      <div 
        className={`absolute top-0 bottom-0 w-10 pointer-events-none z-10 flex items-center justify-center overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100 ${
          isLeft 
            ? 'right-0 bg-blue-500/5 border-l border-dashed border-blue-400/20' 
            : 'left-0 bg-blue-500/5 border-r border-dashed border-blue-400/20'
        }`} 
      >
          <span className={`text-[8px] font-bold tracking-tighter text-blue-400/50 whitespace-nowrap ${isLeft ? '-rotate-90' : 'rotate-90'}`}>
            BINDING GUTTER {bindingMargin}mm
          </span>
      </div>
      
      <PageContent page={page} theme={theme} chapterTitle={chapterTitle} />
 
      <div className={`absolute bottom-8 text-[9px] font-mono font-bold text-accent/50 ${isLeft ? 'left-12' : 'right-12'}`}>
        {index + 1}
      </div>
    </div>
  );
}
 
function PageContent({ page, theme, chapterTitle }: { page: IPageData, theme: BookTheme, chapterTitle: string }) {
  const titleFont = theme === 'classic' ? 'font-serif' : theme === 'modern' ? 'font-sans font-black tracking-tighter' : theme === 'zen' ? 'font-serif tracking-tight' : 'font-sans font-bold';
  const bodyFont = theme === 'classic' ? 'font-serif' : theme === 'modern' ? 'font-sans' : theme === 'zen' ? 'font-serif' : 'font-serif leading-relaxed';
 
  // Running Header Helper
  const RunningHeader = () => {
    if (page.type === 'cover' || page.type === 'chapter') return null;
    
    return (
      <div className="flex items-center gap-4 py-1.5 border-b border-line/20 mb-10 text-[8px] uppercase tracking-[0.15em] font-bold text-accent/50">
         <span className="truncate max-w-[180px] text-left">{chapterTitle || ''}</span>
         <span className="w-[1px] h-2 bg-line/20" />
         <span className="truncate max-w-[180px] text-left">{page.title || ''}</span>
      </div>
    );
  };

  switch (page.type) {
    case 'sequence':
      return (
        <div className="flex-1 px-12 py-12 flex flex-col h-full">
          <RunningHeader />
          <div className="space-y-4 flex-1">
             {page.content?.split('\n').filter(l => l.trim()).map((line, i) => {
               const parts = line.trim().split(' ');
               const pose = parts.length > 1 ? parts.pop() : '';
               const lyric = parts.join(' ');
               
               return (
                 <div key={i} className="flex items-end gap-6 group">
                   <div className="flex-1 border-b border-line/5 pb-2 flex items-baseline">
                     <p className={`text-[13px] leading-relaxed ${bodyFont} ${theme === 'zen' ? 'text-accent' : 'text-ink/80'}`}>
                       {lyric}
                     </p>
                     <div className="flex-1 ml-4 border-b border-dotted border-line/10" />
                   </div>
                   <div className="w-32 text-right">
                     <p className={`text-[11px] font-bold uppercase tracking-widest ${titleFont} text-ink/90`}>
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
        <div className="flex-1 flex flex-col items-center justify-center text-center px-12 py-24 relative overflow-hidden h-full">
           <div className={`w-16 h-[2px] bg-line/20 mb-12 ${theme === 'modern' ? 'bg-ink w-24 h-[4px]' : ''}`} />
           <h1 className={`text-4xl font-bold tracking-tight leading-[1.1] mb-6 whitespace-pre-wrap ${titleFont} ${theme === 'modern' ? 'text-6xl uppercase' : 'text-ink'}`}>
             {page.title || 'Your Book Title'}
           </h1>
           <div className="w-8 h-[1px] bg-line/30 mb-6" />
           <p className={`text-[11px] tracking-[0.3em] uppercase mb-20 max-w-[80%] mx-auto leading-relaxed ${theme === 'modern' ? 'font-sans font-black text-ink bg-ink text-white px-4 py-1' : 'font-sans text-accent'}`}>
             {page.subtitle || 'A subtitle or short description'}
           </p>
           <div className="mt-auto pt-12 flex flex-col items-center">
             <span className="text-[10px] uppercase tracking-[0.4em] text-accent/40 mb-3 font-bold">Author</span>
             <p className={`text-sm tracking-[0.05em] ${theme === 'modern' ? 'font-sans font-bold uppercase underline underline-offset-4' : 'font-serif text-ink'}`}>
               {page.author || 'Author Name'}
             </p>
           </div>
        </div>
      );
    case 'toc':
      return (
        <div className="flex-1 px-16 py-24 flex flex-col items-center h-full">
          <div className="w-full max-w-[320px]">
            <div className="flex flex-col items-center mb-16">
              <span className="text-[9px] uppercase tracking-[0.5em] text-accent/40 font-bold mb-3">Index</span>
              <h2 className={`text-3xl font-bold text-ink ${titleFont}`}>목차</h2>
              <div className="w-12 h-[1px] bg-ink mt-4" />
            </div>
            <div className="space-y-8">
              {(page.tocEntries && page.tocEntries.length > 0) ? page.tocEntries.map((entry, i) => (
                <div key={i} className="flex flex-col gap-1 group cursor-default">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[9px] font-mono text-accent/60 tracking-widest uppercase">{entry.chapter}</span>
                    <span className="text-[10px] font-mono text-accent/30 tracking-widest uppercase">P.{entry.pageNumber || String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-baseline gap-3 group">
                    <span className={`text-[13px] font-medium group-hover:text-ink transition-colors uppercase tracking-[0.12em] text-ink/90 ${bodyFont}`}>{entry.title || 'Untitled Section'}</span>
                    <div className="flex-1 border-b border-line/10" />
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center border border-dashed border-line/20 rounded">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent/30 font-bold">Contents is currently empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    case 'chapter':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center h-full relative">
           <div className="mb-12">
             <span className="text-[11px] font-mono text-accent/50 tracking-[0.5em] uppercase block mb-6">Part</span>
             <h2 className={`text-5xl font-bold mb-8 text-ink ${titleFont}`}>{page.chapterTitle || 'Chapter 01'}</h2>
           </div>
           <h3 className={`text-xl italic text-accent tracking-tighter leading-normal max-w-[80%] mx-auto ${bodyFont}`}>
            {page.chapterSubtitle || 'Chapter Subtitle'}
           </h3>
           {theme === 'modern' && (
             <div className="w-24 h-[6px] bg-ink mt-12" />
           )}
        </div>
      );
    case 'header-body':
      return (
        <div className="flex-1 px-12 py-12 flex flex-col h-full">
          <RunningHeader />
          <p className={`text-[14px] leading-relaxed text-ink/80 whitespace-pre-wrap flex-1 ${bodyFont}`}>
            {page.content || '본문 내용을 입력하세요.'}
          </p>
        </div>
      );
    case 'quote':
      return (
        <div className="flex-1 px-16 py-20 flex flex-col items-center justify-center text-center h-full">
           <RunningHeader />
           <div className={`text-3xl font-serif italic text-ink/90 leading-[1.6] max-w-[90%] font-light ${titleFont}`}>
             “{page.content || '인용할 내용을 입력하세요.'}”
           </div>
        </div>
      );
    case 'body':
    default:
      return (
        <div className="flex-1 px-12 py-12 flex flex-col h-full">
           <RunningHeader />
           <div className="flex-1">
             <p className={`text-[14px] leading-relaxed text-ink/80 whitespace-pre-wrap first-letter:text-4xl first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-ink ${bodyFont}`}>
               {page.content || '본문 내용을 입력하세요.'}
             </p>
           </div>
        </div>
      );
  }
}


