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

async function runAgent() {
  try {
    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: "Summarization of Dialog of PM modi in kolkata speech in 22-08-2025",
        },
      ],
    });

    // Structure the result for better readability
    const structuredResult = {
      messages: result.messages,
      finalAnswer: result.messages[result.messages.length - 1]?.content || "No final answer found",
      totalMessages: result.messages.length,
      timestamp: new Date().toISOString()
    };

    // Display the structured result
    console.log("\n=== TIME STAMP ===");
    console.log(structuredResult.timestamp);

    
    console.log("\n=== TOTAL MESSAGES ===");
    console.log(structuredResult.totalMessages);
    

    console.log("\n=== STRUCTURED RESULT ===");
    console.log(structuredResult.messages);


    // Extract and display just the final answer
    console.log("\n=== FINAL ANSWER ===");
    console.log(structuredResult.finalAnswer);



    return structuredResult;

  } catch (error) {
    console.error("Error running agent:", error);
    throw error;
  }
}

// Run the agent
runAgent()
  .then((result) => {
    console.log("\n=== EXECUTION COMPLETED ===");
  })
  .catch((error) => {
    console.error("Failed to run agent:", error);
    process.exit(1);
  });