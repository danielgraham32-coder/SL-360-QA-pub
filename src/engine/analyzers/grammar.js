/**
 * Grammar analysis module.
 * Checks text content for common grammatical errors, spelling patterns,
 * punctuation issues, and writing quality problems in eLearning content.
 */

// Common grammar rules for eLearning content
const GRAMMAR_RULES = [
  {
    name: 'double-space',
    pattern: /  +/g,
    description: 'Multiple consecutive spaces detected',
    suggestion: 'Use a single space between words',
    severity: 'warning',
  },
  {
    name: 'sentence-capitalization',
    pattern: /(?<=[.!?]\s)[a-z]/g,
    description: 'Sentence does not start with a capital letter',
    suggestion: 'Capitalize the first letter of each sentence',
    severity: 'warning',
  },
  {
    name: 'double-period',
    pattern: /\.{2}(?!\.)/g,
    description: 'Double period found (not an ellipsis)',
    suggestion: 'Use a single period or a proper ellipsis (...)',
    severity: 'warning',
  },
  {
    name: 'space-before-punctuation',
    pattern: /\s+[.,;:!?](?!\s*[.,;:!?])/g,
    description: 'Extra space before punctuation',
    suggestion: 'Remove the space before punctuation marks',
    severity: 'warning',
  },
  {
    name: 'missing-period',
    pattern: /[a-zA-Z]{3,}\s*$/,
    description: 'Text block may be missing ending punctuation',
    suggestion: 'Add appropriate ending punctuation',
    severity: 'info',
  },
  {
    name: 'repeated-word',
    pattern: /\b(\w+)\s+\1\b/gi,
    description: 'Repeated word detected',
    suggestion: 'Remove the duplicate word',
    severity: 'warning',
  },
  {
    name: 'its-vs-its',
    pattern: /\bits\s+(a|an|the|is|was|has|had|would|could|should|will|can|may|might)\b/gi,
    description: "Possible confusion of \"its\" and \"it's\"",
    suggestion: 'Check if \"it\'s\" (it is/it has) is the correct form here',
    severity: 'info',
  },
  {
    name: 'their-there-theyre',
    pattern: /\b(their|there|they're)\b/gi,
    description: null, // Only flag with context analysis
    suggestion: null,
    severity: 'info',
    contextual: true,
  },
  {
    name: 'your-youre',
    pattern: /\byour\s+(is|are|was|were|going|doing|making|getting|being|having)\b/gi,
    description: "Possible misuse of \"your\" instead of \"you're\"",
    suggestion: 'Consider using \"you\'re\" (you are) instead of \"your\"',
    severity: 'warning',
  },
  {
    name: 'affect-effect',
    pattern: /\b(the|an?)\s+affect\b/gi,
    description: 'Possible confusion of \"affect\" (verb) and \"effect\" (noun)',
    suggestion: 'When used as a noun, \"effect\" is usually correct',
    severity: 'info',
  },
  {
    name: 'then-than',
    pattern: /\b(more|less|better|worse|greater|fewer|higher|lower|rather)\s+then\b/gi,
    description: 'Possible confusion of \"then\" and \"than\" in comparison',
    suggestion: 'Use \"than\" for comparisons, \"then\" for time sequences',
    severity: 'warning',
  },
  {
    name: 'a-an',
    pattern: /\ba\s+[aeiou]\w+/gi,
    description: 'Consider using \"an\" before words starting with a vowel sound',
    suggestion: 'Use \"an\" instead of \"a\" before vowel sounds',
    severity: 'info',
    validate: (match) => {
      // Exceptions: words that start with vowel letter but consonant sound
      const exceptions = /\b(a\s+(uni|one|once|euro|user|use[dr]?|usual|util|union|unique|unit|uniform|universal|uranium|utensil))/i;
      return !exceptions.test(match);
    },
  },
  {
    name: 'passive-voice',
    pattern: /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi,
    description: 'Passive voice detected',
    suggestion: 'Consider using active voice for clearer, more engaging eLearning content',
    severity: 'info',
  },
  {
    name: 'very-overuse',
    pattern: /\bvery\s+\w+/gi,
    description: 'Weak modifier \"very\" detected',
    suggestion: 'Replace \"very + adjective\" with a stronger single word for more impactful content',
    severity: 'info',
  },
  {
    name: 'inconsistent-list-punctuation',
    pattern: null, // Handled by custom function
    description: 'Inconsistent punctuation in bullet/list items',
    suggestion: 'Use consistent punctuation across all list items',
    severity: 'warning',
    custom: true,
  },
];

// Common commonly misspelled words in eLearning
const COMMON_MISSPELLINGS = new Map([
  ['accomodate', 'accommodate'],
  ['acheive', 'achieve'],
  ['accross', 'across'],
  ['agressive', 'aggressive'],
  ['apparantly', 'apparently'],
  ['arguement', 'argument'],
  ['begining', 'beginning'],
  ['beleive', 'believe'],
  ['buisness', 'business'],
  ['calender', 'calendar'],
  ['catagory', 'category'],
  ['collegue', 'colleague'],
  ['comming', 'coming'],
  ['commited', 'committed'],
  ['completly', 'completely'],
  ['concious', 'conscious'],
  ['consistant', 'consistent'],
  ['definately', 'definitely'],
  ['dependant', 'dependent'],
  ['develope', 'develop'],
  ['differenciate', 'differentiate'],
  ['dissapear', 'disappear'],
  ['enviroment', 'environment'],
  ['excercise', 'exercise'],
  ['existance', 'existence'],
  ['experiance', 'experience'],
  ['foriegn', 'foreign'],
  ['fourty', 'forty'],
  ['fulfil', 'fulfill'],
  ['goverment', 'government'],
  ['grammer', 'grammar'],
  ['guarentee', 'guarantee'],
  ['harrass', 'harass'],
  ['immediatly', 'immediately'],
  ['independant', 'independent'],
  ['indispensible', 'indispensable'],
  ['knowlege', 'knowledge'],
  ['liason', 'liaison'],
  ['maintenence', 'maintenance'],
  ['managment', 'management'],
  ['millenium', 'millennium'],
  ['mispell', 'misspell'],
  ['neccessary', 'necessary'],
  ['noticable', 'noticeable'],
  ['occassion', 'occasion'],
  ['occured', 'occurred'],
  ['occurence', 'occurrence'],
  ['ommit', 'omit'],
  ['oppurtunity', 'opportunity'],
  ['parliment', 'parliament'],
  ['persistant', 'persistent'],
  ['personel', 'personnel'],
  ['posession', 'possession'],
  ['prefered', 'preferred'],
  ['privelege', 'privilege'],
  ['proffessional', 'professional'],
  ['programing', 'programming'],
  ['pronounciation', 'pronunciation'],
  ['publically', 'publicly'],
  ['realy', 'really'],
  ['recieve', 'receive'],
  ['recomend', 'recommend'],
  ['refered', 'referred'],
  ['relevent', 'relevant'],
  ['rember', 'remember'],
  ['repitition', 'repetition'],
  ['resourse', 'resource'],
  ['responsability', 'responsibility'],
  ['rininging', 'ringing'],
  ['seize', 'seize'],
  ['seperate', 'separate'],
  ['succesful', 'successful'],
  ['supercede', 'supersede'],
  ['suprise', 'surprise'],
  ['tendancy', 'tendency'],
  ['threshhold', 'threshold'],
  ['tommorow', 'tomorrow'],
  ['transfered', 'transferred'],
  ['truely', 'truly'],
  ['untill', 'until'],
  ['wierd', 'weird'],
  ['writting', 'writing'],
]);

/**
 * Analyzes slide text content for grammar issues.
 */
function analyzeGrammar(slide) {
  const findings = [];
  const text = slide.textContent || '';

  if (!text.trim()) return findings;

  // Run pattern-based rules
  for (const rule of GRAMMAR_RULES) {
    if (rule.custom || !rule.pattern) continue;
    if (rule.contextual) continue;

    const matches = text.matchAll(rule.pattern);
    for (const match of matches) {
      if (rule.validate && !rule.validate(match[0])) continue;

      findings.push({
        category: 'grammar',
        severity: rule.severity,
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `${rule.description}: "${match[0].trim()}"`,
        suggestion: rule.suggestion,
        rawText: getContext(text, match.index, 60),
        elementSelector: null,
      });
    }
  }

  // Check for misspellings
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (COMMON_MISSPELLINGS.has(cleaned)) {
      findings.push({
        category: 'grammar',
        severity: 'warning',
        slideNumber: slide.slideNumber,
        slideTitle: slide.title,
        description: `Possible misspelling: "${cleaned}"`,
        suggestion: `Did you mean "${COMMON_MISSPELLINGS.get(cleaned)}"?`,
        rawText: getContext(text, text.toLowerCase().indexOf(cleaned), 60),
        elementSelector: null,
      });
    }
  }

  // Check for inconsistent list punctuation
  checkListConsistency(text, slide, findings);

  // Check for inconsistent capitalization in headings
  checkHeadingConsistency(slide, findings);

  return findings;
}

