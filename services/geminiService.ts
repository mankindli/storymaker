import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("未找到 API Key");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePageContent = async (pageTitle: string, context: string) => {
  try {
    const ai = getAiClient();
    
    // We want a structured response for the page content
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `为标题为 "${pageTitle}" 的情景页面生成创意内容。
      故事背景：${context || "一个通用的冒险故事"}。
      
      请返回一个 JSON 对象（内容请使用中文），包含以下字段：
      1. 'content': 一段引人入胜的故事文本（约 50-80 字）。
      2. 'imagePrompt': 对代表此场景的图像的简短生动描述（用于生成图片）。
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["content", "imagePrompt"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini 生成错误:", error);
    throw error;
  }
};