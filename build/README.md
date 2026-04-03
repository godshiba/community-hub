# Build Assets

Place the following files here before running `npm run dist`:

| File | Purpose |
|------|---------|
| `icon.icns` | macOS app icon (1024x1024 recommended, converted to .icns) |
| `icon.png` | 512x512 PNG used for Linux + fallback |
| `icon.ico` | Windows icon (future) |
| `dmg-background.png` | Background image for the macOS .dmg installer window (540x380px) |

## Generating icon.icns from a PNG

```bash
mkdir MyIcon.iconset
sips -z 16 16     icon.png --out MyIcon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out MyIcon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out MyIcon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out MyIcon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out MyIcon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out MyIcon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out MyIcon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out MyIcon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out MyIcon.iconset/icon_512x512.png
cp icon.png       MyIcon.iconset/icon_512x512@2x.png
iconutil -c icns MyIcon.iconset
mv MyIcon.icns icon.icns
rm -r MyIcon.iconset
```
