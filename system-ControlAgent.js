import {
  shutdownSystem,
  restartSystem,
  openApp,
  moveMouse,
  mouseClick,
  typeText,
  writeFile,
  sleep
} from "./systemControl.js";
import { ChatMistralAI } from "@langchain/mistralai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// ------------------ TOOLS ------------------
const shutdownTool = tool(async () => await shutdownSystem(), {
  name: "shutdown_system",
  description: "Shuts down the computer immediately.",
});

const restartTool = tool(async () => await restartSystem(), {
  name: "restart_system",
  description: "Restarts the computer immediately.",
});

const sleepTool = tool(async ({ duration }) => await sleep(duration), {
  name: "sleep",
  description: "Sleeps for a specified duration in milliseconds.",
  schema: z.object({
    duration: z.number().describe("The duration to sleep in milliseconds."),
  }),
})

const openAppTool = tool(async ({ appName }) => await openApp(appName), {
  name: "open_app",
  description: "Opens an application.",
  schema: z.object({
    appName: z.string().describe("The name of the application to open."),
  }),
});

const moveMouseTool = tool(async ({ x, y }) => await moveMouse(x, y), {
  name: "move_mouse",
  description: "Moves the mouse to a specific position.",
  schema: z.object({
    x: z.number().describe("The x-coordinate of the mouse position."),
    y: z.number().describe("The y-coordinate of the mouse position."),
  }),
});

const mouseClickTool = tool(async ({ button }) => await mouseClick(button || "left"), {
  name: "mouse_click",
  description: "Clicks the mouse.",
  schema: z.object({
    button: z.string().optional().describe("The button to click (e.g., left, right, middle)."),
  }),
});

const typeTextTool = tool(async ({ text }) => await typeText(text), {
  name: "type_text",
  description: "Types text.",
  schema: z.object({
    text: z.string().describe("The text to type."),
  }),
});

const writeFileTool = tool(async ({ path, content }) => await writeFile(path, content), {
  name: "write_file",
  description: "Writes content to a file.",
  schema: z.object({
    path: z.string().describe("The path to the file."),
    content: z.string().describe("The content to write to the file."),
  }),
});

// ------------------ MODEL ------------------
const model = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

// ------------------ PROMPT ------------------
const prompt = (state, config) => {
  const userName = config.configurable?.userName || "User";

  const systemMsg = `
You are a helpful system control assistant. 
Address the user as ${userName}.
You have access to tools that can control the user's computer.

Available operations:
- shutdown_system → shuts down the computer immediately.
- restart_system → restarts the computer immediately.
- open_app { appName: string } → opens an application by name. Example: { "appName": "chrome" }
- move_mouse { x: number, y: number } → moves the mouse pointer to (x, y).
- mouse_click { button?: string } → clicks the mouse (default: "left").
- type_text { text: string } → types the given text at the cursor location.
- write_file { path: string, content: string } → writes content into a file at the given path.
- sleep { duration: number } → sleeps for the given duration in milliseconds.

Rules:
1. Only use the tools for actual execution.
2. If unsure about a command, ask the user for clarification.
3. Always explain what action you are about to perform before executing it.
`;

  return [{ role: "system", content: systemMsg }, ...state.messages];
};

// ------------------ AGENT ------------------
const agent = createReactAgent({
  llm: model,
  tools: [shutdownTool, restartTool, openAppTool, moveMouseTool, mouseClickTool, typeTextTool, writeFileTool, sleepTool],
  prompt,
});

// ------------------ RUN ------------------
(async () => {
  const response = await agent.invoke(
    {
      messages: [{ role: "user", content: "Open notepad and write a story about Nikola Tesla within 100 words" }],
    },
    { configurable: { userName: "Computer agent" } }
  );

  console.log(response);
})();
