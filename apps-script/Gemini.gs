/**
 * Gemini.gs — the one place that talks to the Gemini API.
 */

/**
 * Send one prompt, return the first candidate's text ('' on any API error, which
 * is logged — callers treat '' as "skip this row, retry next run").
 */
function geminiGenerate_(key, prompt, generationConfig) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    CFG.geminiModel() + ':generateContent?key=' + key;

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: generationConfig,
    }),
  });

  if (res.getResponseCode() !== 200) {
    Logger.log('Gemini %s: %s', res.getResponseCode(), res.getContentText().slice(0, 300));
    return '';
  }
  const j = JSON.parse(res.getContentText());
  const parts = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
  return (parts && parts[0] && parts[0].text || '').trim();
}
