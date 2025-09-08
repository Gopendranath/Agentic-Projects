import { exec, spawn } from "child_process";
import { mouse, keyboard, Button, Point, screen } from "@nut-tree-fork/nut-js";
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

// ✅ Fixed: Open application (non-blocking)
export async function openApp(appName) {
  try {
    const parts = appName.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref(); // detach so Node isn’t tied to the child process

    // Optional small delay to let it start
    await sleep(2000);

    return `🚀 App '${appName}' launched.`;
  } catch (err) {
    return `❌ Error opening app: ${err.message}`;
  }
}

// Move mouse to (x, y)
export async function moveMouse(x, y) {
  await sleep(2000);
  await mouse.setPosition(new Point(x, y));
  return `Mouse moved to (${x}, ${y})`;
}

// Click mouse button
export async function mouseClick(button = "left") {
  await sleep(2000);
  const btn =
    button === "right" ? Button.RIGHT :
    button === "middle" ? Button.MIDDLE :
    Button.LEFT;
  await mouse.click(btn);
  return `Mouse clicked with ${button} button`;
}

export async function clickImage(imagePath) {
  const region = await screen.find(imagePath); // locate button on screen
  await mouse.setPosition(new Point(region.left + region.width/2, region.top + region.height/2));
  await mouse.click(Button.LEFT);
  return `Clicked on ${imagePath}`;
}

keyboard.config.autoDelayMs = 10;

// Type text at cursor
export async function typeText(text) {
  await sleep(2000);
  await keyboard.type(text);
  return `Typed: ${text}`;
}

// Write to a file
export async function writeFile(path, content) {
  await sleep(2000);
  fs.writeFileSync(path, content, "utf8");
  return `File written to ${path}`;
}

export async function createFile(path) {
  await sleep(2000);
  fs.writeFileSync(path, "", "utf8");
  return `File created at ${path}`;
}

export function makeDirectory(path) {
  fs.mkdirSync(path, { recursive: true });
  return `Directory created at ${path}`;
}
