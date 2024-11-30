'use client';

// Client-side service for Gemini API interactions
const callGeminiAPI = async (action, data) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    return result.result;
  } catch (error) {
    console.error('Failed to call Gemini API:', error);
    throw new Error(`Failed to communicate with AI service: ${error.message}`);
  }
};

// Generate code based on project type and features
export const generateCode = async (projectType, userInput) => {
  if (!projectType || typeof projectType !== 'string') {
    throw new Error('Project type must be a non-empty string');
  }

  if (!userInput || typeof userInput !== 'string') {
    throw new Error('User input must be a non-empty string');
  }

  try {
    const response = await callGeminiAPI('generateCode', {
      projectType,
      userInput: userInput.trim(),
    });

    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from AI service');
    }

    if (!response.files || typeof response.files !== 'object') {
      throw new Error('Invalid response format: missing files object');
    }

    // Transform response into the expected format if needed
    const files = {};
    for (const [filename, content] of Object.entries(response.files)) {
      if (content.file && content.file.contents) {
        files[filename] = {
          content: typeof content.file.contents === 'string' 
            ? content.file.contents 
            : JSON.stringify(content.file.contents, null, 2)
        };
      } else {
        files[filename] = {
          content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        };
      }
    }

    return { files };
  } catch (error) {
    console.error('Code generation error:', error);
    throw new Error(`Failed to generate code: ${error.message}`);
  }
};

export const generateNextSteps = async (currentCode, userRequest) => {
  if (!currentCode || !userRequest) {
    throw new Error('Current code and user request are required');
  }

  try {
    const response = await callGeminiAPI('generateNextSteps', { 
      code: currentCode,
      request: userRequest 
    });
    
    return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Failed to generate next steps:', error);
    throw new Error(`Failed to generate next steps: ${error.message}`);
  }
};

export const explainCode = async (code) => {
  if (!code) {
    throw new Error('Code is required');
  }

  try {
    const response = await callGeminiAPI('explainCode', { code });
    return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Failed to explain code:', error);
    throw new Error(`Failed to explain code: ${error.message}`);
  }
};

export const suggestImprovements = async (code) => {
  if (!code) {
    throw new Error('Code is required');
  }

  try {
    const response = await callGeminiAPI('suggestImprovements', { code });
    return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Failed to suggest improvements:', error);
    throw new Error(`Failed to suggest improvements: ${error.message}`);
  }
};
