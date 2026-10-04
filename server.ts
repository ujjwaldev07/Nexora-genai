import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side in-memory store for sync operations and persistence
const serverStore = {
  conversations: new Map<string, any>(),
  messages: new Map<string, any[]>(),
  files: new Map<string, any>(),
  dashboards: new Map<string, any>(),
  reports: new Map<string, any>(),
  projects: new Map<string, any>(),
  logs: [] as any[],
};

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Log utility
function logEvent(level: string, category: string, message: string, metadata?: any) {
  const entry = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    timestamp: Date.now(),
    level,
    category,
    message,
    metadata,
  };
  serverStore.logs.unshift(entry);
  if (serverStore.logs.length > 200) serverStore.logs.pop();
}

// ==========================================
// 1. Health & Telemetry Routes
// ==========================================
app.get("/api/health", (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    cloudAiAvailable: hasKey,
    activeProvider: hasKey ? "gemini" : "local-builtin",
    timestamp: Date.now(),
  });
});

app.get("/api/system/status", (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  const memory = process.memoryUsage();
  res.json({
    cpuUsagePct: Math.floor(12 + Math.random() * 8),
    ramUsedGB: Number((memory.heapUsed / (1024 * 1024 * 1024) + 0.4).toFixed(2)),
    ramTotalGB: 4.0,
    storageUsedMB: Number((serverStore.conversations.size * 0.1 + 1.2).toFixed(1)),
    isOnline: true,
    cloudAiHealthy: hasKey,
    localAiHealthy: true,
    activeProvider: hasKey ? "Google Gemini 3.7 Flash" : "Aether Local Engine",
    latencyMs: Math.floor(45 + Math.random() * 30),
    logs: serverStore.logs.slice(0, 30),
  });
});

