import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Note: Using the model recommended for Grounding (RAG-lite)
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025"; 

// Initialize with the SECURE, server-side environment variable
// The client will automatically pick up the GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the bot's persistent system instructions outside the POST function for cleanliness
const IIC_SYSTEM_INSTRUCTION = `You are a professional and concise chatbot assistant for the Institution's Innovation Council (IIC) at Shyam Lal College. Your tone is helpful and direct. You must follow these rules strictly:
1. Keep all responses very short, maximum 1-3 sentences.
2. Do not use markdown (no bolding or lists).
3. Directly answer the user's question. Do not introduce yourself or list example questions.
4. Only answer questions related to IIC Shyam Lal College. If asked about something else, politely state that you can only help with IIC-related queries.`;

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 1. Start the chat with configurations for constraints and tools
    const chat = model.startChat({
      config: {
        // Set the persona/rules using the systemInstruction parameter
        systemInstruction: IIC_SYSTEM_INSTRUCTION,
        
        // 2. Enable Google Search grounding (RAG-lite) for factual accuracy
        // This is the first step of "training" with external knowledge.
        tools: [{ googleSearch: {} }],
      },
      // Note: No explicit history is needed for the first turn here.
    });

    const result = await chat.sendMessage({
      message: message,
    });
    
    // Extract text response
    const responseText = result.text;
    
    // Optional: Extract citations/sources from the grounding metadata
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.title,
      uri: chunk.web.uri,
    })) || [];

    // Return the response and sources
    return NextResponse.json({ 
      response: responseText, 
      sources: sources 
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
