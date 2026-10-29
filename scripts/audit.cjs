const { spawnSync } = require('node:child_process');

const advisoryUrl = 'https://github.com/advisories/GHSA-gcqx-w48m-w2h4';
const expires = '2026-11-28T00:00:00.000Z';
const allowedPackages = new Set([
  'deepmerge', 'jest-config', '@jest/core', 'jest-cli', 'jest', 'ts-jest',
]);
const severities = ['info', 'low', 'moderate', 'high', 'critical'];

function evaluateAudit(report, status, now = new Date()) {
  if (!Number.isFinite(now.getTime()) || now >= new Date(expires)) {
    throw new Error(`Audit exception expired at ${expires}; review and remove it.`);
  }
  if (!report || report.error || report.auditReportVersion !== 2 ||
      !report.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
      Array.isArray(report.vulnerabilities)) {
    throw new Error('Invalid npm audit report.');
  }

  const entries = Object.entries(report.vulnerabilities);
  const counts = Object.fromEntries(severities.map(severity => [severity, 0]));
  for (const [name, vulnerability] of entries) {
    if (!vulnerability || vulnerability.name !== name ||
        !severities.includes(vulnerability.severity) ||
        !Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
      throw new Error(`Invalid vulnerability entry: ${name}`);
    }
    counts[vulnerability.severity]++;
  }
  const totals = report.metadata?.vulnerabilities;
  if (!totals || totals.total !== entries.length ||
      severities.some(severity => totals[severity] !== counts[severity]) ||
      status !== (entries.length ? 1 : 0)) {
    throw new Error('npm audit failed or returned inconsistent vulnerability counts.');
  }

  function isExcepted(name, ancestors = new Set()) {
    const vulnerability = report.vulnerabilities[name];
    if (!Object.hasOwn(report.vulnerabilities, name) || !vulnerability ||
        !allowedPackages.has(name) || vulnerability.severity !== 'low' ||
        ancestors.has(name)) {
      return false;
    }
    const visited = new Set([...ancestors, name]);
    return vulnerability.via.every(via => {
      if (typeof via === 'string') return isExcepted(via, visited);
      return name === 'deepmerge' && via && via.name === 'deepmerge' &&
        via.dependency === 'deepmerge' && via.severity === 'low' &&
        via.url === advisoryUrl && via.range === '>=4.2.0 <=4.3.1';
    });
  }

  const blocked = entries.filter(([name]) => !isExcepted(name)).map(([name]) => name);
  if (blocked.length) {
    throw new Error(`Unexcepted npm audit findings: ${blocked.join(', ')}`);
  }
  return entries.map(([name]) => name);
}

function main() {
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, 'audit', '--json', '--include=dev', '--audit-level=low'],
    { encoding: 'utf8' },
  );
  // Keep the complete audit report visible, including excepted findings.
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  try {
    if (result.error || result.signal || !process.env.npm_execpath) {
      throw new Error('Could not execute npm audit.');
    }
    const accepted = evaluateAudit(JSON.parse(result.stdout), result.status);
    if (accepted.length) {
      console.warn(`Temporary exception: ${advisoryUrl}; expires ${expires}; packages: ${accepted.join(', ')}`);
    } else {
      console.log('No findings; remove the obsolete audit exception after verifying the upstream fix.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { evaluateAudit, main };
if (require.main === module) main();