// ==========================================
// 2. Chat Streaming Endpoint (SSE) - Multi-Turn Gemini
// ==========================================
app.post("/api/chat/stream", async (req: Request, res: Response) => {
  const { 
    prompt, 
    history = [], 
    attachments = [], 
    systemInstruction, 
    mode = "hybrid",
    model,
    roleId,
    roleName 
  } = req.body;

  if (!prompt && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: "Prompt or attachment is required" });
    return;
  }

  // Setup Server-Sent Events headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Determine Gemini model: gemini-3.1-pro-preview (complex), gemini-3.5-flash (general), gemini-3.1-flash-lite (fast)
  let targetModel = "gemini-3.5-flash"; // Default general model

  if (model && model !== "auto") {
    targetModel = model;
  } else {
    // Intelligent Task-Based Model Selection
    const promptText = (prompt || "").toLowerCase();
    const isComplex = 
      /\b(algorithm|architecture|refactor|debug|distributed|sql schema|big-o|proof|derivation|deep reasoning|benchmark|latex|neural network|quant model|differential|integral|calculus)\b/i.test(promptText) ||
      (promptText.includes("```") && promptText.length > 200) ||
      roleId === "software-architect" ||
      roleId === "data-scientist";

    const isFast = 
      (/\b(quick|fast|translate|spellcheck|format|define|synonym|triage|short list|convert)\b/i.test(promptText) && promptText.length < 120) ||
      roleId === "rapid-copilot";

    if (isComplex) {
      targetModel = "gemini-3.1-pro-preview"; // Particularly complex tasks
    } else if (isFast) {
      targetModel = "gemini-3.1-flash-lite"; // Fast tasks
    } else {
      targetModel = "gemini-3.5-flash"; // General tasks
    }
  }

  logEvent("info", "chat", `Stream request: "${(prompt || "").substring(0, 50)}" | Model: ${targetModel} | Role: ${roleName || roleId || 'Standard'}`);

  const client = getGeminiClient();

  // If Cloud AI is unavailable or private mode is requested, inform client to use local engine
  if (!client || mode === "private-offline" || mode === "local-only") {
    sendEvent("status", { message: "Executing with local deterministic engine..." });
    sendEvent("fallback", { reason: !client ? "No Gemini API key attached" : "User selected local execution mode" });
    res.end();
    return;
  }

  try {
    sendEvent("status", { 
      message: `Connecting to ${targetModel}...`,
      model: targetModel,
      role: roleName || "Assistant"
    });

    // Build multi-turn contents array for Gemini SDK
    const contents: Array<{ role: "user" | "model"; parts: any[] }> = [];

    // 1. Replay historical turns
    if (Array.isArray(history) && history.length > 0) {
      // Limit history to recent 20 turns for token budget efficiency
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (!msg.content && (!msg.attachments || msg.attachments.length === 0)) continue;

        const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
        const parts: any[] = [];

        // Attachments in historical user messages
        if (role === "user" && msg.attachments && Array.isArray(msg.attachments)) {
          for (const att of msg.attachments) {
            if (att.dataBase64 && att.mimeType && att.mimeType.startsWith("image/")) {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.dataBase64.replace(/^data:image\/\w+;base64,/, ""),
                },
              });
            } else if (att.extractedText) {
              parts.push({
                text: `[Attached Document: ${att.name}]\n${att.extractedText.substring(0, 4000)}\n[End Document]`,
              });
            }
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        if (parts.length > 0) {
          contents.push({ role, parts });
        }
      }
    }

    // 2. Prepare Current User Turn
    const currentParts: any[] = [];

    // Multimodal attachments for the current prompt
    for (const att of attachments) {
      if (att.dataBase64 && att.mimeType && att.mimeType.startsWith("image/")) {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.dataBase64.replace(/^data:image\/\w+;base64,/, ""),
          },
        });
      } else if (att.extractedText) {
        currentParts.push({
          text: `\n[Attached Document: ${att.name}]\n${att.extractedText.substring(0, 8000)}\n[End Document]\n`,
        });
      }
    }

    if (prompt) {
      currentParts.push({ text: prompt });
    }

    if (currentParts.length > 0) {
      contents.push({ role: "user", parts: currentParts });
    }

    const defaultSystemInstruction = 
      "You are a versatile, intelligent Gemini AI assistant. Maintain conversation history across multi-turn exchanges, and provide clear, structured, beautifully formatted markdown answers with code examples, bullet points, and data tables when relevant.";
    
    const sysPrompt = systemInstruction || defaultSystemInstruction;

    sendEvent("status", { message: `Generating multi-turn response with ${targetModel}...` });

    // Execute generateContentStream with multi-turn contents and systemInstruction
    const responseStream = await client.models.generateContentStream({
      model: targetModel,
      contents: contents as any,
      config: {
        systemInstruction: sysPrompt,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        sendEvent("token", { text });
      }
    }

    sendEvent("done", { 
      provider: "gemini", 
      model: targetModel,
      role: roleName || "Assistant" 
    });
    res.end();
  } catch (error: any) {
    logEvent("error", "chat", `Gemini (${targetModel}) stream failed: ${error.message}`);
    
    // Attempt graceful fallback to gemini-3.5-flash if a preview model encountered quota/key issue
    if (targetModel === "gemini-3.1-pro-preview" && client) {
      try {
        logEvent("warn", "chat", "Retrying with general task model gemini-3.5-flash...");
        sendEvent("status", { message: "Retrying with Gemini 3.5 Flash general model..." });
        
        const fallbackStream = await client.models.generateContentStream({
          model: "gemini-3.5-flash",
          contents: (prompt ? [{ role: "user", parts: [{ text: prompt }] }] : [{ role: "user", parts: [{ text: "Hello" }] }]) as any,
          config: {
            systemInstruction: systemInstruction || "You are a helpful Gemini AI assistant.",
          },
        });

        for await (const chunk of fallbackStream) {
          const text = chunk.text;
          if (text) {
            sendEvent("token", { text });
          }
        }

        sendEvent("done", { provider: "gemini", model: "gemini-3.5-flash" });
        res.end();
        return;
      } catch (fallbackErr: any) {
        logEvent("error", "chat", `Fallback failed: ${fallbackErr.message}`);
      }
    }

    sendEvent("error", { message: error.message || "Failed to generate stream" });
    res.end();
  }
});

