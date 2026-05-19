const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_PREFERENCES = {
  theme: 'dark',
  steamGameDir: 'C:\\Program Files (x86)\\Steam\\steamapps\\common',
  language: 'en-US',
  loggedIn: [],
  notifications: true,
};

const prefsPath = path.resolve(os.homedir(), '.kydra-preferences.json');

function getVersion() {
  const versionPath = path.join(__dirname, '..', '..', 'version.txt');
  
  return fs.readFileSync(versionPath, 'utf8').trim();
}

console.log(getVersion());

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

module.exports = {
  DEFAULT_PREFERENCES,
  prefsPath,
  loadPreferences,
  savePreferences,
  getPreference,
  setPreference,
};
