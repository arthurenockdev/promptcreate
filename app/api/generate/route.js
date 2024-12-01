import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key is not configured. Please check server configuration.' 
        },
        { status: 500 }
      );
    }

    const { input } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { success: false, error: 'No input provided' },
        { status: 400 }
      );
    }

    // Initialize the API with the server-side environment variable
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const chat = model.startChat({
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(input);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error('API Error:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'An unknown error occurred';
    if (error.message.includes('API key not valid')) {
      errorMessage = 'Invalid API key. Please check your API key configuration.';
    } else if (error.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'Permission denied. Please check API key permissions.';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
