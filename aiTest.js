import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

//////////////////////////////////////////////////////////////////////////////////
// const Mistral_client = new OpenAI({
//     apiKey: process.env.MISTRAL_API_KEY,
//     baseURL: process.env.MISTRAL_API_URL,
// });

// const Mistral_response = await Mistral_client.chat.completions.create({
//     model: "mistral-small-latest",
//     messages: [
//         { role: "system", content: "You are a helpful assistant. You can summarise text." },
//         { role: "user", content: "Hello, how are you?" },
//     ],
// });

//////////////////////////////////////////////////////////////////////////////////
const Cerebras_Client = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY,
    baseURL: process.env.CEREBRAS_API_URL,
});

const Cerebras_response = await Cerebras_Client.chat.completions.create({
    model: "llama3.1-8b",
    messages: [
        { role: "system", content: "You are a helpful assistant. You can summarise text." },
        { role: "user", content: "Hello, how are you?" },
    ],
});


//////////////////////////////////////////////////////////////////////////////////
// const Gemini_Client = new OpenAI({
//     apiKey: process.env.GEMINI_API_KEY,
//     baseURL: process.env.GEMINI_API_URL,
// });

// const Gemini_response = await Gemini_Client.chat.completions.create({
//     model: "gemini-2.5-flash",
//     messages: [
//         { role: "system", content: "You are a helpful assistant. You can summarise text." },
//         { role: "user", content: "Hello, how are you?" },
//     ],
// });


//////////////////////////////////////////////////////////////////////////////////
// const Groq_Client = new OpenAI({
//     apiKey: process.env.GROQ_API_KEY,
//     baseURL: process.env.GROQ_API_URL,
// });

// const Groq_response = await Groq_Client.chat.completions.create({
//     model: "openai/gpt-oss-120b",
//     messages: [
//         { role: "system", content: "You are a helpful assistant. You can summarise text." },
//         { role: "user", content: "Hello, how are you?" },
//     ],
// })


//////////////////////////////////////////////////////////////////////////////////
// const Openrouter_Client = new OpenAI({
//     apiKey: process.env.OPENROUTER_API_KEY,
//     baseURL: process.env.OPENROUTER_API_URL,
// });

// const Openrouter_response = await Openrouter_Client.chat.completions.create({
//     model: "deepseek/deepseek-chat-v3-0324:free",
//     messages: [
//         { role: "system", content: "You are a helpful assistant. You can summarise text." },
//         { role: "user", content: "Hello, how are you?" },
//     ],
// });


//////////////////////////////////////////////////////////////////////////////////
// const Nebius_Client = new OpenAI({
//     apiKey: process.env.NEBIUS_API_KEY,
//     baseURL: process.env.NEBIUS_API_URL,
// });

// const Nebius_response = await Nebius_Client.chat.completions.create({
//     model: "meta-llama/Meta-Llama-3.1-8B-Instruct-fast",
//     messages: [
//         { role: "system", content: "You are a helpful assistant. You can summarise text." },
//         { role: "user", content: "Hello, how are you?" },
//     ],
// })


// console.log(Mistral_response.choices[0].message.content);
console.log(Cerebras_response.choices[0].message.content);
// console.log(Gemini_response.choices[0].message.content);
// console.log(Groq_response.choices[0].message.content);
// console.log(Openrouter_response.choices[0].message.content);
// console.log(Nebius_response.choices[0].message.content);
