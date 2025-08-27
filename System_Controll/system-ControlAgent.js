import { 
  shutdownTool,
  restartTool,
  sleepTool,
  openAppTool,
  moveMouseTool,
  mouseClickTool,
  typeTextTool,
  writeFileTool,
  runCommandTool,
  makeDirectoryTool,
  clickImageTool
 } from "./Tools.js";
import { ChatMistralAI } from "@langchain/mistralai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";

dotenv.config();


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
  tools: [shutdownTool, restartTool, openAppTool,
    moveMouseTool, mouseClickTool, typeTextTool,
    writeFileTool, sleepTool, runCommandTool,
    makeDirectoryTool],
  prompt,
});

// ------------------ RUN ------------------
// (async () => {
//   const response = await agent.invoke(
//     {
//       messages: [{
//         role: "user",
//         content: `In this current working directory create a project folder name as TODO. 
//                   Inside that todo folder create a todo app using html css and js.
//                   After creating all the files, open that html file using full pathname in browser 
//                   like open_app { appName: "start D:\\Codes\\Agentic-Projects\\TODO\\index.html" }.`
//       }]
//     },
//     { configurable: { userName: "Computer agent" } }
//   );

//   console.log(response);
// })();

for await (const response of await agent.stream(
  {
    messages: [{
      role: "user",
      content: `In this current working directory create a project folder name as TODO. 
                Inside that todo folder create a todo app using html css and js.
                After creating all the files, open that html file using full pathname in browser 
                like open_app { appName: "start D:\\Codes\\Agentic-Projects\\TODO\\index.html" }.`
    }]
  },
  { configurable: { userName: "Computer agent" } }
)) {
  console.log(response);
}