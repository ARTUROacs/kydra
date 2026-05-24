const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const DEFAULT_PREFERENCES = {
  theme: 'dark',
  itchDeals: true,
  steamDeals: true,
  steamGameDir: '',
  language: 'en-US',
  currency: 'USD',
  notifications: true,
};

const prefsPath = path.resolve(os.homedir(), '.kydra-preferences.json');
const versionPath = path.resolve(__dirname, '..', '..', 'version.txt');

function getVersion() {
  try {
    return fs.readFileSync(versionPath, 'utf8').trim() || 'Unknown Version';
  } catch (error) {
    console.error('[app] failed to read version:', error);
    return 'Unknown Version';
  }
}

function ensurePrefsFile() {

    const dir = path.dirname(prefsPath)

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    if (!fs.existsSync(prefsPath)) {

        fs.writeFileSync(
            prefsPath,
            JSON.stringify(DEFAULT_PREFERENCES, null, 2),
            'utf8'
        )

    }
}

function loadPreferences() {
  try {
    ensurePrefsFile();
    const content = fs.readFileSync(prefsPath, 'utf8');
    const stored = JSON.parse(content || '{}');
    return Object.assign({}, DEFAULT_PREFERENCES, stored);
  } catch (error) {
    console.error('[preferences] failed to load preferences:', error);
    return Object.assign({}, DEFAULT_PREFERENCES);
  }
}

function savePreferences(preferences) {
  try {
    ensurePrefsFile();
    const prefs = Object.assign({}, DEFAULT_PREFERENCES, preferences);
    fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf8');
    return prefs;
  } catch (error) {
    console.error('[preferences] failed to save preferences:', error);
    throw error;
  }
}

function getPreference(key) {
  const prefs = loadPreferences();
  return prefs[key];
}

function setPreference(key, value) {
  const prefs = loadPreferences();
  prefs[key] = value;
  return savePreferences(prefs);
}

function parseVersion(versionString) {
  const match = versionString.match(/(\d+)\.(\d+)\.(\d+)([a-z])?/i);
  if (!match) return null;
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3]),
    suffix: match[4] || '',
    original: versionString
  };
}

function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  if (!p1 || !p2) return 0;
  if (p1.year !== p2.year) return p1.year - p2.year;
  if (p1.month !== p2.month) return p1.month - p2.month;
  if (p1.day !== p2.day) return p1.day - p2.day;
  return p1.suffix.localeCompare(p2.suffix);
}

function getGitHubVersion() {
  return new Promise((resolve) => {
    const url = 'https://raw.githubusercontent.com/k7sistemas/kydra/main/version.txt';
    const request = https.get(url, { timeout: 5000 }, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const version = data.trim();
          resolve(version || null);
        } catch {
          resolve(null);
        }
      });
    });
    request.on('error', () => { resolve(null); });
    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

async function checkForUpdates() {
  try {
    const localVersion = getVersion();
    if (localVersion === 'Unknown Version') return null;
    const githubVersion = await getGitHubVersion();
    if (!githubVersion) return null;
    if (compareVersions(githubVersion, localVersion) > 0) {
      return githubVersion;
    }
    return null;
  } catch (error) {
    console.error('[app] failed to check for updates:', error);
    return null;
  }
}

module.exports = {
  DEFAULT_PREFERENCES,
  prefsPath,
  loadPreferences,
  savePreferences,
  getPreference,
  setPreference,
  getVersion,
  checkForUpdates,
  parseVersion,
  compareVersions,
  getGitHubVersion,
};
