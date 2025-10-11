# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
# or
bun install
# or use the setup script
./scripts/setup-local.sh
```

### 2. Start Development Server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### 3. Build for Production

```bash
npm run build
# or
bun run build
# or use the build script
./scripts/build.sh
```

The production files will be in the `dist/` directory.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:8080` |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

---

## 🎯 Live Preview Features

This project includes powerful live preview capabilities:

### Native Live Preview

The application includes built-in live preview components:
- **LiveCodePreview**: Preview HTML/CSS/JS code in real-time
- **LiveHTMLPreview**: Secure iframe-based HTML rendering
- **WebBuilder**: Interactive code editor with live preview

### Running Live Preview

1. **In Development Mode** (Recommended):
   ```bash
   npm run dev
   ```
   Access at `http://localhost:8080`

2. **Using GitHub Codespaces**:
   - The dev server is configured to work in Codespaces
   - Use port forwarding (port 8080)
   - Or use the GitHub Live Preview extension

3. **Preview Production Build**:
   ```bash
   npm run build
   npm run preview
   ```

### Troubleshooting Live Preview

**Issue**: "localhost refused to connect in Codespace"

**Solutions**:
1. Ensure port 8080 is forwarded in Codespaces
2. Use the GitHub Live Preview extension
3. Check that the dev server is running: `npm run dev`
4. Try accessing via the Codespaces-provided URL

**Issue**: Preview not updating

**Solution**:
- The live preview uses auto-refresh (enabled by default)
- Click the refresh button in the preview component
- Clear browser cache and reload

---

## 🌐 Deployment

### Quick Deploy

```bash
# Deploy to Vercel
./scripts/deploy.sh vercel

# Deploy to Netlify
./scripts/deploy.sh netlify

# Build Docker image
./scripts/deploy.sh docker

# Manual build only
./scripts/deploy.sh manual
```

### Manual Deployment Steps

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder to your hosting provider:
   - Vercel: Connect GitHub repo or use Vercel CLI
   - Netlify: Drag & drop `dist/` folder or use Netlify CLI
   - GitHub Pages: Use `gh-pages` branch
   - Static hosting: Upload to any web server

See [MIGRATION.md](MIGRATION.md) for detailed deployment instructions.

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

Default values are provided for Lovable Cloud.

### Vite Configuration

The project uses Vite with the following configuration:
- Server port: `8080`
- Host: `::` (listens on all interfaces)
- Build output: `dist/`
- Path aliases: `@/` → `./src/`

Edit `vite.config.ts` to customize.

---

## 📚 Project Structure

```
unison-tasks/
├── src/
│   ├── components/        # React components
│   │   ├── creatives/     # Live preview components
│   │   └── ui/            # UI components (shadcn)
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── scripts/               # Build and deployment scripts
├── dist/                  # Production build (generated)
└── vite.config.ts         # Vite configuration
```

---

## 💡 Tips

1. **Fast Development**: Use `bun` instead of `npm` for faster install/build times
2. **Code Quality**: Run `npm run lint` before committing
3. **Preview Changes**: Use `npm run preview` to test the production build locally
4. **Hot Reload**: Development server has hot module replacement enabled
5. **Docker**: Use `docker-compose up` for containerized development

---

## 🆘 Need Help?

- See [MIGRATION.md](MIGRATION.md) for deployment details
- See [ARCHITECTURE.md](ARCHITECTURE.md) for technical architecture
- Check [README.md](README.md) for project overview

---

## 📄 License

This project is part of the Lovable platform ecosystem.
