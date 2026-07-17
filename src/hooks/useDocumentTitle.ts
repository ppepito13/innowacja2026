import { useEffect } from 'react';

export const DEFAULT_TITLE = 'Commerzbank Events';

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
