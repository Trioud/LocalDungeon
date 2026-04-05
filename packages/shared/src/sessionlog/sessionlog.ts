import type { SessionLogEntry, SessionSummary } from './types';

export function buildSessionSummary(
  sessionId: string,
  entries: SessionLogEntry[],
  characterNames: string[],
): SessionSummary {
  let totalRolls = 0;
  let criticalHits = 0;
  let criticalMisses = 0;
  let spellsCast = 0;
  const deathSaves = { successes: 0, failures: 0 };

  let longestCombat = 0;
  let currentCombatRun = 0;

  for (const entry of entries) {
    if (entry.type === 'dice') {
      totalRolls++;
      if (entry.metadata?.roll === 20) criticalHits++;
      if (entry.metadata?.roll === 1) criticalMisses++;
    }

    if (entry.type === 'spell') {
      spellsCast++;
    }

    if (entry.type === 'combat' && entry.metadata?.deathSave === true) {
      if (entry.metadata?.success === true) deathSaves.successes++;
      if (entry.metadata?.failure === true) deathSaves.failures++;
    }

    if (entry.type === 'combat') {
      currentCombatRun++;
      if (currentCombatRun > longestCombat) longestCombat = currentCombatRun;
    } else {
      currentCombatRun = 0;
    }
  }

  return {
    sessionId,
    exportedAt: Date.now(),
    characterNames,
    totalRolls,
    criticalHits,
    criticalMisses,
    spellsCast,
    deathSaves,
    longestCombat,
    entries,
  };
}

export function formatEntryAsText(entry: SessionLogEntry): string {
  const date = new Date(entry.timestamp);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const actor = entry.actor ?? 'System';
  return `[${hh}:${mm}:${ss}] ${actor}: ${entry.message}`;
}

export function exportAsText(summary: SessionSummary): string {
  const lines: string[] = [
    `Session Log — ${summary.sessionId}`,
    `Exported: ${new Date(summary.exportedAt).toISOString()}`,
    `Characters: ${summary.characterNames.join(', ') || 'None'}`,
    '',
    'Stats:',
    `  Total Rolls:      ${summary.totalRolls}`,
    `  Critical Hits:    ${summary.criticalHits}`,
    `  Critical Misses:  ${summary.criticalMisses}`,
    `  Spells Cast:      ${summary.spellsCast}`,
    `  Death Saves:      ${summary.deathSaves.successes} successes / ${summary.deathSaves.failures} failures`,
    `  Longest Combat:   ${summary.longestCombat} turns`,
    '',
    'Entries:',
    ...summary.entries.map(formatEntryAsText),
  ];
  return lines.join('\n');
}

export function exportAsMarkdown(summary: SessionSummary): string {
  const lines: string[] = [
    `## Session Log — ${summary.sessionId}`,
    '',
    `**Exported:** ${new Date(summary.exportedAt).toISOString()}  `,
    `**Characters:** ${summary.characterNames.join(', ') || 'None'}`,
    '',
    '## Stats',
    '',
    '| Stat | Value |',
    '|------|-------|',
    `| Total Rolls | ${summary.totalRolls} |`,
    `| Critical Hits | ${summary.criticalHits} |`,
    `| Critical Misses | ${summary.criticalMisses} |`,
    `| Spells Cast | ${summary.spellsCast} |`,
    `| Death Save Successes | ${summary.deathSaves.successes} |`,
    `| Death Save Failures | ${summary.deathSaves.failures} |`,
    `| Longest Combat | ${summary.longestCombat} turns |`,
    '',
    '## Entries',
    '',
    ...summary.entries.map((e) => `- ${formatEntryAsText(e)}`),
  ];
  return lines.join('\n');
}

export function exportAsJson(summary: SessionSummary): string {
  return JSON.stringify(summary, null, 2);
}
