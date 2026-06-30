export const CHAT_AI_PROMPT = `Help me integrate the SapAi standalone API for a normal chat completion.

API overview:
- Base URL: configure in SapAi docs API settings (e.g. http://localhost:8000)
- Auth: header x-api-key with my API key
- Content-Type: application/json on POST

Optional multi-turn sessions (1-hour idle expiry, sliding window on each use):
- POST /api/v1/chat-sessions — create a session; save data.session.id
- Or POST /api/v1/chat with generateSessionId: true on the first job
- Follow-up jobs: pass sessionId on POST /api/v1/chat (taskType chat)
- DELETE /api/v1/chat-sessions/{id} — end session early
- With a session, send only the latest user message; the server rebuilds full input[] from stored turns

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

Write production-ready code (with error handling and polling) in my stack. Ask me which language/framework if needed.`;

export const RAG_AI_PROMPT = `Help me integrate the SapAi standalone API for FAQ / RAG answers from my uploaded knowledge.

API overview:
- Base URL: configure in SapAi docs API settings
- Auth: x-api-key header
- I have already uploaded Markdown FAQ files in the SapAi dashboard for this API key's project

Optional multi-turn sessions (1-hour idle expiry, sliding window on each use):
- POST /api/v1/chat-sessions — create a session; save data.session.id
- Or POST /api/v1/chat with generateSessionId: true on the first RAG job
- Follow-up jobs: pass sessionId on POST /api/v1/chat (taskType rag)
- DELETE /api/v1/chat-sessions/{id} — end session early
- With a session, prior user/assistant turns are included in job input; retrieval still uses the latest user message

Step 1   enqueue a RAG job
POST /api/v1/chat
Body example (stateless):
{
  "taskType": "rag",
  "model": "<modelLabel>",
  "input": [{ "role": "user", "content": "What is the refund policy?" }],
  "maxTokens": 500
}
Body example (new session):
{
  "taskType": "rag",
  "model": "<modelLabel>",
  "generateSessionId": true,
  "input": [{ "role": "user", "content": "What is the refund policy?" }],
  "maxTokens": 500
}
Response includes job.id and, when a session is used, data.session.id + data.session.expiresAt

Step 2   poll the same job endpoint as chat
GET /api/v1/chat/jobs/{job.id}
Poll until completed. RAG jobs may include ragAnalysis in the response when ready.
Answer text is in result.text.

Write code to send a user question and return the grounded FAQ answer. Include polling, session handling, and errors.`;

export const TRANSLATE_AI_PROMPT = `Help me integrate the SapAi standalone API for translation jobs.

API overview:
- Base URL: configure in SapAi docs API settings
- Auth: x-api-key header
- No model field   server uses OLLAMA_TRANSLATE_MODEL

Optional sessions: pass sessionId or generateSessionId on POST /api/v1/chat (taskType translate). Prior turns are prepended as plain text before the current text field.

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

Optional sessions: pass sessionId or generateSessionId to log Q/A turns. Each OCR job still sends only the current image (images are not replayed from session).

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

Poll:
GET /api/v1/chat/jobs/{JOB_ID}
Header: x-api-key (or x-embed-token for embed jobs)
Repeat every 1–2 seconds until status is completed_partial, completed_full, or failed.
Fields: status, result.text, error, taskType, ragAnalysis (for RAG)

Write a small poller with timeout and error handling.`;
