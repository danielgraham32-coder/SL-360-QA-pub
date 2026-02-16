const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'screenshots');
const MAX_SLIDES = 200;
const NAVIGATION_TIMEOUT = 10000;
const SLIDE_WAIT = 2000;

/**
 * Crawls an eLearning course by navigating through it like a learner.
 * Supports Storyline 360 HTML5 output and generic eLearning HTML pages.
 *
 * For Storyline 360 courses, the crawler:
 * - Detects the Storyline player frame
 * - Clicks the Next button to advance through slides
 * - Extracts text content from each slide
 * - Captures screenshots of each slide state
 */
async function crawlCourse(url, reviewId) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const reviewScreenshotDir = path.join(SCREENSHOT_DIR, reviewId);
  fs.mkdirSync(reviewScreenshotDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const slides = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);

    const courseType = await detectCourseType(page);

    if (courseType === 'storyline') {
      await crawlStoryline(page, slides, reviewScreenshotDir, reviewId);
    } else {
      await crawlGenericElearning(page, slides, reviewScreenshotDir, reviewId);
    }
  } finally {
    await browser.close();
  }

  return slides;
}

/**
 * Detects whether this is a Storyline course, Rise, or generic HTML.
 */
async function detectCourseType(page) {
  const isStoryline = await page.evaluate(() => {
    // Storyline 360 markers
    return !!(
      document.querySelector('[data-storyline]') ||
      document.querySelector('#slide') ||
      document.querySelector('.slide-layer') ||
      document.querySelector('[class*="player"]') ||
      document.querySelector('iframe[src*="story_content"]') ||
      document.title.toLowerCase().includes('storyline') ||
      window.Story ||
      window.story
    );
  });

  if (isStoryline) return 'storyline';
  return 'generic';
}

/**
 * Crawls a Storyline 360 course by interacting with the player.
 */
