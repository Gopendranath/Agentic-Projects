import { exec } from "child_process";
import { mouse, keyboard, Button, Point } from "@nut-tree-fork/nut-js";
import fs from "fs";

// Run a shell command (cross-platform)
export function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(`Error: ${error.message}`);
      else if (stderr) reject(`Stderr: ${stderr}`);
      else resolve(stdout.trim());
    });
  });
}

// Shutdown system
export async function shutdownSystem() {
  const cmd = process.platform === "win32" ? "shutdown /s /t 0" : "shutdown now";
  return runCommand(cmd);
}

// Restart system
export async function restartSystem() {
  const cmd = process.platform === "win32" ? "shutdown /r /t 0" : "reboot";
  return runCommand(cmd);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Open application (e.g., Chrome, VS Code)
export async function openApp(appName) {
  const cmd =
    process.platform === "win32"
      ? `start ${appName}`
      : process.platform === "darwin"
      ? `open -a "${appName}"`
      : appName;

  const result = await runCommand(cmd);

  // Example: wait 1 second after opening app
  await sleep(2000);

  return result || `Opened ${appName}`;
}

// Move mouse to (x, y)
export async function moveMouse(x, y) {
  await mouse.setPosition(new Point(x, y));
  return `Mouse moved to (${x}, ${y})`;
}

// Click mouse button
export async function mouseClick(button = "left") {
  const btn =
    button === "right" ? Button.RIGHT :
    button === "middle" ? Button.MIDDLE :
    Button.LEFT;
  await mouse.click(btn);
  return `Mouse clicked with ${button} button`;
}


keyboard.config.autoDelayMs = 10;
// Type text at cursor
export async function typeText(text) {
  await sleep(2000);
  await keyboard.type(text);
  return `Typed: ${text}`;
}

// Write to a file
export function writeFile(path, content) {
  fs.writeFileSync(path, content, "utf8");
  return `File written to ${path}`;
}

typeText("Hello, world!");