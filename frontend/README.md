# Context Platform Frontend

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
- 📝 **Unified artifacts** - Everything is just an artifact
- 🔍 **Search** - Debounced full-text search
- 💾 **CRUD Operations** - Create, read, update, delete
- 📋 **Copy & Download** - Export artifacts as markdown
- 🎨 **Clean UI** - Minimal design with subtle borders
- ⚡ **Fast** - Optimistic updates with React Query
- 🔐 **Authentication** - Email/password with automatic user detection
- 👤 **User Management** - Profile menu with logout
- 🔑 **API Keys** - Programmatic access management

## Directory Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts           # API client & types
│   ├── components/
│   │   ├── Artifacts/
│   │   │   ├── ArtifactCard.tsx    # Grid card component
│   │   │   ├── ArtifactDetail.tsx  # Detail view modal
│   │   │   └── ArtifactForm.tsx    # Create/edit form
│   │   ├── ApiKeys/
│   │   │   ├── ApiKeysList.tsx     # API keys table
│   │   │   ├── CreateApiKey.tsx    # Creation dialog
│   │   │   └── ApiKeyDisplay.tsx   # One-time key display
│   │   └── Markdown/
│   │       └── MarkdownRenderer.tsx # Markdown preview
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state management  
│   ├── hooks/
│   │   ├── useArtifacts.ts     # React Query hooks
│   │   ├── useApiKeys.ts       # API key hooks
│   │   └── useDebounce.ts      # Debounce utility
│   ├── pages/
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── LoginPage.tsx       # Two-step auth flow
│   │   └── Settings.tsx        # Settings with API keys
│   ├── theme/
│   │   └── index.ts            # MUI theme config
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
# Copy environment template
cp .env.example .env

# Edit .env with your backend URL and Supabase credentials
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

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

## Key Components

### ArtifactCard
Displays artifact preview in a grid layout with:
- Title and content preview
- Creation date
- Hover effects

### ArtifactForm
Modal form for creating/editing artifacts:
- Title input
- Markdown editor with live preview tabs
- Save/cancel actions

### ArtifactDetail
Full view modal showing:
- Complete rendered markdown
- Copy to clipboard
- Download as .md file
- Edit and delete actions

### MarkdownRenderer
Renders markdown with:
- GitHub Flavored Markdown support
- Syntax highlighting for code blocks
- Responsive typography
- Link handling

### LoginPage
Two-step authentication flow:
- Step 1: Email input with validation
- Step 2: Automatic detection of new vs existing user
- Smart password field labeling based on user status
- Loading states and error handling

### AuthContext
Manages authentication state:
- Supabase session handling
- Auto-refresh tokens
- Login/signup/logout methods
- Protected route handling

### Settings
Settings page with tabs:
- API Keys management
- User profile
- Security settings (future)

## API Integration

The frontend expects a backend API at `VITE_API_URL` with these endpoints:

### Authentication Endpoints
- `POST /api/v1/auth/login` - Sign in with email/password
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/check-email` - Check if email exists
- `POST /api/v1/auth/logout` - Sign out

### Protected Endpoints (Require Bearer Token)
- `GET /api/v1/artifacts` - List all artifacts
- `POST /api/v1/artifacts` - Create artifact
- `GET /api/v1/artifacts/{id}` - Get single artifact
- `PUT /api/v1/artifacts/{id}` - Update artifact
- `DELETE /api/v1/artifacts/{id}` - Delete artifact
- `GET /api/v1/artifacts/search?q=` - Search artifacts

### API Key Management Endpoints
- `POST /api/v1/api-keys` - Create API key
- `GET /api/v1/api-keys` - List user's API keys
- `GET /api/v1/api-keys/{id}` - Get API key details
- `DELETE /api/v1/api-keys/{id}` - Revoke API key

**Note**: All protected endpoints require authentication. The Bearer token is automatically injected via Axios interceptor after login.

## Styling

- **Theme**: Light mode with minimal aesthetic
- **Colors**: Black primary, gray secondary
- **Typography**: Inter font family
- **Borders**: 1px solid borders instead of shadows
- **Spacing**: 8px grid system

## State Management

- **Server State**: React Query for API data
- **Local State**: React hooks for UI state
- **No global store**: Keeps it simple

## Performance

- **Debounced Search**: 300ms delay
- **Optimistic Updates**: Immediate UI feedback
- **Query Caching**: 5-minute stale time
- **Lazy Loading**: Code splitting for modals

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires ES2020+ support

## Development Tips

### Adding a New Feature
1. Create component in appropriate folder
2. Add API function to `client.ts`
3. Create React Query hook in `useArtifacts.ts`
4. Import and use in Dashboard

### Modifying Theme
Edit `src/theme/index.ts` to change:
- Colors
- Typography
- Component defaults
- Border radius

### Testing API Changes
```bash
# Test backend connection
curl http://localhost:8000/health

# Create test artifact
curl -X POST http://localhost:8000/api/v1/artifacts \
  -H "Content-Type: application/json" \
  -d '{"type": "prompt", "title": "Test", "content": "# Test"}'
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
- Vercel
- Netlify  
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

## Next Steps

- [x] User authentication
- [ ] Add keyboard shortcuts
- [ ] Implement tags/categories
- [ ] Add export/import functionality
- [ ] Dark mode toggle
- [ ] Collaborative editing
- [ ] Version history
- [ ] Password reset flow
- [ ] Email verification
