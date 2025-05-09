// AI Provider ve Model verilerini eklemek için script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('AI Provider ve Model verilerini ekleme işlemi başlatılıyor...');

    // OpenRouter Provider
    const openRouter = await prisma.provider.create({
      data: {
        name: 'OpenRouter',
        description: 'OpenRouter API ile çeşitli AI modellerine erişim',
        apiKey: process.env.OPENROUTER_API_KEY || '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',
        models: {
          create: [
            {
              name: 'Claude 3 Opus',
              details: 'Anthropic\'in en güçlü modeli, karmaşık görevler için',
              codeName: 'anthropic/claude-3-opus:beta',
              orderIndex: 1,
              isEnabled: true
            },
            {
              name: 'Claude 3 Sonnet',
              details: 'Anthropic\'in dengeli modeli, çoğu görev için ideal',
              codeName: 'anthropic/claude-3-sonnet:beta',
              orderIndex: 2,
              isEnabled: true
            },
            {
              name: 'Claude 3 Haiku',
              details: 'Anthropic\'in hızlı ve ekonomik modeli',
              codeName: 'anthropic/claude-3-haiku:beta',
              orderIndex: 3,
              isEnabled: true
            },
            {
              name: 'GPT-4o',
              details: 'OpenAI\'nin en yeni ve en güçlü modeli',
              codeName: 'openai/gpt-4o',
              orderIndex: 4,
              isEnabled: true
            },
            {
              name: 'GPT-4 Turbo',
              details: 'OpenAI\'nin gelişmiş modeli',
              codeName: 'openai/gpt-4-turbo',
              orderIndex: 5,
              isEnabled: true
            }
          ]
        }
      }
    });

    // Google Provider
    const google = await prisma.provider.create({
      data: {
        name: 'Google AI',
        description: 'Google\'ın Gemini modelleri',
        apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyA-xpTljdJtZan7n89pt-4N7fJr8SvjFDE',
        models: {
          create: [
            {
              name: 'Gemini 1.5 Pro',
              details: 'Google\'ın en güçlü modeli',
              codeName: 'google/gemini-1.5-pro',
              orderIndex: 1,
              isEnabled: true
            },
            {
              name: 'Gemini 1.0 Pro',
              details: 'Google\'ın dengeli modeli',
              codeName: 'google/gemini-1.0-pro',
              orderIndex: 2,
              isEnabled: true
            }
          ]
        }
      }
    });

    // Groq Provider
    const groq = await prisma.provider.create({
      data: {
        name: 'Groq',
        description: 'Ultra hızlı LLM API',
        apiKey: process.env.GROQ_API_KEY || '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',
        models: {
          create: [
            {
              name: 'LLaMA 3 70B',
              details: 'Meta\'nın LLaMA 3 modeli, Groq\'un hızlı altyapısında',
              codeName: 'llama3-70b-8192',
              orderIndex: 1,
              isEnabled: true
            },
            {
              name: 'Mixtral 8x7B',
              details: 'Mistral AI\'nin Mixtral modeli, Groq\'un hızlı altyapısında',
              codeName: 'mixtral-8x7b-32768',
              orderIndex: 2,
              isEnabled: true
            },
            {
              name: 'Gemma 7B',
              details: 'Google\'ın açık kaynaklı Gemma modeli, Groq\'un hızlı altyapısında',
              codeName: 'gemma-7b-it',
              orderIndex: 3,
              isEnabled: true
            }
          ]
        }
      }
    });

    console.log('AI Provider ve Model verileri başarıyla eklendi!');
    console.log(`OpenRouter: ${openRouter.id}`);
    console.log(`Google: ${google.id}`);
    console.log(`Groq: ${groq.id}`);

  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
