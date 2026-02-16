/**
 * Design analysis module.
 * Checks for font consistency, color contrast (WCAG), design best practices,
 * and visual consistency across eLearning slides.
 */

// WCAG 2.1 minimum contrast ratios
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;
const LARGE_TEXT_PX = 18.66; // 14pt bold or 18pt normal ≈ 18.66px / 24px

/**
 * Analyzes a slide for design issues.
 */
function analyzeDesign(slide) {
  const findings = [];

  if (!slide.styles || slide.styles.length === 0) return findings;

  checkFontConsistency(slide, findings);
  checkColorContrast(slide, findings);
  checkFontSizes(slide, findings);
  checkColorPalette(slide, findings);
  checkImageAccessibility(slide, findings);
  checkLineSpacing(slide, findings);

  return findings;
}

/**
 * Checks for inconsistent font usage across a slide.
 */
function checkFontConsistency(slide, findings) {
  const fonts = new Map();

  for (const style of slide.styles) {
    const family = normalizeFontFamily(style.fontFamily);
    if (!fonts.has(family)) {
      fonts.set(family, []);
    }
    fonts.get(family).push(style.text);
  }

  // Flag if more than 3 different font families are used
  if (fonts.size > 3) {
    findings.push({
      category: 'design',
      severity: 'warning',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: `Too many font families used (${fonts.size}): ${Array.from(fonts.keys()).join(', ')}`,
      suggestion:
        'Limit to 2-3 font families for visual consistency. Use one for headings and one for body text.',
      elementSelector: null,
      rawText: null,
    });
  }

  // Check for similar but not identical fonts (possible inconsistency)
  const fontList = Array.from(fonts.keys());
  for (let i = 0; i < fontList.length; i++) {
    for (let j = i + 1; j < fontList.length; j++) {
      if (areSimilarFonts(fontList[i], fontList[j])) {
        findings.push({
          category: 'design',
          severity: 'info',
          slideNumber: slide.slideNumber,
          slideTitle: slide.title,
          description: `Similar fonts used: "${fontList[i]}" and "${fontList[j]}" — possibly unintentional`,
          suggestion: 'Standardize to one of these fonts across the slide',
          elementSelector: null,
          rawText: null,
        });
      }
    }
  }
}

/**
 * Checks color contrast against WCAG standards.
 */
function checkColorContrast(slide, findings) {
  for (const style of slide.styles) {
    const fgColor = parseColor(style.color);
    const bgColor = parseColor(style.backgroundColor);

    if (!fgColor || !bgColor) continue;
    // Skip transparent backgrounds
    if (bgColor.a === 0) continue;

    const ratio = getContrastRatio(fgColor, bgColor);
    const fontSize = parseFloat(style.fontSize);
    const isBold = parseInt(style.fontWeight) >= 700;
    const isLargeText = fontSize >= 24 || (fontSize >= LARGE_TEXT_PX && isBold);

    const requiredRatio = isLargeText ? WCAG_AA_LARGE : WCAG_AA_NORMAL;

    if (ratio < requiredRatio) {
      findings.push({
        category: 'design',
        severity: ratio < 2.0 ? 'critical' : 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Low color contrast (${ratio.toFixed(2)}:1) — WCAG AA requires ${requiredRatio}:1. Text: "${style.text}"`,
        suggestion: `Increase contrast between text color (${style.color}) and background (${style.backgroundColor}). Use a contrast checker tool.`,
        elementSelector: style.selector,
        rawText: style.text,
      });
    } else if (ratio < WCAG_AAA_NORMAL && !isLargeText) {
      findings.push({
        category: 'design',
        severity: 'info',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Color contrast (${ratio.toFixed(2)}:1) meets AA but not AAA (${WCAG_AAA_NORMAL}:1). Text: "${style.text}"`,
        suggestion: 'Consider improving contrast for enhanced readability',
        elementSelector: style.selector,
        rawText: style.text,
      });
    }
  }
}

/**
 * Checks for problematic font sizes.
 */
