# Running Vite Live Preview Natively

This guide explains how to run the Vite development server with live preview capabilities.

## Quick Start

### Option 1: Using the Helper Script

```bash
# Run the live preview script
./scripts/run-live-preview.sh

# Or with audit fix
./scripts/run-live-preview.sh --fix-audit
```

### Option 2: Manual Steps

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. (Optional) Fix security vulnerabilities
npm audit fix

# 3. Start the development server
npm run dev
```

## Accessing the Live Preview

Once the server starts, you can access the application at:

- **Local**: http://localhost:8080
- **IPv6**: http://[::1]:8080
- **Network**: The server will also display your network IP address

## Live Preview Features

The application includes several live preview components:

### 1. LiveHTMLPreview
Located in `src/components/creatives/LiveHTMLPreview.tsx`

**Features:**
- Real-time HTML, CSS, and JavaScript preview
- Automatic refresh on code changes
- Element selection and inspection
- Error handling and display
- Sandboxed iframe environment

**Usage:**
```tsx
<LiveHTMLPreview 
  code={yourCode}
  autoRefresh={true}
  enableSelection={true}
  onElementSelect={(elementData) => {
    console.log('Selected:', elementData);
  }}
/>
```

### 2. LiveCodePreview
Located in `src/components/creatives/LiveCodePreview.tsx`

**Features:**
- Multi-device preview (Desktop, Tablet, Mobile)
- Refresh control
- Full-screen mode
- Auto-refresh on code changes

**Usage:**
```tsx
<LiveCodePreview 
  code={yourCode}
  autoRefresh={true}
/>
```

### 3. SecureIframePreview
Located in `src/components/SecureIframePreview.tsx`

**Features:**
- Secure sandboxed environment
- Virtual filesystem (VFS)
- RPC communication
- Console intercept
- Error handling

**Usage:**
```tsx
<SecureIframePreview 
  html={yourHTML}
  css={yourCSS}
  onConsole={(type, args) => console.log(type, args)}
  onError={(error) => console.error(error)}
/>
```

## Vite Configuration

The Vite configuration (`vite.config.ts`) has been optimized for live preview:

```typescript
server: {
  host: "::",           // Listen on all network interfaces
  port: 8080,           // Default port
  strictPort: false,    // Allow fallback to other ports
  open: true,           // Auto-open browser
  cors: true,           // Enable CORS for iframes
  hmr: {
    overlay: true,      // Show HMR errors as overlay
  },
},
preview: {
  host: "::",
  port: 8080,
  strictPort: false,
  open: true,
  cors: true,
},
```

## Key Features of the Configuration

1. **Cross-Origin Support**: CORS is enabled to allow iframe communication
2. **Hot Module Replacement (HMR)**: Automatic updates without full page reload
3. **Network Access**: Server listens on all interfaces (`::`) for easy testing on different devices
4. **Auto-open**: Browser automatically opens when server starts
5. **Flexible Port**: If port 8080 is busy, Vite will try the next available port

## Building for Production

To build the application for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, Vite will automatically try the next available port (8081, 8082, etc.).

### CORS Issues

If you encounter CORS issues with iframes:
1. Ensure `cors: true` is set in `vite.config.ts`
2. Check browser console for specific CORS errors
3. Verify iframe `sandbox` attributes are correctly configured

### Live Preview Not Updating

If live preview doesn't update automatically:
1. Check that `autoRefresh={true}` is set on the component
2. Verify HMR is working (check console for HMR updates)
3. Try manually refreshing the browser

### Dependencies Issues

If you encounter dependency issues:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Fix audit issues
npm audit fix
```

## Development Workflow

1. **Start the server**: `npm run dev`
2. **Make changes**: Edit files in the `src/` directory
3. **See updates**: Changes appear automatically in the browser
4. **Test live previews**: Use the live preview components in your application
5. **Build**: Run `npm run build` when ready to deploy

## Additional Commands

```bash
# Run linter
npm run lint

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview
```

## Notes

- The development server uses Vite's fast HMR for instant updates
- Live preview components use sandboxed iframes for security
- All preview components support real-time code editing
- The application is optimized for modern browsers with ES modules support

## Support

For issues or questions:
- Check the [Vite documentation](https://vitejs.dev/)
- Review component-specific documentation in the source files
- Check browser console for error messages
