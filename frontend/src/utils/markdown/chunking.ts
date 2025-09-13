/**
 * Utilities for splitting markdown content into chunks for progressive rendering
 */

export interface ChunkOptions {
  chunkSize?: number;
  overlapSize?: number;
  respectBoundaries?: boolean;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  chunkSize: 5000,
  overlapSize: 100,
  respectBoundaries: true,
};

/**
 * Split markdown content into chunks while respecting markdown structure
 * Avoids splitting in the middle of code blocks, lists, or paragraphs
 */
export function splitMarkdownContent(
  content: string,
  options: ChunkOptions = {}
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!content || content.length <= opts.chunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < content.length) {
    let chunkEnd = currentPosition + opts.chunkSize;

    // If we're at the end, take everything
    if (chunkEnd >= content.length) {
      chunks.push(content.slice(currentPosition));
      break;
    }

    if (opts.respectBoundaries) {
      // Try to find a good break point
      const searchStart = Math.max(currentPosition, chunkEnd - opts.overlapSize);
      const searchEnd = Math.min(content.length, chunkEnd + opts.overlapSize);
      const searchText = content.slice(searchStart, searchEnd);

      // Priority order for break points:
      // 1. Double newline (paragraph break)
      // 2. Single newline after a sentence
      // 3. Single newline
      // 4. End of sentence
      // 5. Space

      const breakPoints = [
        { pattern: /\n\n/g, offset: 2 },
        { pattern: /\.\n/g, offset: 2 },
        { pattern: /\n/g, offset: 1 },
        { pattern: /\. /g, offset: 2 },
        { pattern: / /g, offset: 1 },
      ];

      let bestBreak = -1;
      for (const { pattern, offset } of breakPoints) {
        const matches = Array.from(searchText.matchAll(pattern));
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          if (lastMatch.index !== undefined) {
            bestBreak = searchStart + lastMatch.index + offset;
            break;
          }
        }
      }

      if (bestBreak > currentPosition) {
        chunkEnd = bestBreak;
      }

      // Check if we're in the middle of a code block
      const beforeChunk = content.slice(0, chunkEnd);
      const codeBlockCount = (beforeChunk.match(/```/g) || []).length;

      // If odd number of code blocks, we're inside one - find the closing ```
      if (codeBlockCount % 2 === 1) {
        const closeIndex = content.indexOf('```', chunkEnd);
        if (closeIndex !== -1 && closeIndex - currentPosition < opts.chunkSize * 1.5) {
          chunkEnd = closeIndex + 3;
        }
      }
    }

    chunks.push(content.slice(currentPosition, chunkEnd));
    currentPosition = chunkEnd;
  }

  return chunks;
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get a preview of content size and complexity
 */
export function analyzeContent(content: string): {
  length: number;
  wordCount: number;
  codeBlockCount: number;
  headingCount: number;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
} {
  const wordCount = content.trim().split(/\s+/).length;
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  const headingCount = (content.match(/^#{1,6}\s/gm) || []).length;

  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (content.length > 50000 || codeBlockCount > 10) {
    complexity = 'complex';
  } else if (content.length > 10000 || codeBlockCount > 3) {
    complexity = 'moderate';
  }

  return {
    length: content.length,
    wordCount,
    codeBlockCount: Math.floor(codeBlockCount),
    headingCount,
    estimatedComplexity: complexity,
  };
}