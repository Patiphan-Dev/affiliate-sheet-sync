/**
 * Sanitize.gs — makes model-written HTML safe for the website, which renders
 * article bodies with dangerouslySetInnerHTML. The model's input includes
 * buyer reviews (untrusted text), so its output is treated as hostile too.
 *
 * Allowlist only: listed tags survive with every attribute stripped; any other
 * tag is removed; every remaining < or > is escaped, so a malformed or unclosed
 * tag can never reach the browser as markup.
 */

const ARTICLE_TAGS = { h3: true, p: true, ul: true, ol: true, li: true, strong: true, em: true, blockquote: true };

function sanitizeArticleHtml_(html) {
  const kept = [];
  const placeholder = function (tag) {
    kept.push(tag);
    return '\u0000' + (kept.length - 1) + '\u0000';
  };

  return String(html || '')
    .replace(/\u0000/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(\/?)([a-z][a-z0-9]*)\b[^<>]*>/gi, function (_, slash, name) {
      const tag = name.toLowerCase();
      return ARTICLE_TAGS[tag] ? placeholder('<' + slash + tag + '>') : '';
    })
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u0000(\d+)\u0000/g, function (_, i) { return kept[Number(i)]; })
    .trim();
}

/** Plain text, for fields the site renders as text (title, summary, FAQ). */
function plainText_(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
