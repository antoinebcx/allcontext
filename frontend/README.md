# Allcontext Frontend

A minimal, elegant React application for managing markdown-based AI artifacts (prompts and documents).

## Stack

- **React 18** with TypeScript
- **Vite** - Build tool
- **Material-UI (MUI) v5** - Component library
- **Lucide React** - Icons
- **React Query (TanStack Query)** - Data fetching & caching
- **React Router** - SPA routing
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code highlighting
- **Axios** - HTTP client
- **Supabase Client** - Authentication & session management
- **date-fns** - Date formatting

## Features

- ✨ **Markdown-first** - Full markdown editor with live preview
- 🚀 **Auto-title** - Titles extracted from markdown headings automatically
- 📝 **Unified artifacts** - Everything is just an artifact
- 🔍 **Search** - Centered search bar with debounced filtering
- 💾 **CRUD Operations** - Create, read, update, delete
- 📋 **Copy & Download** - Export artifacts as markdown
- 🎨 **Clean UI** - Minimal design with persistent navbar
- ⚡ **Fast** - Optimistic updates with React Query
- 🔐 **Authentication** - Email/password with automatic user detection
- 👤 **User Management** - Profile menu with logout
- 📊 **Progressive Rendering** - Large documents load in chunks for better performance
- 🎯 **Demo Mode** - Explore app with demo content before signing up
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- 🌓 **Dark Mode** - System-aware theme with manual override
- 📚 **Documentation** - In-app docs viewer with MCP/API reference
- 📋 **Code Copy** - Copy buttons on all code blocks
- 🔌 **Connect Integration** - Quick access to API/MCP usage examples
- 🎨 **Dynamic Navbar** - Border appears on scroll
- 🛡️ **Error Boundaries** - Graceful crash recovery with auto-retry
- 🔄 **Network Resilience** - Automatic retry with exponential backoff
- ⚠️ **Error Recovery** - User-friendly messages and recovery options
- 📜 **Version History** - Track last 20 versions with restore capability
- 🔑 **Google OAuth** - Sign in with Google for seamless authentication

## API Documentation

- **[API Reference](../docs/API_REFERENCE.md)** - REST API endpoints used by frontend

## Directory Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts           # API client with retry logic
│   ├── config/
│   │   └── env.ts              # Environment validation
│   ├── types/
│   │   ├── index.ts            # Re-exports all types
│   │   ├── artifact.ts         # Artifact types
│   │   ├── auth.ts             # Auth types
│   │   ├── api-key.ts          # API key types
│   │   ├── error.ts            # Error types
│   │   └── logger.ts           # Logger types
│   ├── components/
│   │   ├── Artifacts/
│   │   │   ├── ArtifactModal/          # Unified modal for view/edit/create
│   │   │   │   ├── index.tsx           # Main modal orchestrator
│   │   │   │   ├── ArtifactModalHeader.tsx  # Header with title/dates/actions
│   │   │   │   └── ArtifactEditor.tsx       # Editor with write/preview tabs
│   │   │   ├── ArtifactCard.tsx        # Grid card component with connect button
│   │   │   ├── ConnectPopover.tsx      # API/MCP usage examples popover
│   │   │   └── VersionHistory.tsx      # Version history sidebar panel
│   │   ├── ApiKeys/
│   │   │   ├── ApiKeysList.tsx     # API keys table
│   │   │   ├── CreateApiKey.tsx    # Creation dialog
│   │   │   └── ApiKeyDisplay.tsx   # One-time key display
│   │   ├── Docs/
│   │   │   ├── DocsSidebar.tsx     # Docs navigation
│   │   │   └── DocsViewer.tsx      # Markdown viewer with copy
│   │   ├── Errors/
│   │   │   ├── ErrorBoundary.tsx   # Global error boundary
│   │   │   └── ErrorFallback.tsx   # Error display component
│   │   ├── Layout/
│   │   │   ├── Layout.tsx          # App layout wrapper (conditional)
│   │   │   ├── Navbar.tsx          # Persistent navigation
│   │   │   └── Footer.tsx          # Legal links footer
│   │   └── Markdown/
│   │       ├── MarkdownRenderer.tsx         # Standard markdown renderer
│   │       ├── ProgressiveMarkdownRenderer.tsx # Chunked renderer for large content (>10k chars)
│   │       └── ChunkSkeleton.tsx           # Loading skeleton for chunks
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Auth state management
│   │   └── ThemeContext.tsx    # Theme mode & localStorage
│   ├── hooks/
│   │   ├── useArtifacts.ts     # React Query hooks for artifacts
│   │   ├── useArtifactVersions.ts # Version history hooks
│   │   ├── useApiKeys.ts       # API key hooks
│   │   ├── useDebounce.ts      # Debounce utility
│   │   ├── useIntersectionObserver.ts # Viewport detection for lazy loading
│   │   └── useProgressiveContent.ts   # Chunk loading management
│   ├── utils/
│   │   ├── dates.ts            # Date formatting utilities
│   │   ├── errors.ts           # Error handling utilities
│   │   ├── logger.ts           # Logging utility (dev-only)
│   │   └── markdown/
│   │       └── chunking.ts     # Content splitting utilities
│   ├── data/
│   │   ├── demoData.ts         # Demo artifacts for non-auth users
│   │   └── docsRegistry.ts     # Docs imports & metadata
│   ├── docs/                    # Documentation markdown files
│   │   ├── API_REFERENCE.md
│   │   ├── API_INTEGRATION.md
│   │   ├── MCP_SPECIFICATION.md
│   │   └── MCP_INTEGRATION.md
│   ├── legal/                  # Legal documents
│   │   ├── legalRegistry.ts    # Legal document registry
│   │   ├── TERMS_OF_SERVICE.md
│   │   └── PRIVACY_POLICY.md
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main page with unified search/new
│   │   ├── LoginPage.tsx       # Two-step auth flow with email/Google
│   │   ├── AuthCallback.tsx    # OAuth callback handler
│   │   ├── Settings.tsx        # Settings with API keys, appearance & terms
│   │   ├── Docs.tsx            # Documentation page
│   │   └── LegalPage.tsx       # Legal document viewer
│   ├── theme/
│   │   └── index.ts            # Light/dark theme definitions
│   ├── App.tsx                 # Root component
│   └── main.tsx               # Entry point
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy template to create .env in frontend directory
cp .env.example .env

