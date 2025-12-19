# Sheftira Font Setup

## Font Files Required

Please place the following Sheftira font files in this directory (`public/fonts/`):

1. **Sheftira-Regular.woff2** (preferred format)
2. **Sheftira-Regular.woff** (fallback)
3. **Sheftira-Regular.ttf** (fallback)
4. **Sheftira-Italic.woff2** (preferred format)
5. **Sheftira-Italic.woff** (fallback)
6. **Sheftira-Italic.ttf** (fallback)

## Font Source

Sheftira is a premium font available from:
- **MyFonts**: https://www.myfonts.com/collections/sheftira-font-letterena-studios/
- Price: $17.00 per style or $19.00 for the complete family

## Converting Font Files

If you have the font in `.otf` or `.ttf` format, you can convert them to web formats using:

1. **Online Tools:**
   - https://cloudconvert.com/
   - https://www.fontsquirrel.com/tools/webfont-generator

2. **Command Line:**
   ```bash
   # Using fonttools (pip install fonttools[woff])
   pyftsubset Sheftira-Regular.ttf --output-file=Sheftira-Regular.woff2 --flavor=woff2
   ```

## After Adding Font Files

Once you've placed the font files in this directory, the app will automatically use Sheftira as the default font family throughout the entire application.

The font is configured in:
- `app/layout.tsx` - Next.js font configuration
- `app/globals.css` - CSS @font-face declarations
- `tailwind.config.js` - Tailwind font family extension

