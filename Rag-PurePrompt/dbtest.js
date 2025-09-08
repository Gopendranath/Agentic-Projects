import { Chroma } from "@langchain/community/vectorstores/chroma";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";

dotenv.config();

// ---------------- CONFIG ---------------- //
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

// ---------------- SCRAPE + SPLIT ---------------- //
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

// ---------------- STORE ---------------- //
const createAddEmbeddings = async (docs) => {
  try {
    const cleanedDocs = docs.map((d) => ({
      pageContent: d.pageContent,
      metadata: { source: d.metadata?.source || "unknown" },
    }));

    await vectorStore.addDocuments(cleanedDocs);
    console.log("✅ Documents added successfully");
  } catch (error) {
    console.error("❌ Error adding documents:", error.message);
  }
};

// ---------------- TEST ---------------- //
const run = async () => {
  try {
    // 1. Get docs from a URL
    const url = "https://lilianweng.github.io/posts/2021-03-21-lm-toxicity/";
    const docs = await getRawDocs(url);

    // 2. Store in vector DB
    if (docs.length > 0) {
      await createAddEmbeddings(docs);
    }

    // 3. Test query
    const query = "Homoglyph substitution";
    const results = await vectorStore.similaritySearch(query, 3);

    console.log("🔎 Query Results:");
    results.forEach((res, i) => {
      console.log(`\n#${i + 1}`);
      console.log("Content:", res.pageContent.substring(0, 200), "...");
      console.log("Metadata:", res.metadata);
    });
  } catch (error) {
    console.error("❌ Run error:", error.message);
  }
};

run();
