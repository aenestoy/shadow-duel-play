// Copy aggregate results for every stage before transferring optional raw data.
// Thousands of frame samples can exceed chat/clipboard transfer limits.
export function reportSummary(report) {
  if (!report || !/^shadow-duel-prepared-check-v\d+$/.test(report.report) || !Array.isArray(report.stages)) {
    throw Error('Paste a Shadow Duel prepared-test report.');
  }
  return {
    ...report,
    exportFormat: 'summary-v1',
    rawSamples: 'Per-frame samples omitted from this summary; the full report keeps them.',
    stages: report.stages.map(stage => {
      const { samples, ...summary } = stage;
      return summary;
    }),
  };
}

export function downloadReport(report) {
  const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `${report.report}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
