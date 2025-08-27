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
import { tool } from "@langchain/core/tools";
import { z } from "zod";


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


export {
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
}