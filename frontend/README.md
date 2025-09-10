# Context Platform Frontend

A minimal, elegant React application for managing markdown-based AI artifacts (prompts and documents).

## Stack

- **React 18** with TypeScript
- **Vite** - Build tool
- **Material-UI (MUI) v5** - Component library
- **Lucide React** - Icons
- **React Query (TanStack Query)** - Data fetching & caching
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code highlighting
- **Axios** - HTTP client

## Features

- ✨ **Markdown-first** - Full markdown editor with live preview
- 📝 **Unified artifacts** - Everything is just an artifact
- 🔍 **Search** - Debounced full-text search
- 💾 **CRUD Operations** - Create, read, update, delete
- 📋 **Copy & Download** - Export artifacts as markdown
- 🎨 **Clean UI** - Minimal design with subtle borders
- ⚡ **Fast** - Optimistic updates with React Query

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
│   │   └── Markdown/
│   │       └── MarkdownRenderer.tsx # Markdown preview
│   ├── hooks/
│   │   ├── useArtifacts.ts     # React Query hooks
│   │   └── useDebounce.ts      # Debounce utility
│   ├── pages/
│   │   └── Dashboard.tsx       # Main dashboard
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

# Edit .env with your backend URL
VITE_API_URL=http://localhost:8000
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

## API Integration

The frontend expects a backend API at `VITE_API_URL` with these endpoints:

- `GET /api/v1/artifacts` - List all artifacts
- `POST /api/v1/artifacts` - Create artifact
- `GET /api/v1/artifacts/{id}` - Get single artifact
- `PUT /api/v1/artifacts/{id}` - Update artifact
- `DELETE /api/v1/artifacts/{id}` - Delete artifact
- `GET /api/v1/artifacts/search?q=` - Search artifacts

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

### Static Hosting
Deploy `dist/` folder to:
- Vercel
- Netlify  
- Cloudflare Pages
- GitHub Pages
- AWS S3 + CloudFront

## Next Steps

- [ ] Add keyboard shortcuts
- [ ] Implement tags/categories
- [ ] Add export/import functionality
- [ ] Dark mode toggle
- [ ] Collaborative editing
- [ ] Version history
