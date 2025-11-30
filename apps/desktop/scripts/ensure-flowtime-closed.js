#!/usr/bin/env node
/**
 * Ensures that previously launched Flowtime builds are not locking dist files.
 * Windows tends to lock dist/win-unpacked/resources/app.asar while the app is running,
 * which makes subsequent electron-builder runs fail. We attempt to terminate the app
 * gracefully before starting a fresh build.
 */

const { execSync } = require('node:child_process');

const PROCESS_NAMES = {
  win32: 'Flowtime.exe',
  darwin: 'Flowtime',
  linux: 'Flowtime',
};

const platform = process.platform;

function tryExec(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      warnUnable(`Command not available: ${command.split(' ')[0]}.`);
    }
    return false;
  }
}

function warnUnable(message) {
  console.warn(`[ensure-flowtime-closed] ${message}`);
}

function terminateOnWindows() {
  const executable = PROCESS_NAMES.win32;
  const taskListCommand = `tasklist /FI "IMAGENAME eq ${executable}"`;

  try {
    const tasks = execSync(taskListCommand, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

    if (!tasks.includes(executable)) {
      return;
    }
  } catch (error) {
    const diagnostic =
      `${error.stdout?.toString() ?? ''}${error.stderr?.toString() ?? ''}`.toLowerCase();
    if (error.code === 'ENOENT' || diagnostic.includes('not found') || diagnostic.includes('nicht gefunden')) {
      warnUnable('Windows task utilities are not available; skipping automatic termination step.');
    } else {
      warnUnable(`Unable to query running tasks (${error.message.trim()}).`);
    }
    return;
  }

  const killed = tryExec(`taskkill /F /IM ${executable}`);
  if (!killed) {
    warnUnable(`Tried to terminate ${executable} but the operation failed. You may need to close it manually.`);
  } else {
    console.log(`[ensure-flowtime-closed] Terminated ${executable} to allow a clean build.`);
  }
}

function terminateOnUnixFamily() {
  const executable = PROCESS_NAMES[platform];
  // pkill returns non-zero when no process matches; suppress that noise.
  const killed = tryExec(`pkill -f "${executable}"`);
  if (killed) {
    console.log(`[ensure-flowtime-closed] Terminated ${executable} to allow a clean build.`);
  }
}

function main() {
  if (!PROCESS_NAMES[platform]) {
    console.log(`[ensure-flowtime-closed] Unsupported platform (${platform}); skipping process checks.`);
    return;
  }

  if (platform === 'win32') {
    terminateOnWindows();
  } else {
    terminateOnUnixFamily();
  }
}

main();