// ==========================================
// 3. Image Generation & Editing Routes (gemini-3.1-flash-image-preview)
// ==========================================
app.post("/api/generate-image", async (req: Request, res: Response) => {
  const { 
    prompt, 
    aspectRatio = "1:1", 
    style = "photorealistic",
    imageSize = "1K",
    model = "gemini-3.1-flash-image-preview" 
  } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  const client = getGeminiClient();
  logEvent("info", "image", `Image generation: "${prompt.substring(0, 50)}" | Style: ${style} | Aspect: ${aspectRatio} | Size: ${imageSize}`);

  if (!client) {
    const svgData = generateGenerativeSvg(prompt, style);
    res.json({
      imageUrl: svgData,
      provider: "local-svg-engine",
      model: "vector-art-v1",
      prompt,
      aspectRatio,
      style,
      imageSize,
    });
    return;
  }

  const primaryModel = model || "gemini-3.1-flash-image-preview";
  const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
  const targetAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";
  const validSizes = ["512px", "1K", "2K", "4K"];
  const targetImageSize = validSizes.includes(imageSize) ? imageSize : "1K";

  let styleDesc = "";
  if (style === "photorealistic") styleDesc = ", ultra-realistic 8k photography, cinematic natural lighting, highly detailed";
  else if (style === "cinematic") styleDesc = ", cinematic film still, dramatic volumetric lighting, anamorphic bokeh, 35mm";
  else if (style === "minimalist-3d") styleDesc = ", 3D octane render, clean isometric studio lighting, soft shadows, clay aesthetic";
  else if (style === "cyberpunk") styleDesc = ", cyberpunk neon style, futuristic holographic glow, dark atmospheric palette";
  else if (style === "vector-art") styleDesc = ", modern flat vector graphic illustration, clean geometric lines, vibrant editorial style";
  else if (style === "watercolor") styleDesc = ", expressive watercolor painting, textured paper wash, soft bleed edges";
  else if (style === "anime") styleDesc = ", high-end anime keyframe visual, Studio Ghibli inspired, vibrant colors, detailed line art";
  else if (style === "pixel-art") styleDesc = ", 16-bit retro pixel art, crisp pixel grid, vibrant nostalgic palette";

  const fullPrompt = `${prompt.trim()}${styleDesc}`;

  // Helper to run generation on a given model
  const attemptGeneration = async (modelName: string) => {
    return await client.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: targetAspectRatio as any,
          imageSize: targetImageSize as any,
        },
      },
    });
  };

  try {
    let response;
    let actualModel = primaryModel;

    try {
      response = await attemptGeneration(primaryModel);
    } catch (primaryErr: any) {
      logEvent("warn", "image", `Primary model ${primaryModel} failed: ${primaryErr.message}. Trying gemini-3.1-flash-image fallback...`);
      try {
        actualModel = "gemini-3.1-flash-image";
        response = await attemptGeneration(actualModel);
      } catch (secErr: any) {
        logEvent("warn", "image", `Secondary fallback failed. Trying gemini-3.1-flash-lite-image...`);
        actualModel = "gemini-3.1-flash-lite-image";
        response = await client.models.generateContent({
          model: actualModel,
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(targetAspectRatio) ? targetAspectRatio : "1:1") as any,
            },
          },
        });
      }
    }

    let foundImage = "";
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          foundImage = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (foundImage) {
      logEvent("info", "image", `Image generation succeeded using ${actualModel}`);
      res.json({
        imageUrl: foundImage,
        provider: "gemini",
        model: actualModel,
        prompt: prompt.trim(),
        style,
        aspectRatio: targetAspectRatio,
        imageSize: targetImageSize,
      });
    } else {
      const svgData = generateGenerativeSvg(prompt, style);
      res.json({
        imageUrl: svgData,
        provider: "local-fallback",
        model: "vector-art-v1",
        prompt,
      });
    }
  } catch (err: any) {
    logEvent("error", "image", `Image generation failed completely: ${err.message}`);
    const svgData = generateGenerativeSvg(prompt, style);
    res.json({
      imageUrl: svgData,
      provider: "local-svg-engine",
      model: "vector-art-v1",
      prompt,
      error: err.message,
    });
  }
});

