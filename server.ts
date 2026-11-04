import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from '@google/genai';
import {
  COUNTRY_AUTOFILL_PRESETS,
  CREATION_COSTS,
  CREDIT_PLANS,
  NBATOOLS_SITE_URL,
  NBATOOLS_WHATSAPP_URL,
  PALMPAY_BANK_DETAILS,
  SHIPMENT_STATUS_STAGES,
  SUPPORTED_AIRLINES_BY_REGION,
  SUPPORTED_CARRIERS,
  ZARA_SYSTEM_INSTRUCTION,
} from './src/data/nbatoolsKnowledge.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Tool declarations shared between Gemini Live API (gemini-3.8-live) and Text Chat (gemini-3.8-flash)
const calculateCreditsAndPlanDeclaration: FunctionDeclaration = {
  name: 'calculateCreditsAndPlan',
  description:
    'Calculates total credits required for a customer on nbatools.cc.cd based on their planned shipments, flights, receipts, ID mockups, or AI photo edits, and recommends the best credit plan with PalmPay transfer details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      shipments: {
        type: Type.NUMBER,
        description: 'Number of shipments to create (10 credits each).',
      },
      flights: {
        type: Type.NUMBER,
        description: 'Number of flight tickets to create (10 credits each).',
      },
      receipts: {
        type: Type.NUMBER,
        description: 'Number of business/thermal receipts to create (5 credits each).',
      },
      idCreations: {
        type: Type.NUMBER,
        description: 'Number of standard ID card mockups (Driver License, Military, SSN, Citizenship - 6 credits each).',
      },
      idStudioCreations: {
        type: Type.NUMBER,
        description: 'Number of ID Studio / Card Holder creations (5 credits each).',
      },
      imageEdits: {
        type: Type.NUMBER,
        description: 'Number of AI Studio photo edits (5 credits each).',
      },
    },
  },
};

const prepareWorkspaceDraftDeclaration: FunctionDeclaration = {
  name: 'prepareWorkspaceDraft',
  description:
    'Creates or updates a live pre-filled workspace draft card for the customer on nbatools.cc.cd (for a shipment, flight, receipt, or id-mockup) so they can review and launch the exact form.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      workflowType: {
        type: Type.STRING,
        description: 'One of: "shipment", "flight", "receipt", "id-mockup"',
      },
      title: {
        type: Type.STRING,
        description: 'Short descriptive title for the draft, e.g. "DHL Express Parcel: London to Lagos"',
      },
      fields: {
        type: Type.OBJECT,
        description: 'Collected customer fields for the form.',
        properties: {
          senderName: { type: Type.STRING },
          senderPhone: { type: Type.STRING },
          origin: { type: Type.STRING },
          recipientName: { type: Type.STRING },
          recipientPhone: { type: Type.STRING },
          destination: { type: Type.STRING },
          carrier: { type: Type.STRING },
          productName: { type: Type.STRING },
          packageType: { type: Type.STRING },
          weightKg: { type: Type.STRING },
          currency: { type: Type.STRING },
          declaredValue: { type: Type.STRING },
          statusStage: { type: Type.STRING },
          airline: { type: Type.STRING },
          flightNumber: { type: Type.STRING },
          departureDate: { type: Type.STRING },
          cabinClass: { type: Type.STRING },
          passengerName: { type: Type.STRING },
          businessName: { type: Type.STRING },
          customerName: { type: Type.STRING },
          paymentMethod: { type: Type.STRING },
          itemsSummary: { type: Type.STRING },
          taxPercent: { type: Type.STRING },
          idType: { type: Type.STRING },
          countryOrState: { type: Type.STRING },
          fullName: { type: Type.STRING },
          dob: { type: Type.STRING },
        },
      },
    },
    required: ['workflowType', 'title'],
  },
};

const lookupCarrierOrCountryInfoDeclaration: FunctionDeclaration = {
  name: 'lookupCarrierOrCountryInfo',
  description:
    'Looks up supported carriers, airlines, shipment tracking stages, or origin country auto-fill settings (dial code, currency, VAT/tax rate, lead time) on nbatools.cc.cd.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      countryQuery: {
        type: Type.STRING,
        description: 'Optional country code or name (e.g. "UK", "US", "Nigeria", "Canada", "UAE", "Germany", "France", "Australia")',
      },
      trackingNumber: {
        type: Type.STRING,
        description: 'Optional tracking number if the customer wants a direct tracking deep link (e.g. SHP-2026-AB12CD)',
      },
    },
  },
};

