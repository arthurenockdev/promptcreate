import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractJsonFromText(text) {
  try {
    // First, try to parse the text directly as JSON
    try {
      return JSON.parse(text);
    } catch {
      // If direct parsing fails, try to find JSON object in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleanJson = jsonMatch[0]
          .replace(/\\n/g, '\n')  // Convert escaped newlines
          .replace(/\\"/g, '"')   // Convert escaped quotes
          .replace(/\\\\/g, '\\'); // Convert escaped backslashes
        return JSON.parse(cleanJson);
      }
      
      // If no JSON object found, try to clean up markdown code blocks
      const cleanText = text
        .replace(/```(json|javascript|js)?\n/g, '')
        .replace(/```\n?/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .trim();
      return JSON.parse(cleanText);
    }
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    throw new Error('Invalid response format from AI. Please try again.');
  }
}

export async function POST(request) {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body || !body.action || !body.data) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { action, data } = body;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let result;
    switch (action) {
      case 'generateCode': {
        const { projectType, userInput } = data;
        
        if (!projectType || !userInput) {
          return NextResponse.json(
            { error: 'Invalid request: missing projectType or userInput' },
            { status: 400 }
          );
        }

        const prompt = `You are a professional full-stack developer. Create a ${projectType} application based on this description:

${userInput}

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanations):
{
  "files": {
    "[filename]": {
      "file": {
        "contents": "[file content]"
      }
    }
  }
}

Requirements:
1. Response must be ONLY the JSON object, no other text
2. Include all necessary files (package.json, components, pages, etc.)
3. Include all required dependencies in package.json
4. Use proper error handling and best practices
5. Follow modern ${projectType} patterns and conventions
6. Ensure the application can run immediately
7. Include clear comments explaining the code
8. Use proper file structure (e.g., app/page.js for Next.js)

Example response format:
{
  "files": {
    "package.json": {
      "file": {
        "contents": {
          "name": "my-app",
          "version": "0.1.0",
          "dependencies": {
            "next": "latest",
            "react": "latest",
            "react-dom": "latest"
          }
        }
      }
    },
    "app/page.js": {
      "file": {
        "contents": "export default function Home() { return <div>Hello World</div>; }"
      }
    }
  }
}`;

        const chat = model.startChat({
          history: [
            {
              role: "user",
              parts: "You are a professional full-stack developer who creates production-ready applications. You will respond with ONLY valid JSON in the specified format, no other text or explanations.",
            },
            {
              role: "model",
              parts: "Understood. I will respond with only valid JSON containing the necessary files and code for the requested application.",
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
          const json = extractJsonFromText(text);
          
          // Validate response format
          if (!json.files || typeof json.files !== 'object') {
            throw new Error('Invalid response format: missing files object');
          }

          // Ensure all files have the correct structure
          for (const [filename, content] of Object.entries(json.files)) {
            if (!content.file || !content.file.contents) {
              json.files[filename] = {
                file: {
                  contents: typeof content === 'string' ? content : JSON.stringify(content)
                }
              };
            }
          }

          return NextResponse.json({ result: json });
        } catch (error) {
          console.error('Failed to parse AI response:', error);
          return NextResponse.json(
            { error: 'Failed to generate valid code. Please try again.' },
            { status: 500 }
          );
        }
      }

      case 'generateNextSteps':
      case 'explainCode':
      case 'suggestImprovements': {
        const prompt = `As a professional developer, ${
          action === 'generateNextSteps'
            ? `suggest the next steps to implement this feature: ${data.request}\n\nCurrent code:\n${data.code}`
            : action === 'explainCode'
            ? `explain this code in detail:\n${data.code}`
            : `suggest improvements for this code:\n${data.code}`
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return NextResponse.json({ result: response.text() });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
