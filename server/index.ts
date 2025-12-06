// server/index.ts
import 'dotenv/config';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve test HTML file
app.get('/', (req: any, res: any) => {
  res.sendFile(__dirname + '/test.html');
});

// Debug: Check API key
console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
console.log('API Key prefix:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'Not set');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Basic text generation via Chat Completions API (streaming)
app.post("/api/respond", async (req, res) => {
  const { messages, system, json } = req.body || {};

  // Set headers for server-sent streaming
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",          // pick your model
      input: [
        system ? { role: "system", content: system } : null,
        ...(messages || []),
      ].filter(Boolean),
      ...(json ? { response_format: { type: "json_object" } } : {}),
      stream: true,
    });

    for await (const event of response) {
      if (event.type === "response.output_text.delta") {
        res.write(event.delta);
      }
    }
  } catch (e: any) {
    res.write(`\n[ERROR] ${e?.message || "Request failed"}`);
  } finally {
    res.end();
  }
});

app.listen(8080, () => {
  console.log("API listening on http://localhost:8080");
});