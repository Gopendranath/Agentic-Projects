import { Chroma } from "@langchain/community/vectorstores/chroma";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { ChromaClient } from "chromadb";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// import dotenv from "dotenv";
// dotenv.config();

// const embeddings = new MistralAIEmbeddings({
//     model: "mistral-embed",
//     apiKey: process.env.MISTRAL_API_KEY,
// });

// try {
//     const vectorStore = new Chroma(embeddings, {
//         collectionName: "my_remote_documents",
//         host: "localhost",
//         port: 8000,
//         ssl: false
//     });

//     const result = await vectorStore.similaritySearch("Homoglyph substitution", 3);
//     console.log(result);


// } catch (error) {
//     console.error(error.message);
// }


try {
    const Chroma_Client = new ChromaClient({
        host: "localhost",
        port: 8000,
    });
    // const result = await Chroma_Client.listCollections();
    // console.log(result);
    // result.forEach(collection => {
    //     console.log(collection.name);
    // })
    await Chroma_Client.deleteCollection({ name: "my_remote_documents" });
    console.log("Collection deleted");
} catch (error) {
    console.error(error.message);
}



// const getRawDocs = async (url) => {
//   try {
//     const loader = new CheerioWebBaseLoader(url, { selector: "main, article, p" });
//     const docs = await loader.load();
//     return await splitter.splitDocuments(docs);
//   } catch (error) {
//     console.error("Error getting raw docs:", error);
//     return [];
//   }
// };


// const createAddEmbeddings = async (docs) => {
//     try {
//         const splitter = new RecursiveCharacterTextSplitter({
//             chunkSize: 1000,
//             chunkOverlap: 200,
//         });
//         const cleanedDocs = docs.map(d => ({
//             pageContent: d.pageContent,
//             metadata: d.metadata || {}
//         }));
//         const allSplits = await splitter.splitDocuments(cleanedDocs);
//         await vectorStore.addDocuments(allSplits);
//         return `Documents added successfully`;
//     } catch (error) {
//         console.error(error);
//         return `Error adding documents`;
//     }
// }