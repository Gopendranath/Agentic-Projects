import fs from "fs";
import { spawn } from "child_process";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

// -------------------
// Functions
// -------------------
function createFolder(name) {
    try {
        if (!fs.existsSync(name)) {
            fs.mkdirSync(name);
            return `✅ Folder '${name}' created.`;
        }
        return `⚠️ Folder '${name}' already exists.`;
    } catch (err) {
        return `❌ Error creating folder: ${err.message}`;
    }
}

function createFile(path, content) {
    try {
        fs.writeFileSync(path, content, "utf8");
        return `✅ File '${path}' created with content.`;
    } catch (err) {
        return `❌ Error creating file: ${err.message}`;
    }
}

function openApp(appName) {
    try {
        // Split appName into command + args
        const parts = appName.split(" ");
        const command = parts[0];
        const args = parts.slice(1);

        const child = spawn(command, args, { detached: true, stdio: "ignore" });
        child.unref(); // fully detach

        return `🚀 App '${appName}' launched.`;
    } catch (err) {
        return `❌ Error opening app: ${err.message}`;
    }
}

const functionMap = { createFolder, createFile, openApp };

// -------------------
// OpenAI Client
// -------------------
const client = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: process.env.MISTRAL_API_URL,
});

// -------------------
// Main Loop
// -------------------
async function runWithLoop(userMessage) {
    let context = [
        {
            role: "system",
            content: `You are a function router.
At each step, return ONLY ONE action in valid JSON.
Never return arrays, only one object like this:

{ "function": "createFolder", "args": { "name": "..." }, "status": "continue|retry|done" }

Valid functions:
- createFolder(name)
- createFile(path, content)
- openApp(appName)

Rules:
- "status": "continue" → wait for next step.
- "status": "retry" → adjust arguments and try again.
- "status": "done" → workflow complete.
Do not explain, do not add \`\`\`json fences.`
        },
        { role: "user", content: userMessage }
    ];

    let done = false;

    while (!done) {
        // 1. Ask LLM for next function with streaming
        const response = await client.chat.completions.create({
            model: "mistral-small-latest",
            messages: context,
            stream: true,
        });

        // 2. Collect streamed tokens
        let raw = "";
        for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content || "";
            process.stdout.write(delta); // live stream to console
            raw += delta;
        }

        console.log("\n\n🔹 Cleaned LLM Output:", raw);

        // Strip markdown fences
        if (raw.startsWith("```")) {
            raw = raw.replace(/```json|```/g, "").trim();
        }

        // 3. Parse safely
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.error("❌ Invalid JSON from LLM:", e.message);
            break;
        }

        const fnName = parsed.function;
        const fn = functionMap[fnName];

        if (!fn) {
            console.error("❌ Unknown function:", fnName);
            break;
        }

        // 4. Run function
        const result = fn(...Object.values(parsed.args));
        console.log(`⚡ Ran ${fnName}:`, result);

        // 5. Feed result back into context
        context.push({ role: "assistant", content: raw });
        context.push({ role: "user", content: `Result: ${result}` });

        // 6. Decide next action
        if (parsed.status === "done") {
            console.log("✅ Workflow complete");
            done = true;
        }
    }
}

// -------------------
// Example Run
// -------------------
runWithLoop(
    `Create a folder test123 in this current directory, 
    add 3 file hello1.txt hello2.txt hello3.txt one by one and write all 26 letters into them 
    and append different number for each file with the letters, open all 3 files in notepad.`
);
