import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
//////////////////////////////////////////////////////////////////////////////////
// ------------------ CONFIG ------------------ //
const client = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: process.env.CEREBRAS_API_URL,
});

const embeddings = new MistralAIEmbeddings({
    model: "mistral-embed",
    apiKey: process.env.MISTRAL_API_KEY,
});

const vectorStore = new Chroma(embeddings, {
    collectionName: "my_remote_documents",
    host: "localhost",
    port: 8000,
    ssl: false,
});
//////////////////////////////////////////////////////////////////////////////////
// ------------------ HELPERS ------------------ //
const getRawDocs = async (url) => {
    try {
        const loader = new CheerioWebBaseLoader(url, { selector: "main, article, p" });
        const docs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        return await splitter.splitDocuments(docs);
    } catch (error) {
        console.error("❌ Error getting raw docs:", error.message);
        return [];
    }
};

const createAddEmbeddings = async (docs) => {
    try {
        await vectorStore.addDocuments(docs);
        return "✅ Documents added successfully";
    } catch (error) {
        console.error("❌ Error adding documents:", error.message);
        return "❌ Error adding documents";
    }
};

const describeAndSummarise = async (data) => {
    const summaryClient = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    try {
        const textToSummarize = Array.isArray(data)
            ? data.map((d) => d.pageContent || "").join("\n\n")
            : typeof data === "string"
                ? data
                : JSON.stringify(data);

        const response = await summaryClient.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                { role: "system", content: "You are a helpful assistant. You can summarise text." },
                { role: "user", content: textToSummarize },
            ],
        });

        return response.choices[0]?.message?.content || "⚠️ No content returned";
    } catch (error) {
        console.error("Error in describeAndSummarise:", error.message);
        return "❌ Error summarizing documents";
    }
};

const retrieve = async (query) => {
    try {
        const retrievedDocs = await vectorStore.similaritySearch(query, 3);
        const combined = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");
        return { context: combined, docs: retrievedDocs };
    } catch (error) {
        console.error(error.message);
        return { context: "", docs: [] };
    }
};

////////////////////////////////////////////////////////////////////////////////
// ------------------ FUNCTION MAP ------------------ //
const functionMap = {
    getRawDocs,
    createAddEmbeddings,
    describeAndSummarise,
    retrieve,
};

////////////////////////////////////////////////////////////////////////////////
// ------------------ SYSTEM PROMPT ------------------ //

const systemPrompt = {
    role: "system",
    content: `You are a function router.
At each step, return ONLY ONE action in valid JSON.
Never return arrays, only one object like this:

{ "function": "retrieve", "args": { "query": "..." }, "status": "continue|retry|done" }

Valid functions:
- retrieve(query)
- getRawDocs(url)
- createAddEmbeddings(docs)
- describeAndSummarise(data)

Workflow rules:
1. Always start with retrieve(query) using the user’s question.
2. If retrieve result has context (not empty), immediately call describeAndSummarise(data).
3. If retrieve result is empty:
   - Call getRawDocs(url) with the user’s provided URL.
   - Then call createAddEmbeddings(docs).
   - Then call retrieve(query) again.
   - If context is found, call describeAndSummarise(data).
4. After summarization, return "status": "done".`,
};


////////////////////////////////////////////////////////////////////////////////
// ------------------ WORKFLOW ------------------ //
async function run(userMessage, url) {
    let context = [systemPrompt, { role: "user", content: userMessage }];
    let done = false, steps = 0;

    while (!done && steps < 15) {
        steps++;


        let response = await client.chat.completions.create({
            model: "gpt-oss-120b",
            messages: context,
        });


        let raw = response.choices[0].message.content.trim();
        if (raw.startsWith("```")) {
            raw = raw.replace(/```json|```/g, "").trim();
        }

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

        // Run chosen function
        const result = await fn(...Object.values(parsed.args));
        console.log(`⚡ Ran ${fnName} ->`, result);

        // Push results back into context
        context.push({ role: "assistant", content: raw });
        context.push({
            role: "user",
            content: result?.context || JSON.stringify(result),
        });

        // Handle workflow logic
        if (fnName === "retrieve") {
            if (result.context && result.context.length > 0) {
                context.push({ role: "user", content: "Context found. Please summarize." });
            } else {
                context.push({ role: "user", content: `No docs found. Use getRawDocs with url: ${url}` });
            }
        }

        if (parsed.status === "done") {
            console.log("✅ Workflow complete");
            done = true;
        }
    }
}

// ------------------ RUN ------------------ //
run(
    "What is Homoglyph substitution?",
    "https://lilianweng.github.io/posts/2021-03-21-lm-toxicity/"
);
