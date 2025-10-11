# Quick Start: Running Vite Live Preview Natively

## ✅ Changes Made

The following enhancements have been made to support running Vite live preview natively:

### 1. Enhanced Vite Configuration (`vite.config.ts`)

**Added:**
- ✅ CORS support (`cors: true`) for iframe-based live previews
- ✅ Auto-open browser on server start (`open: true`)
- ✅ Flexible port allocation (`strictPort: false`)
- ✅ HMR overlay for better error visibility
- ✅ Preview server configuration matching dev server

### 2. New Helper Script (`scripts/run-live-preview.sh`)

**Features:**
- ✅ Automatic dependency installation check
- ✅ Optional `npm audit fix` support
- ✅ Clear server information display
- ✅ Live preview component information

### 3. Documentation (`LIVE_PREVIEW_GUIDE.md`)

**Includes:**
- ✅ Quick start guide
- ✅ Detailed component documentation (LiveHTMLPreview, LiveCodePreview, SecureIframePreview)
- ✅ Configuration explanation
- ✅ Troubleshooting guide
- ✅ Development workflow

### 4. Package.json Enhancement

**Added:**
- ✅ `dev:safe` script that runs `npm audit fix` before starting dev server

## 🚀 How to Use

### Method 1: Use the Helper Script (Recommended)

```bash
# Basic usage
./scripts/run-live-preview.sh

# With audit fix
./scripts/run-live-preview.sh --fix-audit
```

### Method 2: Use npm Scripts

```bash
# Standard development server
npm run dev

# With audit fix first
npm run dev:safe
```

### Method 3: Manual Steps

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Fix vulnerabilities
npm audit fix

# 3. Start server
npm run dev
```

## 🌐 Accessing Your Application

Once started, the server will be available at:
- **Local**: http://localhost:8080
- **IPv6**: http://[::1]:8080
- **Network**: Check terminal output for your network IP

The browser will automatically open when the server starts (thanks to `open: true`).

## 🎯 Live Preview Components

Your application now has optimized support for:

1. **LiveHTMLPreview** - Real-time HTML/CSS/JS rendering with element selection
2. **LiveCodePreview** - Multi-device preview with responsive testing
3. **SecureIframePreview** - Sandboxed environment with VFS support

## 📖 Next Steps

1. **Start the server**: Run `./scripts/run-live-preview.sh` or `npm run dev`
2. **Read the full guide**: Check [LIVE_PREVIEW_GUIDE.md](./LIVE_PREVIEW_GUIDE.md) for details
3. **Explore components**: Navigate through your app to see live previews in action
4. **Make changes**: Edit code and see instant updates via HMR

## 🔧 Configuration Benefits

The enhanced Vite configuration provides:

- **Faster development**: HMR ensures instant updates without full reload
- **Better debugging**: Error overlay shows issues clearly
- **Cross-origin support**: CORS enabled for all iframe-based previews
- **Flexible networking**: Server accessible from other devices on network
- **Production preview**: Same configuration for `npm run preview`

## 🐛 Troubleshooting

If you encounter issues:

1. **Port in use**: Vite will automatically use the next available port
2. **Dependencies**: Run `npm install` to ensure all packages are installed
3. **Audit issues**: Run `npm audit fix` or use `npm run dev:safe`
4. **More help**: See [LIVE_PREVIEW_GUIDE.md](./LIVE_PREVIEW_GUIDE.md) for detailed troubleshooting

## ✨ Summary

Your Vite development environment is now optimized for native live preview support with:
- Enhanced configuration
- Convenient helper scripts
- Comprehensive documentation
- Better developer experience

Happy coding! 🎉
