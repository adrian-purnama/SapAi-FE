export const CHAT_AI_PROMPT = `Help me integrate the SapAi standalone API for a normal chat completion.

API overview:
- Base URL: configure in SapAi docs API settings (e.g. http://localhost:8000)
- Auth: header x-api-key with my API key
- Content-Type: application/json on POST

Step 1   enqueue a chat job
POST /api/v1/chat
Body example:
{
  "taskType": "chat",
  "model": "<modelLabel>",
  "input": [{ "role": "user", "content": "Hello!" }],
  "maxTokens": 500
}
Response: { "ok": true, "job": { "id": "...", "status": "pending", ... } }

Step 2   poll for the answer (same job id for all task types)
GET /api/v1/chat/jobs/{job.id}
Header: x-api-key
Poll until status is completed_partial or completed_full.
Read the answer from result.text.

Optional: WebSocket stream GET /api/v1/chat/jobs/{job.id}/stream?apiKey=YOUR_KEY

Write production-ready code (with error handling and polling) in my stack. Ask me which language/framework if needed.`;

export const RAG_AI_PROMPT = `Help me integrate the SapAi standalone API for FAQ / RAG answers from my uploaded knowledge.

API overview:
- Base URL: configure in SapAi docs API settings
- Auth: x-api-key header
- I have already uploaded Markdown FAQ files in the SapAi dashboard for this API key's project

Step 1   enqueue a RAG job
POST /api/v1/chat
Body example:
{
  "taskType": "rag",
  "model": "<modelLabel>",
  "input": [{ "role": "user", "content": "What is the refund policy?" }],
  "maxTokens": 500
}
Response includes job.id

Step 2   poll the same job endpoint as chat
GET /api/v1/chat/jobs/{job.id}
Poll until completed. RAG jobs may include ragAnalysis in the response when ready.
Answer text is in result.text.

Write code to send a user question and return the grounded FAQ answer. Include polling and errors.`;

export const TRANSLATE_AI_PROMPT = `Help me integrate the SapAi standalone API for translation jobs.

API overview:
- Base URL: configure in SapAi docs API settings
- Auth: x-api-key header
- No model field   server uses OLLAMA_TRANSLATE_MODEL

Step 1   enqueue translate job
POST /api/v1/chat
Body example:
{
  "taskType": "translate",
  "sourceLang": "English",
  "sourceCode": "en",
  "targetLang": "Indonesian",
  "targetCode": "id",
  "text": "Hello, how are you?",
  "maxTokens": 500
}
Response includes job.id

Step 2   poll for result
GET /api/v1/chat/jobs/{job.id}
Poll until status is completed_partial or completed_full.
Translated text is in result.text.

Write code for this flow with polling and error handling.`;

export const OCR_AI_PROMPT = `Help me integrate the SapAi standalone API for OCR (image text/formula/table recognition).

API overview:
- Base URL: configure in SapAi docs API settings
- Auth: x-api-key header
- No model field — server uses glm-ocr:bf16 via task label "ocr"
- Image must be base64 (raw or data:image/...;base64,... prefix — server strips prefix)

Step 1 — enqueue OCR job
POST /api/v1/chat
Body example:
{
  "taskType": "ocr",
  "imageBase64": "<base64-string>",
  "mode": "text",
  "maxTokens": 2048
}
mode: "text" | "formula" | "table" (default text)

Browser encoding example:
const b64 = await new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).replace(/^data:image\\/[^;]+;base64,/, ""));
  r.onerror = rej;
  r.readAsDataURL(file);
});

Response includes job.id

Step 2 — poll for result
GET /api/v1/chat/jobs/{job.id}
Poll until status is completed_partial or completed_full.
OCR output is in result.text.

Write code with file upload support, polling, and error handling.`;

export const CHECK_JOB_AI_PROMPT = `Help me check SapAi chat job status after POST /api/v1/chat.

I already have a job id from a chat, rag, translate, or OCR enqueue response.

Poll (HTTP):
GET /api/v1/chat/jobs/{JOB_ID}
Header: x-api-key
Repeat until status is completed_partial, completed_full, or failed.
Fields: status, result.text, error, taskType, ragAnalysis (for RAG)

Stream (WebSocket)   optional instead of polling:
wss://YOUR_HOST/api/v1/chat/jobs/{JOB_ID}/stream?apiKey=YOUR_API_KEY
Or for embed: ?embedToken=YOUR_EMBED_TOKEN
First message matches GET job shape; updates as the job runs.

Write a small poller and optionally a WebSocket listener with reconnection and timeout.`;