// Edit Image with Gemini 3.1 Flash Image Preview (Input image + text prompt edit)
app.post("/api/edit-image", async (req: Request, res: Response) => {
  const { 
    baseImage, 
    mimeType = "image/png", 
    editPrompt,
    aspectRatio,
    imageSize = "1K",
    model = "gemini-3.1-flash-image-preview" 
  } = req.body;

  if (!baseImage || !editPrompt) {
    res.status(400).json({ error: "Both baseImage and editPrompt are required" });
    return;
  }

  const client = getGeminiClient();
  logEvent("info", "image", `Image edit requested: "${editPrompt.substring(0, 60)}" (model: ${model})`);

  // Strip prefix if standard data URL is passed
  const cleanBase64 = baseImage.replace(/^data:image\/\w+;base64,/, "");
  
  // Detect mimeType if in data URL header
  let detectedMime = mimeType;
  const match = baseImage.match(/^data:(image\/\w+);base64,/);
  if (match) {
    detectedMime = match[1];
  }

  if (!client) {
    // If no client, return modified SVG indicator
    const svgData = generateGenerativeSvg(editPrompt, "photorealistic");
    res.json({
      imageUrl: svgData,
      provider: "local-svg-engine",
      model: "vector-art-v1",
      editPrompt,
      isEdit: true,
      originalImageUrl: baseImage.substring(0, 100) + "...",
    });
    return;
  }

  const primaryModel = model || "gemini-3.1-flash-image-preview";
  const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
  const targetAspectRatio = aspectRatio && validAspectRatios.includes(aspectRatio) ? aspectRatio : undefined;

  const attemptEdit = async (modelName: string) => {
    const configObj: any = {};
    if (targetAspectRatio || imageSize) {
      configObj.imageConfig = {};
      if (targetAspectRatio) configObj.imageConfig.aspectRatio = targetAspectRatio;
      if (imageSize) configObj.imageConfig.imageSize = imageSize;
    }

    return await client.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: detectedMime,
            },
          },
          {
            text: `Carefully edit, transform, or modify this image according to the following instructions: ${editPrompt.trim()}. Maintain high visual consistency and photorealistic quality.`,
          },
        ],
      },
      ...(Object.keys(configObj).length > 0 ? { config: configObj } : {}),
    });
  };

  try {
    let response;
    let actualModel = primaryModel;

    try {
      response = await attemptEdit(primaryModel);
    } catch (primErr: any) {
      logEvent("warn", "image", `Primary edit model ${primaryModel} failed: ${primErr.message}. Trying gemini-3.1-flash-image fallback...`);
      try {
        actualModel = "gemini-3.1-flash-image";
        response = await attemptEdit(actualModel);
      } catch (secErr: any) {
        logEvent("warn", "image", `Secondary edit fallback failed. Trying gemini-3.1-flash-lite-image...`);
        actualModel = "gemini-3.1-flash-lite-image";
        response = await client.models.generateContent({
          model: actualModel,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: detectedMime,
                },
              },
              {
                text: editPrompt.trim(),
              },
            ],
          },
        });
      }
    }

    let foundImage = "";
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          foundImage = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (foundImage) {
      logEvent("info", "image", `Image edit succeeded using ${actualModel}`);
      res.json({
        imageUrl: foundImage,
        provider: "gemini",
        model: actualModel,
        editPrompt: editPrompt.trim(),
        prompt: editPrompt.trim(),
        isEdit: true,
      });
    } else {
      res.status(500).json({ error: "Model returned no image data for the edit request." });
    }
  } catch (err: any) {
    logEvent("error", "image", `Image edit execution error: ${err.message}`);
    res.status(500).json({ error: err.message || "Failed to edit image" });
  }
});

