import { ChatMistralAI } from "@langchain/mistralai";
import { ChatGroq } from "@langchain/groq";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";

dotenv.config();
//=========================================================
// define the llm
const llm = new ChatGroq({
    model: "llama3-8b-8192",
    apiKey: process.env.GROQ_API_KEY,
});

// define the embeddings model
const embeddings = new MistralAIEmbeddings({
    model: "mistral-embed",
    apiKey: process.env.MISTRAL_API_KEY,
});

//=========================================================



// Load and chunk contents of blog
const pTagSelector = "p";
const cheerioLoader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    {
        selector: pTagSelector,
    }
);

const docs = await cheerioLoader.load();

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const allSplits = await splitter.splitDocuments(docs);


// Index chunks
const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(allSplits);

//=========================================================





// Define prompt for question-answering
const promptTemplate = await pull("rlm/rag-prompt");






// Define state for application
const InputStateAnnotation = Annotation.Root({
    question: Annotation(),
});

const StateAnnotation = Annotation.Root({
    question: Annotation(),
    context: Annotation(),
    answer: Annotation(),
});

// Define application steps
const retrieve = async (state) => {
    const retrievedDocs = await vectorStore.similaritySearch(state.question);
    return { context: retrievedDocs };
};
//=========================================================





const generate = async (state) => {
    const docsContent = state.context.map((doc) => doc.pageContent).join("\n");
    const messages = await promptTemplate.invoke({
        question: state.question,
        context: docsContent,
    });
    const response = await llm.invoke(messages);
    return { answer: response.content };
};

const graph = new StateGraph(StateAnnotation)
    .addNode("retrieve", retrieve)
    .addNode("generate", generate)
    .addEdge("__start__", "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", "__end__")
    .compile();

let inputs = { question: "What is Task Decomposition?" };

// const result = await graph.invoke(inputs);
// console.log(result.answer);


for await (const {retrieve, generate} of await graph.stream(inputs)) {
    console.log(retrieve);
    console.log("\n");
    console.log(generate);
}