async function crawlStoryline(page, slides, screenshotDir, reviewId) {
  let slideNumber = 0;
  let previousContent = '';
  let stuckCount = 0;

  while (slideNumber < MAX_SLIDES) {
    slideNumber++;
    await page.waitForTimeout(SLIDE_WAIT);

    // Try to get into the Storyline iframe if present
    const frame = await getStorylineFrame(page);
    const context = frame || page;

    // Extract text content from current slide
    const slideData = await context.evaluate(() => {
      const textElements = document.querySelectorAll(
        'p, span, div, h1, h2, h3, h4, h5, h6, [class*="text"], [class*="caption"], [role="heading"]'
      );

      const texts = new Set();
      textElements.forEach((el) => {
        const text = el.innerText?.trim();
        if (text && text.length > 1) {
          texts.add(text);
        }
      });

      const title =
        document.querySelector('[class*="title"], h1, [role="heading"]')?.innerText?.trim() || '';

      // Collect style information
      const styles = [];
      textElements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const text = el.innerText?.trim();
        if (text && text.length > 1) {
          styles.push({
            text: text.substring(0, 100),
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            selector: generateSelector(el),
          });
        }
      });

      // Collect link/button information
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], [onclick], [class*="btn"], [class*="hotspot"]'
      );
      const interactions = [];
      interactiveElements.forEach((el) => {
        interactions.push({
          type: el.tagName.toLowerCase(),
          text: el.innerText?.trim() || el.getAttribute('aria-label') || '',
          href: el.href || '',
          isVisible: el.offsetParent !== null,
          selector: generateSelector(el),
        });
      });

      // Collect image alt text
      const images = document.querySelectorAll('img');
      const imageData = [];
      images.forEach((img) => {
        imageData.push({
          src: img.src,
          alt: img.alt || '',
          hasAlt: img.hasAttribute('alt'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      });

      function generateSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
          return `${el.tagName.toLowerCase()}.${el.className.split(' ').join('.')}`;
        }
        return el.tagName.toLowerCase();
      }

      return {
        textContent: Array.from(texts).join('\n'),
        title,
        styles,
        interactions,
        images: imageData,
      };
    });

    // Check if we're stuck on the same content
    if (slideData.textContent === previousContent) {
      stuckCount++;
      if (stuckCount >= 3) break; // We've exhausted the slides
    } else {
      stuckCount = 0;
    }
    previousContent = slideData.textContent;

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, `slide_${slideNumber}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    slides.push({
      slideNumber,
      title: slideData.title || `Slide ${slideNumber}`,
      textContent: slideData.textContent,
      styles: slideData.styles,
      interactions: slideData.interactions,
      images: slideData.images,
      screenshotPath,
      url: page.url(),
    });

    // Try to advance to next slide
    const advanced = await advanceStorylineSlide(page, context);
    if (!advanced) break;
  }
}

/**
 * Gets the Storyline content iframe if one exists.
 */
async function getStorylineFrame(page) {
  const frames = page.frames();
  for (const frame of frames) {
    const url = frame.url();
    if (
      url.includes('story_content') ||
      url.includes('story.html') ||
      url.includes('slide')
    ) {
      return frame;
    }
  }
  return null;
}

/**
 * Attempts to advance to the next slide in a Storyline course.
 */
async function advanceStorylineSlide(page, context) {
  // Common Storyline next button selectors
  const nextSelectors = [
    '[data-acc-text="Next"]',
    '[aria-label="Next"]',
    '[aria-label="next"]',
    '.next-btn',
    '.nav-next',
    '[class*="next"]',
    'button[title="Next"]',
    '[data-ref="next"]',
    '#next-btn',
    '#next',
  ];

  for (const selector of nextSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn) {
        const isVisible = await page.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }, btn);

        if (isVisible) {
          await btn.click();
          await page.waitForTimeout(NAVIGATION_TIMEOUT);
          return true;
        }
      }
    } catch {
      continue;
    }
  }

  // Try context (iframe) as well
  if (context !== page) {
    for (const selector of nextSelectors) {
      try {
        const btn = await context.$(selector);
        if (btn) {
          await btn.click();
          await page.waitForTimeout(NAVIGATION_TIMEOUT);
          return true;
        }
      } catch {
        continue;
      }
    }
  }

  // Last resort: try keyboard navigation
  try {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(SLIDE_WAIT);
    return true;
  } catch {
    return false;
  }
}

/**
 * Crawls a generic eLearning HTML page (non-Storyline).
 */
async function crawlGenericElearning(page, slides, screenshotDir, reviewId) {
  // For generic pages, treat each navigable section or page as a "slide"
  const slideData = await page.evaluate(() => {
    const allText = document.body.innerText || '';
    const title = document.title || '';

    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td');
    const styles = [];
    const texts = new Set();

    textElements.forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length > 1) {
        texts.add(text);
        const computed = window.getComputedStyle(el);
        styles.push({
          text: text.substring(0, 100),
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          lineHeight: computed.lineHeight,
          letterSpacing: computed.letterSpacing,
        });
      }
    });

    const links = Array.from(document.querySelectorAll('a')).map((a) => ({
      type: 'a',
      text: a.innerText?.trim() || '',
      href: a.href || '',
      isVisible: a.offsetParent !== null,
    }));

    const images = Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.src,
      alt: img.alt || '',
      hasAlt: img.hasAttribute('alt'),
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));

    return {
      textContent: Array.from(texts).join('\n'),
      title,
      styles,
      interactions: links,
      images,
    };
  });

  const screenshotPath = path.join(screenshotDir, 'page_1.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  slides.push({
    slideNumber: 1,
    title: slideData.title || 'Page 1',
    textContent: slideData.textContent,
    styles: slideData.styles,
    interactions: slideData.interactions,
    images: slideData.images,
    screenshotPath,
    url: page.url(),
  });

  // Follow internal navigation links
  const navLinks = await page.evaluate((baseUrl) => {
    const links = document.querySelectorAll('a[href]');
    const internal = [];
    links.forEach((a) => {
      try {
        const linkUrl = new URL(a.href);
        const base = new URL(baseUrl);
        if (linkUrl.origin === base.origin && a.href !== baseUrl) {
          internal.push(a.href);
        }
      } catch { /* skip invalid URLs */ }
    });
    return [...new Set(internal)].slice(0, 50);
  }, page.url());

  let slideNumber = 1;
  for (const link of navLinks) {
    if (slideNumber >= MAX_SLIDES) break;
    slideNumber++;

    try {
      await page.goto(link, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(1500);

      const pageData = await page.evaluate(() => {
        const texts = new Set();
        document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li').forEach((el) => {
          const t = el.innerText?.trim();
          if (t && t.length > 1) texts.add(t);
        });

        const textEls = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li');
        const styles = [];
        textEls.forEach((el) => {
          const text = el.innerText?.trim();
          if (text && text.length > 1) {
            const computed = window.getComputedStyle(el);
            styles.push({
              text: text.substring(0, 100),
              fontFamily: computed.fontFamily,
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              color: computed.color,
              backgroundColor: computed.backgroundColor,
            });
          }
        });

        const images = Array.from(document.querySelectorAll('img')).map((img) => ({
          src: img.src,
          alt: img.alt || '',
          hasAlt: img.hasAttribute('alt'),
        }));

        return {
          textContent: Array.from(texts).join('\n'),
          title: document.title || '',
          styles,
          interactions: [],
          images,
        };
      });

      const ssPath = path.join(screenshotDir, `page_${slideNumber}.png`);
      await page.screenshot({ path: ssPath, fullPage: true });

      slides.push({
        slideNumber,
        title: pageData.title || `Page ${slideNumber}`,
        textContent: pageData.textContent,
        styles: pageData.styles,
        interactions: pageData.interactions,
        images: pageData.images,
        screenshotPath: ssPath,
        url: link,
      });
    } catch {
      // Skip pages that fail to load
    }
  }
}

module.exports = { crawlCourse };