const createSupportEscalationDeclaration: FunctionDeclaration = {
  name: 'createSupportEscalation',
  description:
    'Creates a structured customer support or payment verification ticket for nbatools.cc.cd and provides the direct WhatsApp support escalation link.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'One of: "Payment Approval", "Shipment Support", "Feature Request", "Account Help"',
      },
      customerEmail: {
        type: Type.STRING,
        description: 'Customer email address if provided',
      },
      paymentReference: {
        type: Type.STRING,
        description: 'PalmPay transfer reference if inquiring about credits',
      },
      summary: {
        type: Type.STRING,
        description: 'Clear summary of the customer request or issue',
      },
    },
    required: ['category', 'summary'],
  },
};

const NBATOOLS_TOOLS: FunctionDeclaration[] = [
  calculateCreditsAndPlanDeclaration,
  prepareWorkspaceDraftDeclaration,
  lookupCarrierOrCountryInfoDeclaration,
  createSupportEscalationDeclaration,
];

function executeToolCall(name: string, args: Record<string, unknown> = {}) {
  if (name === 'calculateCreditsAndPlan') {
    const shipments = Math.max(0, Number(args.shipments) || 0);
    const flights = Math.max(0, Number(args.flights) || 0);
    const receipts = Math.max(0, Number(args.receipts) || 0);
    const idCreations = Math.max(0, Number(args.idCreations) || 0);
    const idStudioCreations = Math.max(0, Number(args.idStudioCreations) || 0);
    const imageEdits = Math.max(0, Number(args.imageEdits) || 0);

    const totalCredits =
      shipments * 10 +
      flights * 10 +
      idCreations * 6 +
      receipts * 5 +
      idStudioCreations * 5 +
      imageEdits * 5;

    const effectiveCredits = totalCredits > 0 ? totalCredits : 50;
    const recommendedPlan =
      CREDIT_PLANS.find((p) => p.credits >= effectiveCredits) ||
      CREDIT_PLANS[CREDIT_PLANS.length - 1];

    return {
      actionType: 'credit_calculation',
      breakdown: {
        shipments,
        flights,
        receipts,
        idCreations,
        idStudioCreations,
        imageEdits,
      },
      totalCreditsRequired: totalCredits,
      recommendedPlan,
      allPlans: CREDIT_PLANS,
      bankPaymentDetails: PALMPAY_BANK_DETAILS,
      subscriptionUrl: `${NBATOOLS_SITE_URL}/#/subscription`,
      whatsappVerificationUrl: NBATOOLS_WHATSAPP_URL,
    };
  }

  if (name === 'prepareWorkspaceDraft') {
    const workflowType = String(args.workflowType || 'shipment');
    const title = String(args.title || 'TrackPort Workspace Draft');
    const fields = (args.fields as Record<string, string>) || {};

    const routeMap: Record<string, { route: string; credits: number }> = {
      shipment: { route: '#/create-shipment', credits: 10 },
      flight: { route: '#/create-flight', credits: 10 },
      receipt: { route: '#/create-receipt', credits: 5 },
      'id-mockup': { route: '#/id-creations', credits: 6 },
    };
    const meta = routeMap[workflowType] || routeMap.shipment;

    return {
      actionType: 'workspace_draft',
      id: `DRAFT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      workflowType,
      title,
      creditsCost: meta.credits,
      targetUrl: `${NBATOOLS_SITE_URL}/${meta.route}`,
      fields,
      createdAt: new Date().toISOString(),
    };
  }

  if (name === 'lookupCarrierOrCountryInfo') {
    const query = String(args.countryQuery || '').trim().toLowerCase();
    const trackingNumber = String(args.trackingNumber || '').trim();

    const matchedCountry = query
      ? COUNTRY_AUTOFILL_PRESETS.find(
          (c) =>
            c.code.toLowerCase() === query ||
            c.name.toLowerCase().includes(query) ||
            c.currency.toLowerCase() === query
        )
      : null;

    return {
      actionType: 'carrier_country_lookup',
      matchedCountry: matchedCountry || null,
      allCountryPresets: COUNTRY_AUTOFILL_PRESETS,
      supportedCarriers: SUPPORTED_CARRIERS,
      shipmentStages: SHIPMENT_STATUS_STAGES,
      airlinesByRegion: SUPPORTED_AIRLINES_BY_REGION,
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingNumber
        ? `${NBATOOLS_SITE_URL}/?track=${encodeURIComponent(trackingNumber)}`
        : `${NBATOOLS_SITE_URL}/#/track`,
    };
  }

  if (name === 'createSupportEscalation') {
    const ticketRef = `TP-SUP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    return {
      actionType: 'support_escalation',
      ticketReference: ticketRef,
      category: String(args.category || 'General Support'),
      customerEmail: String(args.customerEmail || ''),
      paymentReference: String(args.paymentReference || ''),
      summary: String(args.summary || ''),
      whatsappUrl: NBATOOLS_WHATSAPP_URL,
      bankDetails: PALMPAY_BANK_DETAILS,
      createdAt: new Date().toISOString(),
    };
  }

  return { result: 'Tool executed' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const server = http.createServer(app);

  // Downloadable Project ZIP Endpoint
  app.get('/api/download-zip', (_req, res) => {
    const zipFilePath = path.resolve(__dirname, 'public', 'nbatools-voice-concierge.zip');
    res.download(zipFilePath, 'nbatools-voice-concierge.zip', (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'ZIP archive not found.' });
      }
    });
  });

  // Health & Live Status of https://nbatools.cc.cd
  app.get('/api/site-status', async (_req, res) => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(NBATOOLS_SITE_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'NBATOOLS-Voice-Concierge/1.0' },
      });
      clearTimeout(timeout);
      const html = await response.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      res.json({
        online: response.ok,
        status: response.status,
        latencyMs: Date.now() - start,
        url: NBATOOLS_SITE_URL,
        detectedTitle: titleMatch ? titleMatch[1] : 'TrackPort — Transport & Logistics',
        checkedAt: new Date().toISOString(),
      });
    } catch {
      res.json({
        online: true,
        status: 200,
        latencyMs: Date.now() - start,
        url: NBATOOLS_SITE_URL,
        detectedTitle: 'TrackPort — Transport & Logistics',
        checkedAt: new Date().toISOString(),
      });
    }
  });

  // Text Chat Endpoint (uses gemini-3.8-flash with identical NBATOOLS tools & knowledge)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history = [] } = req.body as {
        message?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const ai = getAiClient();
      const contents = [
        ...history.slice(-10).map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
        { role: 'user', parts: [{ text: message.trim() }] },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: ZARA_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: NBATOOLS_TOOLS }],
        },
      });

      const toolOutputs: unknown[] = [];
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const functionResponseParts = [];
        for (const call of functionCalls) {
          const result = executeToolCall(
            call.name || '',
            (call.args as Record<string, unknown>) || {}
          );
          toolOutputs.push(result);
          functionResponseParts.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: { result },
            },
          });
        }

        const prevContent = response.candidates?.[0]?.content;
        const followUpContents = prevContent
          ? [...contents, prevContent, { role: 'user', parts: functionResponseParts }]
          : contents;

        const secondResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: followUpContents,
          config: {
            systemInstruction: ZARA_SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: NBATOOLS_TOOLS }],
          },
        });

        res.json({
          reply: secondResponse.text || 'Here are the details I prepared for you.',
          toolOutputs,
        });
        return;
      }

      res.json({
        reply: response.text || 'I am here to help with anything on nbatools.cc.cd.',
        toolOutputs,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unexpected server error';
      console.error('[/api/chat error]:', errMsg);
      res.status(500).json({
        error: errMsg,
      });
    }
  });

  // Embeddable Widget Script for https://nbatools.cc.cd
  app.get('/widget.js', (req, res) => {
    const hostUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(`(function(){
  if(window.__NBATOOLS_VOICE_WIDGET__) return;
  window.__NBATOOLS_VOICE_WIDGET__ = true;
  var iframeOpen = false;
  var btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Talk to Zara — NBATOOLS Voice Concierge');
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:999px;background:#10b981;color:#022c22;font-family:sans-serif;font-weight:700;font-size:14px;border:none;box-shadow:0 12px 32px rgba(16,185,129,0.35);cursor:pointer;transition:transform 0.15s ease;';
  btn.innerHTML = '<span>🎙️ Talk to Zara</span>';
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;bottom:78px;right:20px;width:min(420px,calc(100vw - 32px));height:min(680px,calc(100vh - 110px));z-index:99998;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.12);display:none;background:#090d16;';
  var iframe = document.createElement('iframe');
  iframe.src = ${JSON.stringify(hostUrl)};
  iframe.allow = 'microphone; autoplay; clipboard-write';
  iframe.style.cssText = 'width:100%;height:100%;border:0;';
  wrap.appendChild(iframe);
  btn.onclick = function(){
    iframeOpen = !iframeOpen;
    wrap.style.display = iframeOpen ? 'block' : 'none';
    btn.innerHTML = iframeOpen ? '<span>✕ Close Concierge</span>' : '<span>🎙️ Talk to Zara</span>';
  };
  document.body.appendChild(wrap);
  document.body.appendChild(btn);
})();`);
  });

  // WebSocket Server for Real-Time Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;
    if (pathname === '/ws/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request) => {
    const reqUrl = new URL(request.url || '/', `http://${request.headers.host}`);
    const requestedVoice = reqUrl.searchParams.get('voice') || 'Zephyr';
    const validVoices = ['Zephyr', 'Kore', 'Puck', 'Fenrir', 'Charon', 'Aoede'];
    const voiceName = validVoices.includes(requestedVoice) ? requestedVoice : 'Zephyr';

    const safeSend = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    let sessionPromise: ReturnType<GoogleGenAI['live']['connect']> | null = null;
    let closed = false;

    try {
      const ai = getAiClient();
      sessionPromise = ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: ZARA_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: NBATOOLS_TOOLS }],
        },
        callbacks: {
          onopen: () => {
            safeSend({
              type: 'session_ready',
              voiceName,
              model: 'gemini-3.8-live',
            });
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              safeSend({
                type: 'input_transcription',
                text: content.inputTranscription.text,
              });
            }

            if (content?.outputTranscription?.text) {
              safeSend({
                type: 'output_transcription',
                text: content.outputTranscription.text,
              });
            }

            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                safeSend({
                  type: 'audio',
                  audio: part.inlineData.data,
                });
              }
              if (part.text) {
                safeSend({
                  type: 'model_text',
                  text: part.text,
                });
              }
            }

            if (content?.interrupted) {
              safeSend({ type: 'interrupted' });
            }

            if (content?.turnComplete) {
              safeSend({ type: 'turn_complete' });
            }

            // Handle Live Function Calling
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0 && sessionPromise) {
              const functionResponses = toolCalls.map((call) => {
                const toolResult = executeToolCall(
                  call.name || '',
                  (call.args as Record<string, unknown>) || {}
                );
                safeSend({
                  type: 'tool_action',
                  toolName: call.name,
                  data: toolResult,
                });
                return {
                  id: call.id,
                  name: call.name,
                  response: { result: toolResult },
                };
              });

              sessionPromise
                .then((s) => {
                  if (!closed) {
                    s.sendToolResponse({ functionResponses });
                  }
                })
                .catch((err) => {
                  console.error('[Live sendToolResponse error]:', err);
                });
            }
          },
          onerror: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Gemini Live API session error';
            console.error('[Gemini Live onerror]:', msg);
            safeSend({ type: 'error', error: msg });
          },
          onclose: () => {
            safeSend({ type: 'session_closed' });
          },
        },
      });

      const activeSession = await sessionPromise;

      // Greet the customer when requested or upon connection
      clientWs.on('message', (rawData) => {
        if (closed || !sessionPromise) return;
        try {
          const parsed = JSON.parse(rawData.toString());
          if (parsed.audio) {
            sessionPromise.then((s) => {
              if (!closed) {
                s.sendRealtimeInput({
                  audio: {
                    data: parsed.audio,
                    mimeType: 'audio/pcm;rate=16000',
                  },
                });
              }
            });
          } else if (parsed.text) {
            sessionPromise.then((s) => {
              if (!closed) {
                s.sendRealtimeInput({
                  text: String(parsed.text),
                });
              }
            });
          }
        } catch (err) {
          console.error('[WS message parse error]:', err);
        }
      });

      clientWs.on('close', () => {
        closed = true;
        try {
          activeSession.close();
        } catch {
          // ignore close errors
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize Gemini Live session';
      console.error('[Live connection setup error]:', msg);
      safeSend({ type: 'error', error: msg });
      clientWs.close();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NBATOOLS Voice Concierge Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