# Edit .env with your backend URL and Supabase credentials
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** Environment file must be in `/frontend/.env` (not root).

### 3. Run Development Server

```bash
npm run dev
# App runs on http://localhost:5173
```

### 4. Build for Production

```bash
npm run build
npm run preview  # Test production build
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## API Integration

The frontend expects a backend API at `VITE_API_URL` with these endpoints:

### Authentication Endpoints
- `POST /api/v1/auth/login` - Sign in with email/password
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/check-email` - Check if email exists
- `POST /api/v1/auth/logout` - Sign out
- **OAuth**: Google authentication handled via Supabase (no backend endpoint needed)

### Protected Endpoints (Require Bearer Token)
- `GET /api/v1/artifacts` - List all artifacts
- `POST /api/v1/artifacts` - Create artifact
- `GET /api/v1/artifacts/{id}` - Get single artifact
- `PUT /api/v1/artifacts/{id}` - Update artifact
- `DELETE /api/v1/artifacts/{id}` - Delete artifact
- `GET /api/v1/artifacts/search?q=` - Search artifacts
- `GET /api/v1/artifacts/{id}/versions` - Get version history
- `GET /api/v1/artifacts/{id}/versions/{version}` - Get specific version
- `POST /api/v1/artifacts/{id}/restore/{version}` - Restore to version
- `GET /api/v1/artifacts/{id}/diff?from_version=X&to_version=Y` - Compare versions

### API Key Management Endpoints
- `POST /api/v1/api-keys` - Create API key
- `GET /api/v1/api-keys` - List user's API keys
- `GET /api/v1/api-keys/{id}` - Get API key details
- `DELETE /api/v1/api-keys/{id}` - Revoke API key

**Note**: All protected endpoints require authentication. The Bearer token is automatically injected via Axios interceptor after login.

## State Management

- **Server State**: React Query for API data
- **Auth State**: Context provider with Supabase session
- **Theme State**: Context provider with localStorage sync
- **Local State**: React hooks for UI state
- **Error State**: Global error boundary with recovery
- **Type Safety**: Centralized types in `src/types/`

## Performance

- **Debounced Search**: 300ms delay
- **Optimistic Updates**: Immediate UI feedback
- **Query Caching**: 5-minute stale time
- **Lazy Loading**: Code splitting for modals
- **Progressive Loading**: Content >10k chars loads in 5k chunks on scroll
- **Retry Logic**: Exponential backoff for failed requests
- **Timeout Handling**: 30-second timeout with user feedback

## Documentation

Built-in documentation viewer at `/docs` with:
- API Reference
- MCP Specification
- MCP Integration Guide

Features:
- Sidebar navigation
- Copy entire document
- Code block copy buttons
- Progressive rendering for large docs

## Keyboard Shortcuts

- `⌘K` - Focus search
- `⌘↵` - New artifact

## Error Handling & Resilience

- **Global Error Boundary**: Catches all React errors with auto-recovery
- **Network Resilience**: 3 retry attempts with exponential backoff
- **Environment Validation**: Clear errors for missing configuration
- **User-Friendly Messages**: Technical errors translated to clear guidance
- **Production Ready**: Clean console, no crashes, always recoverable

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires ES2020+ support

## Development Tips

### Adding a New Feature
1. Create component in appropriate folder
2. Define types in `src/types/`
3. Add API function to `client.ts`
4. Create React Query hook with error handling
5. Import and use in Dashboard

### Error Handling
```typescript
// Use logger for dev debugging
import { logger } from '@/utils/logger';
logger.error('Operation failed', { context });

// Get user-friendly error messages
import { getErrorMessage } from '@/utils/errors';
const message = getErrorMessage(error);
```

### Modifying Theme
Edit `src/theme/index.ts`:
```typescript
// Modify theme for both modes
export const createAppTheme = (mode: PaletteMode) => {
  const isLight = mode === 'light';
  return createTheme({
    palette: { /* colors */ },
    components: { /* overrides */ }
  });
};
```

### Testing API Changes
```bash
# Test backend connection
curl http://localhost:8000/health

# Create test artifact (title auto-generated from H1)
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"content": "# Test Artifact\n\nContent here..."}'
```

## Deployment

### Build for Production
```bash
npm run build
# Output in dist/ folder
```

### Environment Variables
Set these in your deployment platform:
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Static Hosting
Deploy `dist/` folder to:
- **Netlify** (production-ready with error recovery)
- Vercel
- GitHub Pages  

## Next Steps

- [ ] Password reset flow
- [ ] Email verification
