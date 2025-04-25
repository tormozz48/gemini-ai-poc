import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as genai from '@google/genai';
import pino from 'pino';

const modelName = 'gemini-2.0-flash';
const modelTemperature = 0.2;
const modelMaxOutputTokens = 100;

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

const promtPath = path.join(process.cwd(), 'src/promt.txt');

dotenv.config({ path: '.env' });
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.error('GEMINI_API_KEY is not defined');
  process.exit(1);
}

async function main() {
  logger.info('Initializing Gemini client');
  const gemini = new genai.GoogleGenAI({ apiKey });

  const promt = fs.readFileSync(promtPath, 'utf-8');

  const cachedContext = await gemini.caches.create({
    model: modelName,
    config: {
      systemInstruction: promt,
      contents: ['Give some interesting facts about Chicago'],
    },
  });

  logger.info('Cached context created', { cachedContext });

  const response = await gemini.models.generateContent({
    model: modelName,
    config: {
      cachedContent: cachedContext.name,
      // systemInstruction: promt,
      temperature: modelTemperature,
      maxOutputTokens: modelMaxOutputTokens,
      candidateCount: 1,
    },
    contents: ['Give some interesting facts about San Francisco'],
  });

  logger.info('Response generated');
  console.log(response.text);
  logger.info('Completed');
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
