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
}

export function useEbookSheet(gasWebAppUrl: string): UseEbookSheetReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<BookProject> => {
    if (!gasWebAppUrl) {
      throw new Error('GAS_WEB_APP_URL is not configured');
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
      setError(errorMsg);
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
          headers: {
            'Content-Type': 'application/json',
          },
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
          headers: {
            'Content-Type': 'application/json',
          },
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
          headers: {
            'Content-Type': 'application/json',
          },
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
          headers: {
            'Content-Type': 'application/json',
          },
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

  return {
    loading,
    error,
    load,
    savePage,
    updatePage,
    deletePage,
    saveMetadata,
  };
}
