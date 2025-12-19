# Sheftira Font Setup Instructions

## ⚠️ Important: Font License Required

Sheftira is a premium font that requires purchase. You cannot use it without a valid license.

## Purchase Sheftira Font

1. Visit: https://www.myfonts.com/collections/sheftira-font-letterena-studios/
2. Purchase the font family ($19.00 for both Regular and Italic)
3. Download the font files after purchase

## After Purchase - Add Font Files Here

Once you have purchased and downloaded the Sheftira font files, place them in this directory:

**Required Files:**
- `Sheftira-Regular.woff2` (preferred - smallest file size)
- `Sheftira-Regular.woff` (fallback)
- `Sheftira-Regular.ttf` (fallback)
- `Sheftira-Italic.woff2` (preferred)
- `Sheftira-Italic.woff` (fallback)
- `Sheftira-Italic.ttf` (fallback)

## Converting Font Files

If you receive `.otf` files, convert them to web formats:

### Using Online Tools:
- https://cloudconvert.com/otf-to-woff2
- https://www.fontsquirrel.com/tools/webfont-generator

### Using Command Line (if you have fonttools):
```bash
pip install fonttools[woff]
pyftsubset Sheftira-Regular.otf --output-file=Sheftira-Regular.woff2 --flavor=woff2
```

## Verification

After adding the files, restart your Next.js dev server. The font should automatically load throughout your application.

## Free Alternative Options

If you prefer a free alternative with similar style:
- **Crimson Pro** (Google Fonts) - elegant serif
- **Lora** (Google Fonts) - readable serif
- **Merriweather** (Google Fonts) - professional serif

I can help you set up any of these alternatives if needed.

