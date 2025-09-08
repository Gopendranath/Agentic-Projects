import { ChromaClient } from "chromadb";

try {
    const Chroma_Client = new ChromaClient({ path: "http://localhost:8000" });
    await Chroma_Client.deleteCollection({ name: "my_remote_documents" });
    console.log("Collection deleted");
} catch (error) {
    console.error(error.message);
}