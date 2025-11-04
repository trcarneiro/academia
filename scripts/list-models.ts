
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not found in .env file");
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("Fetching available models...");
    // Correct way to get the model listing is via the admin service, not directly on genAI
    const modelList = await genAI.getGenerativeModel({ model: "gemini-pro" }).listModels();
    
    console.log("--- Available Models for generateContent ---");
    for await (const m of modelList) {
        if (m.supportedGenerationMethods.includes("generateContent")) {
            console.log(m.name);
        }
    }
    console.log("------------------------------------------");

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
