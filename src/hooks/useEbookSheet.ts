import { useState, useCallback } from 'react';
import { PageData, BookProject } from '../types';

interface UseEbookSheetReturn {
  loading: boolean;
  error: string | null;
  load: () => Promise<BookProject>;
  savePage: (pageData: PageData) => Promise<void>;
  updatePage: (rowIndex: number, pageData: PageData) => Promise<void>;
  deletePage: (rowIndex: number, pageType: PageData['type']) => Promise<void>;
  saveMetadata: (metadata: Omit<BookProject, 'pages'>) => Promise<void>;
  syncAll: (project: BookProject) => Promise<void>;
}

export function useEbookSheet(gasWebAppUrl: string): UseEbookSheetReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<BookProject> => {
    if (!gasWebAppUrl) {
      const errorMsg = '❌ GAS Web App URL이 설정되지 않았습니다.\n constants.ts에서 VITE_GAS_WEB_APP_URL을 확인하세요.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(gasWebAppUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to load data');
      }

      return {
        title: result.metadata.title || '',
        theme: result.metadata.theme || 'classic',
        standard: result.metadata.standard || 'A5',
        bindingMargin: result.metadata.bindingMargin || 5,
        pages: result.pages || [],
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      let displayMsg = errorMsg;
      
      if (errorMsg.includes('CORS')) {
        displayMsg = `❌ CORS 정책으로 차단되었습니다.\n\n원인: Google Apps Script의 배포 설정이 잘못되었을 수 있습니다.\n\n해결 방법:\n1. Google Sheet의 우상단 "⋮" → "Apps Script" 클릭\n2. "배포" → "새 배포" 클릭\n3. 배포 설정 확인:\n   - 실행: 본인\n   - 액세스: 모든 사람\n4. 새로운 배포 URL 복사\n5. constants.ts의 GAS_URL 업데이트`;
      } else if (errorMsg.includes('Failed to fetch')) {
        displayMsg = `❌ GAS Web App에 연결할 수 없습니다.\n\n원인: 잘못된 URL이거나 배포되지 않았을 수 있습니다.\n\n해결 방법:\n1. GAS_URL이 올바른지 확인하세요\n2. 배포되었는지 확인하세요\n3. 네트워크 연결을 확인하세요`;
      }
      
      setError(displayMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gasWebAppUrl]);

  const savePage = useCallback(
    async (pageData: PageData) => {
      if (!gasWebAppUrl) {
        throw new Error('GAS_WEB_APP_URL is not configured');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(gasWebAppUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'save',
            pageType: pageData.type,
            data: pageData,
          }),
        });

        const result = await response.json();

        if (result.status !== 'success') {
          throw new Error(result.message || 'Failed to save page');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gasWebAppUrl]
  );

  const updatePage = useCallback(
    async (rowIndex: number, pageData: PageData) => {
      if (!gasWebAppUrl) {
        throw new Error('GAS_WEB_APP_URL is not configured');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(gasWebAppUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'update',
            pageType: pageData.type,
            rowIndex: rowIndex,
            data: pageData,
          }),
        });

        const result = await response.json();

        if (result.status !== 'success') {
          throw new Error(result.message || 'Failed to update page');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gasWebAppUrl]
  );

  const deletePage = useCallback(
    async (rowIndex: number, pageType: PageData['type']) => {
      if (!gasWebAppUrl) {
        throw new Error('GAS_WEB_APP_URL is not configured');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(gasWebAppUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'delete',
            pageType: pageType,
            rowIndex: rowIndex,
          }),
        });

        const result = await response.json();

        if (result.status !== 'success') {
          throw new Error(result.message || 'Failed to delete page');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gasWebAppUrl]
  );

  const saveMetadata = useCallback(
    async (metadata: Omit<BookProject, 'pages'>) => {
      if (!gasWebAppUrl) {
        throw new Error('GAS_WEB_APP_URL is not configured');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(gasWebAppUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateMetadata',
            data: metadata,
          }),
        });

        const result = await response.json();

        if (result.status !== 'success') {
          throw new Error(result.message || 'Failed to save metadata');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gasWebAppUrl]
  );

  const syncAll = useCallback(
    async (project: BookProject) => {
      if (!gasWebAppUrl) {
        throw new Error('GAS_WEB_APP_URL is not configured');
      }

      try {
        const response = await fetch(gasWebAppUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'syncAll',
            data: {
              metadata: {
                title: project.title,
                theme: project.theme,
                standard: project.standard,
                bindingMargin: project.bindingMargin,
              },
              pages: project.pages,
            },
          }),
        });

        const result = await response.json();

        if (result.status !== 'success') {
          throw new Error(result.message || 'Failed to sync');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        throw err;
      }
    },
    [gasWebAppUrl]
  );

  return {
    loading,
    error,
    load,
    savePage,
    updatePage,
    deletePage,
    saveMetadata,
    syncAll,
  };
}
