import { useState, useMemo, useCallback, useEffect } from 'react';
import { splitMarkdownContent } from '../utils/markdown/chunking';

export interface UseProgressiveContentOptions {
  content: string;
  chunkSize?: number;
  initialChunks?: number;
  loadMoreChunks?: number;
}

export interface UseProgressiveContentResult {
  chunks: string[];
  visibleChunks: number;
  loadMore: () => void;
  loadAll: () => void;
  hasMore: boolean;
  progress: number;
  totalChunks: number;
  isLoading: boolean;
}

/**
 * Hook for managing progressive content loading
 * Handles chunking, loading state, and progress tracking
 */
export function useProgressiveContent(
  options: UseProgressiveContentOptions
): UseProgressiveContentResult {
  const {
    content,
    chunkSize = 5000,
    initialChunks = 2,
    loadMoreChunks = 1,
  } = options;

  const [visibleChunks, setVisibleChunks] = useState(initialChunks);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize chunks to avoid re-splitting on every render
  const chunks = useMemo(
    () => splitMarkdownContent(content, { chunkSize }),
    [content, chunkSize]
  );

  const totalChunks = chunks.length;
  const hasMore = visibleChunks < totalChunks;
  const progress = totalChunks > 0 ? visibleChunks / totalChunks : 1;

  // Reset visible chunks and loading state when content changes
  useEffect(() => {
    setVisibleChunks(initialChunks);
    setIsLoading(false);
  }, [content, initialChunks]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    // Simulate async loading for smooth UX
    requestAnimationFrame(() => {
      setVisibleChunks((prev) =>
        Math.min(prev + loadMoreChunks, totalChunks)
      );
      setIsLoading(false);
    });
  }, [hasMore, isLoading, loadMoreChunks, totalChunks]);

  const loadAll = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    requestAnimationFrame(() => {
      setVisibleChunks(totalChunks);
      setIsLoading(false);
    });
  }, [hasMore, isLoading, totalChunks]);

  return {
    chunks,
    visibleChunks,
    loadMore,
    loadAll,
    hasMore,
    progress,
    totalChunks,
    isLoading,
  };
}
