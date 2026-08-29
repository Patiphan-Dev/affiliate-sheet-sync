/**
 * Triggers.gs — run installTriggers() once (from the editor) to schedule the
 * automation. Re-run any time to reset the schedule.
 */

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncContent').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('generateCaptions').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('postNextToPage').timeBased().everyHours(3).create();
  return 'ok — 3 triggers installed';
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  return 'ok — all triggers removed';
}

/** Manual end-to-end run for testing (check View → Logs afterwards). */
function runOnceNow() {
  Logger.log('syncContent → %s', syncContent());
  Logger.log('generateCaptions → %s', generateCaptions());
  Logger.log('postNextToPage → %s', postNextToPage());
}
