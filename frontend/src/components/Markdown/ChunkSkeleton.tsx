import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

interface ChunkSkeletonProps {
  lines?: number;
}

/**
 * Loading skeleton for markdown chunks
 * Mimics the appearance of markdown content
 */
export const ChunkSkeleton: React.FC<ChunkSkeletonProps> = ({ lines = 4 }) => {
  return (
    <Box sx={{ py: 2, opacity: 0.7 }}>
      <Stack spacing={1}>
        {/* Heading skeleton */}
        <Skeleton
          variant="text"
          width="40%"
          height={28}
          sx={{ mb: 1 }}
        />

        {/* Content lines */}
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={
              index === lines - 1
                ? '75%'  // Last line shorter
                : '100%'
            }
            height={20}
          />
        ))}
      </Stack>
    </Box>
  );
};
