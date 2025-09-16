import React, { useEffect, useRef, memo } from 'react';
import { Box } from '@mui/material';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChunkSkeleton } from './ChunkSkeleton';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useProgressiveContent } from '../../hooks/useProgressiveContent';

interface ProgressiveMarkdownRendererProps {
  content: string;
  chunkSize?: number;
  initialChunks?: number;
  autoLoadAll?: boolean;
  onRenderComplete?: () => void;
}

/**
 * Progressive markdown renderer for large content
 * Loads content in chunks as user scrolls for better performance
 */
export const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownRendererProps> = memo(({
  content,
  chunkSize = 5000,
  initialChunks = 2,
  autoLoadAll = false,
  onRenderComplete,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const intersection = useIntersectionObserver<HTMLDivElement>(sentinelRef, {
    rootMargin: '200px', // Start loading before reaching the bottom
  });

  const {
    chunks,
    visibleChunks,
    loadMore,
    hasMore,
    isLoading,
  } = useProgressiveContent({
    content,
    chunkSize,
    initialChunks,
    loadMoreChunks: 1,
  });

  // Auto-load more when sentinel is visible (scroll-triggered)
  useEffect(() => {
    if (!autoLoadAll && intersection?.isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [autoLoadAll, intersection?.isIntersecting, hasMore, isLoading, loadMore]);

  // Auto-load all chunks when autoLoadAll is enabled
  useEffect(() => {
    if (autoLoadAll && hasMore && !isLoading) {
      // Small delay to not block initial render
      const timer = setTimeout(() => {
        loadMore();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoLoadAll, hasMore, isLoading, loadMore, visibleChunks]);

  // Notify when rendering is complete
  useEffect(() => {
    if (!hasMore && onRenderComplete) {
      onRenderComplete();
    }
  }, [hasMore, onRenderComplete]);

  return (
    <Box>
      {/* Render visible chunks */}
      {chunks.slice(0, visibleChunks).map((chunk, index) => (
        <Box
          key={index}
          sx={{
            animation: 'fadeIn 0.3s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          <MarkdownRenderer content={chunk} />

          {/* Add subtle separator between chunks except for the last visible one */}
          {index < visibleChunks - 1 && (
            <Box
              sx={{
                my: 2,
                height: 1,
                background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.05) 50%, transparent)',
              }}
            />
          )}
        </Box>
      ))}

      {/* Loading indicator and sentinel */}
      {hasMore && (
        <>
          <ChunkSkeleton lines={3} />
          <div
            ref={sentinelRef}
            style={{
              height: 1,
              marginTop: -100, // Trigger loading earlier
            }}
          />
        </>
      )}
    </Box>
  );
});

ProgressiveMarkdownRenderer.displayName = 'ProgressiveMarkdownRenderer';
