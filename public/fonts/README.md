# PPMondwest Font Files

Please add the following PPMondwest font files to this directory:

- `PPMondwest-Regular.woff2`
- `PPMondwest-Medium.woff2`
- `PPMondwest-Bold.woff2`

You can download PPMondwest font from:
- Official website or font provider
- Your design team
- Font licensing platform

## Alternative: Use TTF/OTF files

If you have .ttf or .otf files instead, update the font paths in `/app/layout.tsx`:

```typescript
const ppMondwest = localFont({
  src: [
    {
      path: '../public/fonts/PPMondwest-Regular.ttf', // or .otf
      weight: '400',
      style: 'normal',
    },
    // ... etc
  ],
  // ...
});
```

## Fallback

Until the font files are added, the site will use the system font as a fallback.
