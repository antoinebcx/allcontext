import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { FileText, Eye } from 'lucide-react';
import { MarkdownRenderer } from '../../Markdown/MarkdownRenderer';
import { ProgressiveMarkdownRenderer } from '../../Markdown/ProgressiveMarkdownRenderer';

interface ArtifactEditorProps {
  content: string;
  activeTab: 'write' | 'preview';
  onChange: (value: string) => void;
  onTabChange: (tab: 'write' | 'preview') => void;
}

export const ArtifactEditor: React.FC<ArtifactEditorProps> = ({
  content,
  activeTab,
  onChange,
  onTabChange,
}) => {
  return (
    <>
      {/* Tabs */}
      <Box sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => onTabChange(value)}
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': {
              height: 2,
            },
          }}
        >
          <Tab
            label="Write"
            value="write"
            icon={<FileText size={14} />}
            iconPosition="start"
            sx={{
              minHeight: 36,
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 2,
            }}
          />
          <Tab
            label="Preview"
            value="preview"
            icon={<Eye size={14} />}
            iconPosition="start"
            sx={{
              minHeight: 36,
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 2,
            }}
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          height: 'calc(100% - 93px)',
          display: 'flex',
          backgroundColor: 'background.default',
        }}
      >
        {activeTab === 'write' ? (
          <TextField
            multiline
            fullWidth
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start writing your artifact..."
            sx={{
              p: 2,
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'flex-start',
                p: 2,
                fontSize: '0.95rem',
                lineHeight: 1.6,
              },
              '& fieldset': {
                border: 'none',
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflowY: 'auto !important',
              },
            }}
          />
        ) : (
          <Box
            sx={{
              p: 3,
              flexGrow: 1,
              overflowY: 'auto',
            }}
          >
            {content ? (
              content.length > 10000 ? (
                <ProgressiveMarkdownRenderer
                  content={content}
                  chunkSize={5000}
                  initialChunks={2}
                />
              ) : (
                <MarkdownRenderer content={content} />
              )
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Nothing to preview
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );
};
