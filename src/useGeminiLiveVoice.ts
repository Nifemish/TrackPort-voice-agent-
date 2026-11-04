import { useCallback, useEffect, useRef, useState } from 'react';

export type VoicePersona = 'Zephyr' | 'Kore' | 'Puck' | 'Aoede' | 'Fenrir' | 'Charon';

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  modality: 'voice' | 'text';
}

export interface WorkspaceDraftAction {
  actionType: 'workspace_draft';
  id: string;
  workflowType: 'shipment' | 'flight' | 'receipt' | 'id-mockup';
  title: string;
  creditsCost: number;
  targetUrl: string;
  fields: Record<string, string>;
  createdAt: string;
}

export interface CreditCalculationAction {
  actionType: 'credit_calculation';
  breakdown: {
    shipments: number;
    flights: number;
    receipts: number;
    idCreations: number;
    idStudioCreations: number;
    imageEdits: number;
  };
  totalCreditsRequired: number;
  recommendedPlan: {
    id: string;
    name: string;
    credits: number;
    amountNgn: number;
    audience: string;
    costPerCreditNgn: number;
    exampleCapacity: string;
  };
  subscriptionUrl: string;
  whatsappVerificationUrl: string;
}

export interface CarrierLookupAction {
  actionType: 'carrier_country_lookup';
  matchedCountry: {
    code: string;
    name: string;
    dialCode: string;
    currency: string;
    taxName: string;
    taxRate: number;
    leadDays: number;
    sampleAddress: string;
    localCarriers: string[];
  } | null;
  trackingNumber: string | null;
  trackingUrl: string;
}

export interface SupportEscalationAction {
  actionType: 'support_escalation';
  ticketReference: string;
  category: string;
  customerEmail: string;
  paymentReference: string;
  summary: string;
  whatsappUrl: string;
  createdAt: string;
}

export type LiveToolArtifact =
  | WorkspaceDraftAction
  | CreditCalculationAction
  | CarrierLookupAction
  | SupportEscalationAction;

function float32ToPcm16Base64(float32Array: Float32Array): string {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768.0;
  }
  return float32;
}

function formatTimeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function useGeminiLiveVoice() {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [agentActivity, setAgentActivity] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('Zephyr');
  const [micLevel, setMicLevel] = useState(0);
  const [speakerLevel, setSpeakerLevel] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingText, setIsSendingText] = useState(false);

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: "Hi! I'm Zara, the official NBATOOLS & TrackPort voice concierge for nbatools.cc.cd. Start a live voice session or type below—I can set up trackable shipments, flight tickets, business receipts, educational ID mockups, or calculate your credit plans and PalmPay transfer details in real time.",
      timestamp: formatTimeNow(),
      modality: 'text',
    },
  ]);

  const [liveUserCaption, setLiveUserCaption] = useState('');
  const [liveAssistantCaption, setLiveAssistantCaption] = useState('');
  const [toolArtifacts, setToolArtifacts] = useState<LiveToolArtifact[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);
  const userTranscriptAccRef = useRef<string>('');
  const assistantTranscriptAccRef = useRef<string>('');
  const timerIntervalRef = useRef<number | null>(null);

  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore already stopped source
      }
    });
    activeSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setSpeakerLevel(0);
  }, []);

  const playPcm24kChunk = useCallback((base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const float32Data = pcm16Base64ToFloat32(base64Audio);
    if (float32Data.length === 0) return;

    // Compute RMS energy for voice visualizer
    let sumSq = 0;
    for (let i = 0; i < float32Data.length; i += 4) {
      sumSq += float32Data[i] * float32Data[i];
    }
    const rms = Math.sqrt(sumSq / (float32Data.length / 4));
    setSpeakerLevel(Math.min(1, rms * 4.5));

    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    setAgentActivity('speaking');

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setSpeakerLevel(0);
        setAgentActivity('listening');
      }
    };
  }, []);

  const flushTurnTranscripts = useCallback(() => {
    const userTxt = userTranscriptAccRef.current.trim();
    const asstTxt = assistantTranscriptAccRef.current.trim();

    if (userTxt || asstTxt) {
      setTranscripts((prev) => {
        const next = [...prev];
        if (userTxt) {
          next.push({
            id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'user',
            text: userTxt,
            timestamp: formatTimeNow(),
            modality: 'voice',
          });
        }
        if (asstTxt) {
          next.push({
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            text: asstTxt,
            timestamp: formatTimeNow(),
            modality: 'voice',
          });
        }
        return next;
      });
    }

    userTranscriptAccRef.current = '';
    assistantTranscriptAccRef.current = '';
    setLiveUserCaption('');
    setLiveAssistantCaption('');
  }, []);

  const cleanupCallResources = useCallback(() => {
    flushTurnTranscripts();
    stopAllPlayback();

    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    setMicLevel(0);
    setSpeakerLevel(0);
    setAgentActivity('idle');
  }, [flushTurnTranscripts, stopAllPlayback]);

  const endCall = useCallback(() => {
    cleanupCallResources();
    setCallState('idle');
  }, [cleanupCallResources]);

  const startCall = useCallback(
    async (initialPrompt?: string) => {
      if (callState === 'connecting' || callState === 'connected') return;
      setErrorMessage(null);
      setCallState('connecting');
      setCallSeconds(0);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          },
        });
        mediaStreamRef.current = stream;

        const inputCtx = new AudioContext({ sampleRate: 16000 });
        const outputCtx = new AudioContext({ sampleRate: 24000 });
        inputAudioCtxRef.current = inputCtx;
        outputAudioCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/live?voice=${encodeURIComponent(voicePersona)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'session_ready') {
              setCallState('connected');
              setAgentActivity('listening');

              // Start call duration timer
              timerIntervalRef.current = window.setInterval(() => {
                setCallSeconds((prev) => prev + 1);
              }, 1000);

              // Begin streaming 16kHz microphone audio
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (audioEvent) => {
                if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) {
                  setMicLevel(0);
                  return;
                }
                const channelData = audioEvent.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < channelData.length; i += 4) {
                  sum += channelData[i] * channelData[i];
                }
                const rms = Math.sqrt(sum / (channelData.length / 4));
                setMicLevel(Math.min(1, rms * 6));

                const base64Audio = float32ToPcm16Base64(channelData);
                ws.send(JSON.stringify({ audio: base64Audio }));
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);

              // Trigger initial greeting or custom spoken prompt
              const promptToSend =
                initialPrompt ||
                'Greet the customer warmly in 2 short sentences as Zara, the official NBATOOLS / TrackPort voice concierge for nbatools.cc.cd, and ask how you can help them today.';
              ws.send(JSON.stringify({ text: promptToSend }));
            } else if (msg.type === 'audio' && msg.audio) {
              playPcm24kChunk(msg.audio);
            } else if (msg.type === 'input_transcription' && msg.text) {
              userTranscriptAccRef.current += msg.text;
              setLiveUserCaption(userTranscriptAccRef.current.trim());
            } else if (msg.type === 'output_transcription' && msg.text) {
              assistantTranscriptAccRef.current += msg.text;
              setLiveAssistantCaption(assistantTranscriptAccRef.current.trim());
            } else if (msg.type === 'interrupted') {
              stopAllPlayback();
              flushTurnTranscripts();
              setAgentActivity('listening');
            } else if (msg.type === 'turn_complete') {
              flushTurnTranscripts();
              if (activeSourcesRef.current.size === 0) {
                setAgentActivity('listening');
              }
            } else if (msg.type === 'tool_action' && msg.data) {
              setToolArtifacts((prev) => [msg.data as LiveToolArtifact, ...prev]);
            } else if (msg.type === 'error') {
              setErrorMessage(msg.error || 'Voice session encountered an error.');
              cleanupCallResources();
              setCallState('error');
            } else if (msg.type === 'session_closed') {
              cleanupCallResources();
              setCallState('idle');
            }
          } catch (err) {
            console.error('[Live WS message error]:', err);
          }
        };

        ws.onerror = () => {
          setErrorMessage('Could not connect to the Live Voice WebSocket server.');
          cleanupCallResources();
          setCallState('error');
        };

        ws.onclose = () => {
          cleanupCallResources();
          setCallState((prev) => (prev === 'error' ? 'error' : 'idle'));
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Microphone access was denied. Please allow microphone permissions in your browser.';
        setErrorMessage(message);
        cleanupCallResources();
        setCallState('error');
      }
    },
    [callState, cleanupCallResources, flushTurnTranscripts, playPcm24kChunk, stopAllPlayback, voicePersona]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) setMicLevel(0);
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // If currently connected to Gemini Live voice session, send directly into Live session so Zara replies out loud!
      if (callState === 'connected' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        stopAllPlayback();
        flushTurnTranscripts();
        setTranscripts((prev) => [
          ...prev,
          {
            id: `u-txt-${Date.now()}`,
            role: 'user',
            text: trimmed,
            timestamp: formatTimeNow(),
            modality: 'text',
          },
        ]);
        setAgentActivity('thinking');
        wsRef.current.send(JSON.stringify({ text: trimmed }));
        return;
      }

      // Otherwise use the server-side /api/chat endpoint with identical NBATOOLS tools & knowledge
      setIsSendingText(true);
      setErrorMessage(null);
      const userEntry: TranscriptEntry = {
        id: `u-chat-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: formatTimeNow(),
        modality: 'text',
      };

      setTranscripts((prev) => [...prev, userEntry]);

      try {
        const historyPayload = transcripts
          .filter((t) => t.role === 'user' || t.role === 'assistant')
          .slice(-8)
          .map((t) => ({
            role: (t.role === 'user' ? 'user' : 'model') as 'user' | 'model',
            text: t.text,
          }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: historyPayload,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get response from Zara.');
        }

        if (Array.isArray(data.toolOutputs) && data.toolOutputs.length > 0) {
          setToolArtifacts((prev) => [...(data.toolOutputs as LiveToolArtifact[]), ...prev]);
        }

        setTranscripts((prev) => [
          ...prev,
          {
            id: `a-chat-${Date.now()}`,
            role: 'assistant',
            text: data.reply,
            timestamp: formatTimeNow(),
            modality: 'text',
          },
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to reach Zara chat endpoint.';
        setErrorMessage(msg);
      } finally {
        setIsSendingText(false);
      }
    },
    [callState, flushTurnTranscripts, stopAllPlayback, transcripts]
  );

  const pushLocalToolArtifact = useCallback((artifact: LiveToolArtifact) => {
    setToolArtifacts((prev) => [artifact, ...prev]);
  }, []);

  useEffect(() => {
    return () => {
      cleanupCallResources();
    };
  }, [cleanupCallResources]);

  return {
    callState,
    agentActivity,
    isMuted,
    voicePersona,
    setVoicePersona,
    micLevel,
    speakerLevel,
    callSeconds,
    errorMessage,
    setErrorMessage,
    isSendingText,
    transcripts,
    liveUserCaption,
    liveAssistantCaption,
    toolArtifacts,
    startCall,
    endCall,
    toggleMute,
    sendMessage,
    pushLocalToolArtifact,
  };
}
