jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }));

const { spawnSync } = require('node:child_process');
const { evaluateAudit, main } = require('../../scripts/audit.cjs');

const now = new Date('2026-10-29T12:00:00Z');

function makeReport() {
  const vulnerability = (name, via) => ({ name, severity: 'low', via });
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      deepmerge: vulnerability('deepmerge', [{
        name: 'deepmerge',
        dependency: 'deepmerge',
        severity: 'low',
        url: 'https://github.com/advisories/GHSA-gcqx-w48m-w2h4',
        range: '>=4.2.0 <=4.3.1',
      }]),
      'jest-config': vulnerability('jest-config', ['deepmerge']),
      '@jest/core': vulnerability('@jest/core', ['jest-config']),
      'jest-cli': vulnerability('jest-cli', ['@jest/core', 'jest-config']),
      jest: vulnerability('jest', ['@jest/core', 'jest-cli']),
      'ts-jest': vulnerability('ts-jest', ['jest']),
    },
    metadata: {
      vulnerabilities: { info: 0, low: 6, moderate: 0, high: 0, critical: 0, total: 6 },
    },
  };
}

describe('temporary audit exception', () => {
  test('accepts only the six findings attributable to the approved advisory', () => {
    const report = makeReport();
    expect(evaluateAudit(report, 1, now)).toEqual(Object.keys(report.vulnerabilities));
  });

  describe('audit command', () => {
    let originalExitCode;
    let originalNpmPath;

    beforeEach(() => {
      originalExitCode = process.exitCode;
      originalNpmPath = process.env.npm_execpath;
      process.exitCode = 0;
      process.env.npm_execpath = '/npm-cli.js';
      jest.useFakeTimers().setSystemTime(now);
      jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      process.exitCode = originalExitCode;
      if (originalNpmPath === undefined) delete process.env.npm_execpath;
      else process.env.npm_execpath = originalNpmPath;
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    test('runs a full development-inclusive audit and prints the unfiltered report', () => {
      const stdout = JSON.stringify(makeReport());
      spawnSync.mockReturnValue({ stdout, stderr: '', status: 1 });
      main();
      expect(spawnSync).toHaveBeenLastCalledWith(
        process.execPath,
        ['/npm-cli.js', 'audit', '--json', '--include=dev', '--audit-level=low'],
        { encoding: 'utf8' },
      );
      expect(process.stdout.write).toHaveBeenCalledWith(stdout);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('2026-11-28'));
      expect(process.exitCode).toBe(0);
    });

    test.each([
      ['malformed JSON', { stdout: '{', stderr: '', status: 1 }],
      ['network failure', { stdout: '{"error":{"code":"ENETUNREACH"}}', stderr: '', status: 1 }],
      ['execution failure', { error: new Error('spawn failed'), status: null }],
      ['signal', { stdout: JSON.stringify(makeReport()), signal: 'SIGTERM', status: null }],
      ['unexpected exit', { stdout: JSON.stringify(makeReport()), status: 2 }],
    ])('fails for %s', (_name, result) => {
      spawnSync.mockReturnValue(result);
      main();
      expect(process.exitCode).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('accepts a clean report before expiry', () => {
    const report = makeReport();
    report.vulnerabilities = {};
    report.metadata.vulnerabilities.low = 0;
    report.metadata.vulnerabilities.total = 0;
    expect(evaluateAudit(report, 0, now)).toEqual([]);
  });

  test.each([
    ['new advisory on deepmerge', report => {
      report.vulnerabilities.deepmerge.via.push({
        ...report.vulnerabilities.deepmerge.via[0],
        url: 'https://github.com/advisories/GHSA-other',
      });
    }],
    ['new advisory on a parent', report => {
      report.vulnerabilities.jest.via.push({ url: 'https://github.com/advisories/GHSA-other' });
    }],
    ['new affected package', report => {
      report.vulnerabilities.other = { name: 'other', severity: 'low', via: ['deepmerge'] };
      report.metadata.vulnerabilities.low++;
      report.metadata.vulnerabilities.total++;
    }],
    ['increased severity', report => {
      report.vulnerabilities.deepmerge.severity = 'moderate';
      report.metadata.vulnerabilities.low--;
      report.metadata.vulnerabilities.moderate++;
    }],
    ['increased advisory severity', report => {
      report.vulnerabilities.deepmerge.via[0].severity = 'moderate';
    }],
    ['expanded affected versions', report => {
      report.vulnerabilities.deepmerge.via[0].range = '>=4.2.0';
    }],
    ['missing dependency', report => {
      report.vulnerabilities.jest.via = ['missing'];
    }],
    ['cyclic dependency', report => {
      report.vulnerabilities.deepmerge.via = ['jest'];
    }],
    ['empty causes', report => {
      report.vulnerabilities.jest.via = [];
    }],
    ['invalid cause', report => {
      report.vulnerabilities.jest.via = [null];
    }],
    ['mismatched name', report => {
      report.vulnerabilities.jest.name = 'other';
    }],
    ['inconsistent counts', report => {
      report.metadata.vulnerabilities.total = 0;
    }],
    ['missing metadata', report => {
      delete report.metadata;
    }],
    ['npm error', report => {
      report.error = { code: 'ENETUNREACH' };
    }],
    ['unexpected schema version', report => {
      report.auditReportVersion = 3;
    }],
  ])('blocks %s', (_name, mutate) => {
    const report = makeReport();
    mutate(report);
    expect(() => evaluateAudit(report, 1, now)).toThrow();
  });

  test.each([null, {}, { vulnerabilities: [] }])('rejects malformed reports: %j', report => {
    expect(() => evaluateAudit(report, 1, now)).toThrow();
  });

  test.each([null, 0, 2])('rejects unexpected npm exit status %j', status => {
    expect(() => evaluateAudit(makeReport(), status, now)).toThrow();
  });

  test.each([
    '2026-11-28T00:00:00Z',
    '2026-11-29T00:00:00Z',
    'invalid date',
  ])('fails closed at expiry or with an invalid date: %s', date => {
    expect(() => evaluateAudit(makeReport(), 1, new Date(date))).toThrow();
  });

  test('accepts the approved report immediately before expiry', () => {
    expect(evaluateAudit(makeReport(), 1, new Date('2026-11-27T23:59:59.999Z'))).toHaveLength(6);
  });
});
