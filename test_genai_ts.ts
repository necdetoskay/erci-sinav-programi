// Gerekli bağımlılıklar: npm install @google/genai mime
// Geliştirme bağımlılığı: npm install -D @types/node

import { GoogleGenAI } from '@google/genai';

async function main() {
  // Sağlanan API anahtarını kullan
  const apiKey = "AIzaSyA-xpTljdJtZan7n89pt-4N7fJr8SvjFDE"; 
  if (!apiKey) {
    console.error("Hata: API anahtarı bulunamadı.");
    process.exit(1);
  }

  // API anahtarını options objesi içinde ver
  const ai = new GoogleGenAI({ apiKey }); 

  // Streaming için config genellikle generateContentStream içinde doğrudan kullanılmaz.
  // Gerekirse model oluştururken veya generateContent içinde kullanılır.
  // const config = {
  //   responseMimeType: 'text/plain',
  // }; 
  const model = 'gemini-1.5-flash-latest'; // Daha yeni ve genel bir model deneyelim
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: "Why is the sky blue?", // Test metni
        },
      ],
    },
  ];

  try {
    // console.log("Sending request to Gemini API via TypeScript SDK..."); // Removed log
    
    // ai.models üzerinden generateContentStream çağrısını yap
    const response = await ai.models.generateContentStream({
      model, // Modeli burada belirt
      contents,
    });

    // console.log("\nAPI Response (Streaming):"); // Removed log
    let fullResponse = "";
    // Doğrudan response (async generator) üzerinden gelen parçaları işle
    for await (const chunk of response) { 
        // chunk.text özelliğine doğrudan eriş ve undefined kontrolü yap
        const chunkText = chunk.text; 
        if (chunkText) {
          process.stdout.write(chunkText); // Akışı doğrudan konsola yazdır
          fullResponse += chunkText;
        }
    }
    // console.log("\n\nStreaming finished."); // Removed log
    // // console.log("\nFull Response Text:\n", fullResponse); // Removed log

  } catch (error) {
    console.error("\nAn error occurred:", error);
    process.exit(1);
  }
}

main();
