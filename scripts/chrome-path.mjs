// Shared Chrome discovery for every playwright-core script in this repo. Set CHROME_PATH to
// override. GitHub's hosted ubuntu-latest runners ship google-chrome-stable pre-installed; local
// Windows and macOS installs are checked too.
import { existsSync } from 'node:fs';

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

export function findChrome() {
  const executablePath = process.env.CHROME_PATH ?? CHROME_PATHS.find((p) => existsSync(p));
  if (!executablePath) {
    throw new Error(
      'Chrome not found in any known location; set CHROME_PATH to its executable, or install google-chrome-stable.'
    );
  }
  return executablePath;
}