/**
 * Checks for inconsistent punctuation in list-like content.
 */
function checkListConsistency(text, slide, findings) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 3) return;

  // Check if lines look like a list (similar length, similar structure)
  const endsWithPunctuation = lines.map((l) => /[.;,:]$/.test(l.trim()));
  const hasInconsistency = endsWithPunctuation.some((v) => v !== endsWithPunctuation[0]);

  if (hasInconsistency && lines.length >= 3) {
    findings.push({
      category: 'grammar',
      severity: 'info',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: 'Inconsistent punctuation across text blocks that may be list items',
      suggestion: 'Ensure all list items use consistent ending punctuation',
      rawText: lines.slice(0, 3).join(' | '),
      elementSelector: null,
    });
  }
}

/**
 * Checks for inconsistent heading capitalization styles.
 */
function checkHeadingConsistency(slide, findings) {
  if (!slide.styles) return;

  const headingStyles = slide.styles.filter(
    (s) => parseInt(s.fontSize) >= 20 || parseInt(s.fontWeight) >= 600
  );

  if (headingStyles.length < 2) return;

  const isTitleCase = (text) => /^[A-Z][a-z]/.test(text) && /\s[A-Z]/.test(text);
  const isSentenceCase = (text) => /^[A-Z][a-z]/.test(text) && !/\s[A-Z][a-z]/.test(text);

  const cases = headingStyles.map((h) => ({
    text: h.text,
    titleCase: isTitleCase(h.text),
    sentenceCase: isSentenceCase(h.text),
  }));

  const titleCaseCount = cases.filter((c) => c.titleCase).length;
  const sentenceCaseCount = cases.filter((c) => c.sentenceCase).length;

  if (titleCaseCount > 0 && sentenceCaseCount > 0) {
    findings.push({
      category: 'grammar',
      severity: 'info',
      slideNumber: slide.slideNumber,
      slideTitle: slide.title,
      description: 'Inconsistent heading capitalization (mix of Title Case and Sentence case)',
      suggestion: 'Choose one capitalization style for all headings and apply it consistently',
      rawText: cases.map((c) => c.text).join(' | '),
      elementSelector: null,
    });
  }
}

/**
 * Gets a snippet of text around a match for context.
 */
function getContext(text, index, radius) {
  if (index < 0) return text.substring(0, radius * 2);
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  let context = text.substring(start, end).replace(/\n/g, ' ');
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  return context;
}

module.exports = { analyzeGrammar };
