/**
 * Functionality analysis module.
 * Checks for broken links, navigation issues, interactive element problems,
 * and general functionality concerns in eLearning content.
 */

/**
 * Analyzes a slide for functionality issues.
 */
function analyzeFunctionality(slide) {
  const findings = [];

  checkBrokenLinks(slide, findings);
  checkInteractiveElements(slide, findings);
  checkNavigationElements(slide, findings);
  checkEmptyContent(slide, findings);
  checkMediaElements(slide, findings);

  return findings;
}

/**
 * Checks for potentially broken or problematic links.
 */
function checkBrokenLinks(slide, findings) {
  if (!slide.interactions) return;

  for (const link of slide.interactions) {
    if (link.type !== 'a' || !link.href) continue;

    // Check for empty links
    if (!link.href || link.href === '#' || link.href === 'javascript:void(0)') {
      findings.push({
        category: 'functionality',
        severity: 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Link has no destination: "${link.text || '(no text)'}"`,
        suggestion: 'Add a valid URL or remove the link',
        elementSelector: link.selector,
        rawText: link.text,
      });
      continue;
    }

    // Check for links to localhost or file:// protocol
    if (link.href.startsWith('file://') || link.href.includes('localhost')) {
      findings.push({
        category: 'functionality',
        severity: 'critical',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Link points to local/dev URL: "${link.href}"`,
        suggestion: 'Update to production URL before publishing',
        elementSelector: link.selector,
        rawText: link.text,
      });
    }

    // Check for links without text (accessibility)
    if (!link.text && link.type === 'a') {
      findings.push({
        category: 'functionality',
        severity: 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Link has no visible text or aria-label: ${link.href}`,
        suggestion: 'Add descriptive link text for accessibility',
        elementSelector: link.selector,
        rawText: null,
      });
    }

    // Check for generic link text
    if (link.text) {
      const genericTexts = ['click here', 'here', 'link', 'read more', 'more', 'learn more'];
      if (genericTexts.includes(link.text.toLowerCase().trim())) {
        findings.push({
          category: 'functionality',
          severity: 'info',
          slideNumber: slide.slideNumber,
          slideTitle: slide.title,
          description: `Generic link text "${link.text}" — not descriptive for screen readers`,
          suggestion: 'Use descriptive link text that explains the destination',
          elementSelector: link.selector,
          rawText: link.text,
        });
      }
    }

    // Check for HTTP links (should be HTTPS)
    if (link.href.startsWith('http://') && !link.href.includes('localhost')) {
      findings.push({
        category: 'functionality',
        severity: 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Insecure HTTP link: "${link.href}"`,
        suggestion: 'Use HTTPS for external links to ensure security',
        elementSelector: link.selector,
        rawText: link.text,
      });
    }
  }
}

/**
 * Checks interactive elements (buttons, hotspots) for issues.
 */
function checkInteractiveElements(slide, findings) {
  if (!slide.interactions) return;

  const buttons = slide.interactions.filter(
    (el) => el.type === 'button' || el.type === '[role="button"]'
  );

  for (const btn of buttons) {
    // Button with no text
    if (!btn.text) {
      findings.push({
        category: 'functionality',
        severity: 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: 'Button has no visible text or label',
        suggestion: 'Add text or an aria-label to all interactive buttons',
        elementSelector: btn.selector,
        rawText: null,
      });
    }

    // Hidden interactive element
    if (!btn.isVisible) {
      findings.push({
        category: 'functionality',
        severity: 'info',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Hidden interactive element found: "${btn.text || '(no text)'}"`,
        suggestion: 'Verify this element should be hidden at this point in the course',
        elementSelector: btn.selector,
        rawText: btn.text,
      });
    }
  }
}

/**
 * Checks for navigation element issues specific to eLearning.
 */
function checkNavigationElements(slide, findings) {
  if (!slide.interactions) return;

  // Check for presence of navigation elements
  const navKeywords = ['next', 'previous', 'prev', 'back', 'forward', 'menu', 'home', 'submit'];
  const navElements = slide.interactions.filter((el) =>
    navKeywords.some((kw) => (el.text || '').toLowerCase().includes(kw))
  );

  // Check for hidden navigation buttons
  const hiddenNav = navElements.filter((el) => !el.isVisible);
  for (const nav of hiddenNav) {
    findings.push({
      category: 'functionality',
      severity: 'warning',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: `Navigation element "${nav.text}" is hidden/not visible`,
      suggestion: 'Ensure navigation controls are visible and accessible',
      elementSelector: nav.selector,
      rawText: nav.text,
    });
  }
}

/**
 * Checks for slides with no content or very little content.
 */
function checkEmptyContent(slide, findings) {
  const text = (slide.textContent || '').trim();

  if (!text) {
    findings.push({
      category: 'functionality',
      severity: 'info',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: 'Slide appears to have no text content',
      suggestion:
        'Verify this is intentional (e.g., image-only slide). If not, add content.',
      elementSelector: null,
      rawText: null,
    });
  } else if (text.length < 10) {
    findings.push({
      category: 'functionality',
      severity: 'info',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: `Slide has very little text content (${text.length} characters)`,
      suggestion: 'Consider if this slide needs additional content or context',
      elementSelector: null,
      rawText: text,
    });
  }
}

/**
 * Checks for media-related issues.
 */
function checkMediaElements(slide, findings) {
  if (!slide.images) return;

  for (const img of slide.images) {
    // Check for broken images (0x0 dimensions)
    if (img.width === 0 && img.height === 0 && img.src) {
      findings.push({
        category: 'functionality',
        severity: 'critical',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Image failed to load or has zero dimensions: ${img.src}`,
        suggestion: 'Verify the image file exists and the path is correct',
        elementSelector: null,
        rawText: img.src,
      });
    }

    // Check for external image links that may break
    if (img.src && img.src.startsWith('http') && !img.src.includes(slide.url)) {
      findings.push({
        category: 'functionality',
        severity: 'info',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `External image source detected: ${img.src}`,
        suggestion: 'Consider hosting images locally to prevent broken images if the external source changes',
        elementSelector: null,
        rawText: img.src,
      });
    }
  }
}

module.exports = { analyzeFunctionality };