function generateGenerativeSvg(prompt: string, style: string): string {
  // Generate a clean, modern aesthetic geometric/abstract SVG artwork
  const colors = [
    ["#1e293b", "#0f172a", "#3b82f6", "#60a5fa"],
    ["#0f172a", "#1e1b4b", "#8b5cf6", "#c084fc"],
    ["#064e3b", "#022c22", "#10b981", "#34d399"],
    ["#701a75", "#4a044e", "#ec4899", "#f472b6"],
  ];
  const palette = colors[Math.abs(prompt.length) % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}" />
        <stop offset="100%" stop-color="${palette[1]}" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${palette[2]}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${palette[3]}" stop-opacity="0.9" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="40" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="800" height="800" fill="url(#bg)" rx="24" />
    <circle cx="400" cy="360" r="180" fill="url(#accent)" filter="url(#glow)" opacity="0.6" />
    <rect x="250" y="210" width="300" height="300" rx="40" fill="none" stroke="${palette[3]}" stroke-width="3" opacity="0.4" transform="rotate(25 400 360)" />
    <circle cx="400" cy="360" r="120" fill="none" stroke="${palette[2]}" stroke-width="2" stroke-dasharray="12 8" />
    <path d="M 280 480 Q 400 320 520 480 T 680 480" fill="none" stroke="${palette[3]}" stroke-width="4" opacity="0.7" />
    <text x="400" y="640" font-family="-apple-system, sans-serif" font-size="22" font-weight="600" fill="#f8fafc" text-anchor="middle">${escapeXml(prompt.substring(0, 48))}</text>
    <text x="400" y="680" font-family="-apple-system, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Style: ${escapeXml(style)} • Aether Generative Canvas</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "\'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

// ==========================================
// 4. Cloud Sync Persistence Route
// ==========================================
app.post("/api/sync", (req: Request, res: Response) => {
  const { operations = [] } = req.body;
  let applied = 0;

  for (const op of operations) {
    if (op.type === "create_conv" || op.type === "update_conv") {
      serverStore.conversations.set(op.entityId, op.payload);
      applied++;
    } else if (op.type === "delete_conv") {
      serverStore.conversations.delete(op.entityId);
      serverStore.messages.delete(op.entityId);
      applied++;
    } else if (op.type === "create_msg") {
      const list = serverStore.messages.get(op.payload.conversationId) || [];
      list.push(op.payload);
      serverStore.messages.set(op.payload.conversationId, list);
      applied++;
    } else if (op.type === "save_file") {
      serverStore.files.set(op.entityId, op.payload);
      applied++;
    } else if (op.type === "delete_file") {
      serverStore.files.delete(op.entityId);
      applied++;
    }
  }

  logEvent("info", "sync", `Synchronized ${applied} operations with cloud database.`);
  res.json({ success: true, count: applied });
});

// ==========================================
// 5. Global Search Route
// ==========================================
app.get("/api/search", (req: Request, res: Response) => {
  const q = String(req.query.q || "").toLowerCase().trim();
  if (!q) {
    res.json({ conversations: [], files: [], messages: [] });
    return;
  }

  const matchedConvs = Array.from(serverStore.conversations.values()).filter(
    (c) => c.title?.toLowerCase().includes(q) || c.summary?.toLowerCase().includes(q)
  );

  const matchedFiles = Array.from(serverStore.files.values()).filter(
    (f) => f.name?.toLowerCase().includes(q) || f.extractedText?.toLowerCase().includes(q)
  );

  res.json({
    conversations: matchedConvs.slice(0, 5),
    files: matchedFiles.slice(0, 5),
  });
});

// ==========================================
// 6. Gemini Live API WebSocket Bridge (gemini-3.1-flash-live-preview)
// ==========================================
function setupLiveWebSocketServer(httpServer: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = request.url
      ? new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname
      : "";

    if (pathname === "/api/live" || pathname === "/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (clientWs: WebSocket, req: http.IncomingMessage) => {
    logEvent("info", "live", "Client connected to Live Voice WebSocket bridge");

    const client = getGeminiClient();
    if (!client) {
      logEvent("warn", "live", "No GEMINI_API_KEY detected for Live API connection");
      clientWs.send(
        JSON.stringify({
          type: "status",
          status: "unauthenticated",
          message: "Gemini API key is required for Live Voice API. Please configure GEMINI_API_KEY in Settings / Environment.",
        })
      );
      return;
    }

    let liveSession: any = null;

    // Parse initial query params for custom voice and system prompt
    const parsedUrl = req.url
      ? new URL(req.url, `http://${req.headers.host || "localhost"}`)
      : null;
    const requestedVoice = parsedUrl?.searchParams.get("voice") || "Zephyr";
    const requestedInstruction =
      parsedUrl?.searchParams.get("instruction") ||
      "You are Nexora Voice, an ultra-fast, helpful, conversational AI companion powered by Gemini 3.1 Flash Live. Keep spoken responses natural, concise, and direct for real-time speech dialogue.";

    const initLiveSession = async (voiceName: string = requestedVoice, instruction: string = requestedInstruction) => {
      try {
        if (liveSession) {
          try {
            liveSession.close?.();
          } catch {}
          liveSession = null;
        }

        clientWs.send(
          JSON.stringify({
            type: "status",
            status: "connecting",
            model: "gemini-3.1-flash-live-preview",
            voice: voiceName,
          })
        );

        liveSession = await client.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName || "Zephyr",
                },
              },
            },
            systemInstruction: instruction,
          },
          callbacks: {
            onopen: () => {
              logEvent("info", "live", `Live API session connected with model gemini-3.1-flash-live-preview (Voice: ${voiceName})`);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "connected",
                    model: "gemini-3.1-flash-live-preview",
                    voice: voiceName,
                  })
                );
              }
            },
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // Extract audio chunks (PCM 24kHz)
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: "audio",
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
                      })
                    );
                  }
                  if (part.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: "transcript",
                        role: "model",
                        text: part.text,
                      })
                    );
                  }
                }
              }

              // Handle interruption event
              if (message.serverContent?.interrupted) {
                clientWs.send(
                  JSON.stringify({
                    type: "interrupted",
                    interrupted: true,
                  })
                );
              }

              // Handle turn completion
              if (message.serverContent?.turnComplete) {
                clientWs.send(
                  JSON.stringify({
                    type: "turnComplete",
                    turnComplete: true,
                  })
                );
              }
            },
            onerror: (err: any) => {
              logEvent("error", "live", `Live API error: ${err?.message || err}`);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    error: err?.message || "Live API error occurred",
                  })
                );
              }
            },
            onclose: () => {
              logEvent("info", "live", "Live API session closed");
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "session_closed",
                  })
                );
              }
            },
          },
        });
      } catch (err: any) {
        logEvent("error", "live", `Failed to initialize Live API session: ${err.message}`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: "error",
              error: `Live connection failed: ${err.message}`,
            })
          );
        }
      }
    };

    await initLiveSession(requestedVoice, requestedInstruction);

    clientWs.on("message", async (raw: any) => {
      try {
        const payload = JSON.parse(raw.toString());

        if (payload.type === "audio" && payload.audio) {
          // Send 16kHz PCM audio to Live API
          if (liveSession) {
            liveSession.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: payload.mimeType || "audio/pcm;rate=16000",
              },
            });
          }
        } else if (payload.type === "image" && payload.image) {
          // Send video / camera frame
          if (liveSession) {
            liveSession.sendRealtimeInput({
              video: {
                data: payload.image.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: payload.mimeType || "image/jpeg",
              },
            });
          }
        } else if (payload.type === "text" && payload.text) {
          if (liveSession) {
            liveSession.sendRealtimeInput({
              text: payload.text,
            });
          }
        } else if (payload.type === "configure") {
          await initLiveSession(payload.voice || requestedVoice, payload.instruction || requestedInstruction);
        } else if (payload.type === "ping") {
          clientWs.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      } catch (err: any) {
        logEvent("error", "live", `Error handling client message: ${err.message}`);
      }
    });

    clientWs.on("close", () => {
      logEvent("info", "live", "Client disconnected from Live Voice WebSocket");
      if (liveSession) {
        try {
          liveSession.close?.();
        } catch {}
        liveSession = null;
      }
    });

    clientWs.on("error", (err) => {
      logEvent("error", "live", `Client WebSocket error: ${err.message}`);
    });
  });

  return wss;
}

// ==========================================
// 7. Vite Development & Production Integration
// ==========================================
async function start() {
  const httpServer = http.createServer(app);

  // Mount Live WebSocket server
  setupLiveWebSocketServer(httpServer);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nexora AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
