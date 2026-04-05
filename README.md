# GenUI Local — Feasibility Spike

A minimal React SPA that validates the core generative UI loop: user prompt → Ollama (local LLM) → structured JSON → json-render → rendered shadcn/ui components.

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com/) installed and running

### Install a model

```bash
ollama pull llama3.1:8b
```

### Configure CORS for Ollama

The app runs on `localhost:5173` (Vite dev server) and calls Ollama on `localhost:11434`. Browsers block this cross-origin request by default.

**macOS:**

```bash
launchctl setenv OLLAMA_ORIGINS "http://localhost:*"
```

Then restart Ollama (quit and reopen the app, or restart the service).

**Linux:**

```bash
OLLAMA_ORIGINS="http://localhost:*" ollama serve
```

Or add `Environment="OLLAMA_ORIGINS=http://localhost:*"` to the systemd service file.

**Windows:**

Set `OLLAMA_ORIGINS=http://localhost:*` as a system environment variable, then restart Ollama.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Configuration

Edit `src/adapter/config.ts` to change:

- `MODEL_NAME` — which Ollama model to use (default: `llama3.1:8b`)
- `OLLAMA_BASE_URL` — Ollama server address (default: `http://localhost:11434`)
- `NUM_PREDICT` — max output tokens (default: `4096`)

## Tech Stack

- React 19 + TypeScript + Vite
- [json-render](https://json-render.dev/) for structured UI generation
- [shadcn/ui](https://ui.shadcn.com/) for component library
- [Ollama](https://ollama.com/) for local LLM inference
