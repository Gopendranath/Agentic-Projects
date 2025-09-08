import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MistralAIEmbeddings } from "@langchain/mistralai";
//////////////////////////////////////////////////////////////////////////
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
//////////////////////////////////////////////////////////////////////////
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
    path: "http://localhost:8000", // Replace with your Chroma DB host and port
});

const vectorStore = new Chroma(embeddings, {
    client: Chroma_Client,
    collectionName: "my_remote_documents",
});


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
        const allSplits = await splitter.splitDocuments(docs);
        await vectorStore.addDocuments(allSplits);
        return `Documents added successfully`;
    } catch (error) {
        console.error(error);
        return `Error adding documents`;
    }
}

const describeAndSummarise = async (data) => {
    const summaryClient = new OpenAI({
        apiKey: process.env.CEREBRAS_API_KEY,
        baseURL: process.env.CEREBRAS_API_URL,
    })
    try {
        const summary = await summaryClient.createChatCompletion({
            model: "qwen-3-235b-a22b-instruct-2507",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that summarizes text.",
                },
                { role: "user", content: data },
            ],
        });
        return summary.data.choices[0].message.content
    } catch (error) {
        console.error(error);
        return `Error summarizes documents`;
    }

}


const retrieve = async (querry) => {
    try {
        const retrievedDocs = await vectorStore.similaritySearch(querry);
        console.log(retrievedDocs);
        return { context: retrievedDocs };
    } catch (error) {
        console.error(error);
        return { context: [] };
    }

};

async function run(userMessage) {
    let context = [
        {
            role: "system",
            content: ``
        },
        { role: "user", content: userMessage }
    ];

}

