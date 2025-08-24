import {
  shutdownSystem,
  restartSystem,
  openApp,
  moveMouse,
  mouseClick,
  typeText,
  writeFile,
  sleep,
  clickImage,
  runCommand,
  makeDirectory
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

const runCommandTool = tool(async ({ command }) => await runCommand(command), {
  name: "run_command",
  description: "Runs a shell command.",
  schema: z.object({
    command: z.string().describe("The command to run."),
  }),
})

const makeDirectoryTool = tool(async ({ path }) => await makeDirectory(path), {
  name: "make_directory",
  description: "Creates a directory.",
  schema: z.object({
    path: z.string().describe("The path to the directory."),
  }),
});


const clickImageTool = tool(async ({ imagePath }) => {
  try {
    return await clickImage(imagePath);
  } catch (err) {
    return `Error: Could not find image ${imagePath}`;
  }
}, {
  name: "click_image",
  description: "Clicks an image on the screen.",
  schema: z.object({
    imagePath: z.string().describe("The path to the image file."),
  }),
});


// ------------------ MODEL ------------------
const model = new ChatMistralAI({
  model: "mistral-small-latest",
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
- run_command { command: string } → runs a shell command.
- make_directory { path: string } → creates a directory at the given path.

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
  tools: [shutdownTool, restartTool, openAppTool, moveMouseTool, mouseClickTool, typeTextTool, writeFileTool, sleepTool, runCommandTool, makeDirectoryTool],
  prompt,
});

// ------------------ RUN ------------------
(async () => {
  const response = await agent.invoke(
    {
      messages: [{
        role: "user",
        content: `In this current working directory create a project folder name as TODO. 
                  Inside that todo folder create a todo app using html css and js.
                  After creating all the files, open that html file using full pathname in browser like open_app { appName: "start D:\\Codes\\Agentic-Projects\\TODO\\index.html" }.`
      }]
    },
    { configurable: { userName: "Computer agent" } }
  );

  console.log(response);
})();
