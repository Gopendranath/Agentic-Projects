import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatMistralAI } from "@langchain/mistralai";
import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

async function getTavilySearchResults(query) {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const response = await tvly.search(query);
  return response;
}

const search = tool(
  async ({ query }) => {
    const results = await getTavilySearchResults(query);
    console.log(results);
    return results;
  },
  {
    name: "search",
    description: "Call to surf the web.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  }
);

const model = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const agent = createReactAgent({
  llm: model,
  tools: [search],
});

for await (const [token, metadata] of await agent.stream(
  { messages: "Summarization of Dialog of PM modi in kolkata speech in 22-08-2025" },
  { streamMode: "messages" }
)) {
  console.log("Token", token["content"]);
//   console.log("Metadata", metadata);
  console.log("\n");
}