function checkFontSizes(slide, findings) {
  for (const style of slide.styles) {
    const fontSize = parseFloat(style.fontSize);

    if (fontSize < 12) {
      findings.push({
        category: 'design',
        severity: 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Font size too small (${style.fontSize}) for comfortable reading: "${style.text}"`,
        suggestion: 'Use a minimum font size of 14px for body text in eLearning content',
        elementSelector: style.selector,
        rawText: style.text,
      });
    }

    if (fontSize > 72) {
      findings.push({
        category: 'design',
        severity: 'info',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Very large font size (${style.fontSize}): "${style.text}"`,
        suggestion: 'Verify this large font size is intentional and doesn\'t overflow on smaller screens',
        elementSelector: style.selector,
        rawText: style.text,
      });
    }
  }

  // Check for inconsistent body text sizes
  const bodySizes = slide.styles
    .filter((s) => parseInt(s.fontWeight) < 600 && parseFloat(s.fontSize) < 24)
    .map((s) => parseFloat(s.fontSize));

  const uniqueBodySizes = [...new Set(bodySizes)];
  if (uniqueBodySizes.length > 2) {
    findings.push({
      category: 'design',
      severity: 'warning',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: `Multiple body text sizes used: ${uniqueBodySizes.map((s) => s + 'px').join(', ')}`,
      suggestion: 'Standardize body text to one or two consistent sizes',
      elementSelector: null,
      rawText: null,
    });
  }
}

/**
 * Checks the color palette for consistency and accessibility.
 */
function checkColorPalette(slide, findings) {
  const textColors = new Set();
  const bgColors = new Set();

  for (const style of slide.styles) {
    textColors.add(style.color);
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      bgColors.add(style.backgroundColor);
    }
  }

  // Too many text colors = visual inconsistency
  if (textColors.size > 5) {
    findings.push({
      category: 'design',
      severity: 'warning',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: `Too many text colors used (${textColors.size}): ${Array.from(textColors).join(', ')}`,
      suggestion: 'Limit text colors to 2-3 for a clean, professional look',
      elementSelector: null,
      rawText: null,
    });
  }
}

/**
 * Checks images for accessibility issues.
 */
function checkImageAccessibility(slide, findings) {
  if (!slide.images) return;

  for (const img of slide.images) {
    if (!img.hasAlt) {
      findings.push({
        category: 'design',
        severity: 'critical',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: 'Image missing alt text attribute (accessibility requirement)',
        suggestion: 'Add descriptive alt text to all images for screen reader users',
        elementSelector: null,
        rawText: img.src,
      });
    } else if (img.alt === '') {
      // Empty alt is okay for decorative images, but flag for review
      findings.push({
        category: 'design',
        severity: 'info',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: 'Image has empty alt text — verify this image is decorative',
        suggestion: 'If the image conveys information, add descriptive alt text',
        elementSelector: null,
        rawText: img.src,
      });
    }
  }
}

/**
 * Checks line spacing for readability.
 */
function checkLineSpacing(slide, findings) {
  for (const style of slide.styles) {
    if (!style.lineHeight || style.lineHeight === 'normal') continue;

    const lineHeight = parseFloat(style.lineHeight);
    const fontSize = parseFloat(style.fontSize);

    if (fontSize > 0 && lineHeight > 0) {
      const ratio = lineHeight / fontSize;
      if (ratio < 1.2) {
        findings.push({
          category: 'design',
          severity: 'warning',
          slideNumber: slide.slideNumber,
          slideTitle: slide.title,
          description: `Line spacing too tight (${ratio.toFixed(2)}x) for text: "${style.text}"`,
          suggestion: 'Use a line height of at least 1.5x the font size for body text (WCAG 1.4.12)',
          elementSelector: style.selector,
          rawText: style.text,
        });
      }
    }
  }
}

// --- Color utility functions ---

/**
 * Parses a CSS color string to {r, g, b, a}.
 */
function parseColor(colorStr) {
  if (!colorStr) return null;

  // rgb(r, g, b)
  const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]), a: 1 };
  }

  // rgba(r, g, b, a)
  const rgbaMatch = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: parseFloat(rgbaMatch[4]),
    };
  }

  // Hex #RRGGBB or #RGB
  const hexMatch = colorStr.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
        a: 1,
      };
    }
  }

  return null;
}

/**
 * Calculates relative luminance per WCAG 2.1.
 */
function getLuminance(color) {
  const rsRGB = color.r / 255;
  const gsRGB = color.g / 255;
  const bsRGB = color.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG contrast ratio between two colors.
 */
function getContrastRatio(fg, bg) {
  const lum1 = getLuminance(fg);
  const lum2 = getLuminance(bg);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Normalizes font family strings for comparison.
 */
function normalizeFontFamily(family) {
  if (!family) return 'unknown';
  return family
    .split(',')[0]
    .trim()
    .replace(/["']/g, '')
    .toLowerCase();
}

/**
 * Checks if two fonts are similar (same family, different weights/styles).
 */
function areSimilarFonts(a, b) {
  const normalize = (f) => f.replace(/\s*(light|bold|medium|regular|thin|black|semi|demi|ultra|condensed|narrow|wide|italic|oblique)\s*/gi, '').trim();
  return normalize(a) === normalize(b) && a !== b;
}

module.exports = { analyzeDesign, getContrastRatio, parseColor };
