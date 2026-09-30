/** HTML → readable plain text (for llms-full.txt). Input is our own sanitised article HTML. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|tr|table|ul|ol)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<h([1-6])[^>]*>/gi, (_, n: string) => `\n${'#'.repeat(Number(n))} `)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
