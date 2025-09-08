import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MistralAIEmbeddings } from "@langchain/mistralai";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
//////////////////////////////////////////////////////////////////////////
const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_API_URL,
});

const embeddings = new MistralAIEmbeddings({
    model: "mistral-embed",
    apiKey: process.env.MISTRAL_API_KEY,
});
//////////////////////////////////////////////////////////////////////////
// const vectorStore = new MemoryVectorStore(embeddings);


const Chroma_Client = new ChromaClient({
    host: "localhost",   // or your server IP/domain
    port: 8000,          // Chroma default
    ssl: false           // true if using https
});

const vectorStore = await Chroma.fromDocuments([], embeddings, {
    client: Chroma_Client,
    collectionName: "my_remote_documents",
});

//////////////////////////////////////////////////////////////////////////

const getRawDocs = async (url) => {
    try {
        const pTagSelector = "p";
        const cheerioLoader = new CheerioWebBaseLoader(
            url,
            {
                selector: pTagSelector,
            }
        );
        const docs = await cheerioLoader.load();
        return docs;
    } catch (error) {
        console.error(error);
        console.log("Error getting raw docs");
        return [];
    }
}


const createAddEmbeddings = async (docs) => {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const cleanedDocs = docs.map(d => ({
            pageContent: d.pageContent,
            metadata: d.metadata || {}
        }));
        const allSplits = await splitter.splitDocuments(cleanedDocs);
        await vectorStore.addDocuments(allSplits);
        return `Documents added successfully`;
    } catch (error) {
        console.error(error);
        return `Error adding documents`;
    }
}

const describeAndSummarise = async (data) => {
  const summaryClient = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  try {
    const textToSummarize = typeof data === "string"
      ? data
      : Array.isArray(data)
        ? data.map(d => d.pageContent || "").join("\n\n")
        : JSON.stringify(data);

    const response = await summaryClient.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes text." },
        { role: "user", content: textToSummarize },
      ],
    });

    return response.choices[0]?.message?.content || "⚠️ No content returned";
  } catch (error) {
    console.error("Error in describeAndSummarise:", error);
    return `Error summarizes documents`;
  }
};



const retrieve = async (query) => {
    try {
        const retrievedDocs = await vectorStore.similaritySearch(query, 3); // top 3 docs
        const combined = retrievedDocs.map(doc => doc.pageContent).join("\n\n");
        return { context: combined, docs: retrievedDocs };
    } catch (error) {
        console.error(error);
        return { context: "", docs: [] };
    }
};


const functionMap = {
    getRawDocs,
    createAddEmbeddings,
    describeAndSummarise,
    retrieve,
};

//////////////////////////////////////////////////////////////////////////

async function run(userMessage, url) {
    let context = [
        {
            role: "system",
            content: `You are a function router.
At each step, return ONLY ONE action in valid JSON.
Never return arrays, only one object like this:

{ "function": "retrieve", "args": { "querry": "..." }, "status": "continue|retry|done" }

Valid functions:
- retrieve(querry)
- getRawDocs(url)
- createAddEmbeddings(docs)
- describeAndSummarise(data)

Workflow rules:
1. Always start with retrieve(querry) using the user’s question.
2. If retrieve result has context (not empty), immediately call describeAndSummarise(data) with the retrieved context.
3. If retrieve result is empty:
   - Call getRawDocs(url) with the user’s provided URL.
   - Then call createAddEmbeddings(docs).
   - Then call retrieve(querry) again.
   - If context is found, call describeAndSummarise(data).
4. After summarization, return "status": "done".

Rules:
- "status": "continue" → wait for next step.
- "status": "retry" → adjust arguments and try again.
- "status": "done" → workflow complete.
- Do not explain, do not add code fences.`
        },
        { role: "user", content: userMessage }
    ];

    let done = false;
    let steps = 0;

    while (!done && steps < 15) {
        steps++;

        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-120b",
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

        // Run the chosen function
        const result = await fn(...Object.values(parsed.args));
        console.log(`⚡ Ran ${fnName}:`, result);

        // Push results back into context
        context.push({ role: "assistant", content: raw }); // LLM's function choice
        context.push({ role: "user", content: `Result: ${result.context}` }); // only the text

        // Handle workflow logic explicitly
        if (fnName === "retrieve") {
            if (result.context && result.context.length > 0) {
                // Found docs → Summarize
                context.push({
                    role: "user",
                    content: `Context found. Please summarize.`,
                });
            } else {
                // Not found → Fetch raw docs next
                context.push({
                    role: "user",
                    content: `No docs found. Use getRawDocs with url: ${url}`,
                });
            }
        }

        if (parsed.status === "done") {
            console.log("✅ Workflow complete");
            done = true;
        }
    }
}

run(
    "What is Task Decomposition?",
    "https://lilianweng.github.io/posts/2023-06-23-agent"
);
