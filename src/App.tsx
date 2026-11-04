import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Calculator,
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Mic,
  MicOff,
  Package,
  PhoneCall,
  PhoneOff,
  Plane,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Terminal,
  Volume2,
} from 'lucide-react';
import {
  COUNTRY_AUTOFILL_PRESETS,
  CREATION_COSTS,
  CREDIT_PLANS,
  KNOWLEDGE_ARTICLES,
  NBATOOLS_SITE_URL,
  NBATOOLS_WHATSAPP_URL,
  PALMPAY_BANK_DETAILS,
  SHIPMENT_STATUS_STAGES,
  SUPPORTED_AIRLINES_BY_REGION,
  SUPPORTED_CARRIERS,
} from './data/nbatoolsKnowledge';
import {
  LiveToolArtifact,
  VoicePersona,
  useGeminiLiveVoice,
} from './hooks/useGeminiLiveVoice';

const ZARA_AVATAR_URL = '/src/assets/images/zara_concierge_avatar_1793735969077.jpg';
const HERO_BANNER_URL = '/src/assets/images/trackport_logistics_hero_1793735970171.jpg';

type NavTab = 'concierge' | 'builder' | 'pricing' | 'knowledge' | 'embed';

const VOICE_OPTIONS: Array<{ id: VoicePersona; label: string; tone: string }> = [
  { id: 'Zephyr', label: 'Zephyr', tone: 'Warm & Articulate Concierge' },
  { id: 'Kore', label: 'Kore', tone: 'Crisp & Executive Support' },
  { id: 'Aoede', label: 'Aoede', tone: 'Expressive & Welcoming' },
  { id: 'Puck', label: 'Puck', tone: 'Energetic & Fast-Paced' },
  { id: 'Fenrir', label: 'Fenrir', tone: 'Deep & Reassuring' },
  { id: 'Charon', label: 'Charon', tone: 'Calm & Measured' },
];

const QUICK_SCENARIOS = [
  {
    label: 'Prepare a DHL Shipment',
    prompt:
      'I want to prepare a DHL Express shipment from London, UK to Lekki, Lagos for a 2.5 kg box of electronics. Can you set up the draft and tell me the credit cost?',
  },
  {
    label: 'Calculate Credits & Plan',
    prompt:
      'How many credits do I need for 3 shipments, 2 flight tickets, and 4 business receipts on nbatools.cc.cd, and which plan should I buy?',
  },
  {
    label: 'How to Pay via PalmPay',
    prompt:
      'How do I buy credits on nbatools.cc.cd using PalmPay bank transfer, and how does WhatsApp receipt verification work?',
  },
  {
    label: 'Book Flight Itinerary',
    prompt:
      'Help me prepare an Emirates Business Class flight ticket from Lagos (LOS) to Dubai (DXB) for passenger Adewale Johnson.',
  },
  {
    label: 'ID Studio & Mockup Rules',
    prompt:
      'What driver license, military ID, and citizenship card mockups are available in the ID Studio on nbatools.cc.cd, and what are the credit costs?',
  },
  {
    label: 'AI Studio Photo Editor',
    prompt:
      'How does the 4-photo AI image editor work on nbatools.cc.cd, and what happens if an image generation times out?',
  },
];

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('concierge');
  const [textInput, setTextInput] = useState('');
  const [trackingLookupInput, setTrackingLookupInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [siteStatus, setSiteStatus] = useState<{
    online: boolean;
    latencyMs: number;
    detectedTitle: string;
  } | null>(null);

  // Interactive Credit Calculator State
  const [calcCounts, setCalcCounts] = useState({
    shipment: 2,
    flight: 1,
    idCreation: 1,
    receipt: 2,
    idStudio: 0,
    imageEdit: 1,
  });

  // Interactive Workspace Builder State
  const [builderMode, setBuilderMode] = useState<'shipment' | 'flight' | 'receipt' | 'id-mockup'>('shipment');
  const [selectedCountryCode, setSelectedCountryCode] = useState('GB');
  const [shipmentDraft, setShipmentDraft] = useState({
    senderName: 'Clara Vance',
    senderPhone: '+44 7400 892104',
    origin: '221B Baker Street, London NW1 6XE',
    recipientName: 'Tunde Bakare',
    recipientPhone: '+234 803 419 8821',
    destination: '14 Admiralty Way, Lekki Phase 1, Lagos',
    carrier: 'DHL Express',
    productName: 'MacBook Pro 16" & Studio Display',
    packageType: 'Box',
    weightKg: '4.2',
    currency: 'GBP',
    declaredValue: '2450',
    statusStage: 'In Transit',
  });

  const [flightDraft, setFlightDraft] = useState({
    passengerName: 'Adewale Johnson',
    airline: 'Emirates',
    flightNumber: 'EK 784',
    from: 'Lagos (LOS)',
    to: 'Dubai (DXB)',
    departureDate: '2026-11-24',
    cabinClass: 'Business',
    email: 'adewale.j@example.com',
  });

  const [receiptDraft, setReceiptDraft] = useState({
    businessName: 'Vanguard Logistics & Supply Ltd',
    customerName: 'Meridian Retail Group',
    receiptNumber: 'REC-2026-8841',
    paymentMethod: 'Bank transfer',
    currency: 'USD',
    taxPercent: '7.5',
    itemsSummary: 'Express Air Freight Consolidation (2 units @ $420); Customs Clearance Handling (1 unit @ $95)',
  });

  const [idMockupDraft, setIdMockupDraft] = useState({
    idKind: "Driver's License (USA / UK / Canada / Australia)",
    countryOrState: 'United States — Texas',
    fullName: 'ALEXANDER M. REID',
    dob: '1994-06-15',
    purposeNote: 'Educational UI/UX prototype demonstration only',
  });

  // Knowledge Base Filter State
  const [kbSearch, setKbSearch] = useState('');
  const [kbCategory, setKbCategory] = useState<string>('all');

  const {
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
  } = useGeminiLiveVoice();

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, liveUserCaption, liveAssistantCaption]);

  useEffect(() => {
    fetch('/api/site-status')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.latencyMs === 'number') {
          setSiteStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  // Sync country auto-fill when user changes country selector in Builder
  const handleCountryPresetChange = (code: string) => {
    setSelectedCountryCode(code);
    const preset = COUNTRY_AUTOFILL_PRESETS.find((c) => c.code === code);
    if (preset) {
      setShipmentDraft((prev) => ({
        ...prev,
        senderPhone: `${preset.dialCode} `,
        origin: preset.sampleAddress,
        currency: preset.currency,
        carrier: preset.localCarriers[0] || 'DHL Express',
      }));
    }
  };

  const handleCopyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput('');
    sendMessage(msg);
  };

  const handleQuickScenario = (prompt: string) => {
    setActiveTab('concierge');
    sendMessage(prompt);
  };

  const handleSaveBuilderToFeed = () => {
    if (builderMode === 'shipment') {
      pushLocalToolArtifact({
        actionType: 'workspace_draft',
        id: `SHP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        workflowType: 'shipment',
        title: `${shipmentDraft.carrier}: ${shipmentDraft.origin.split(',')[0]} → ${shipmentDraft.destination.split(',')[0]}`,
        creditsCost: 10,
        targetUrl: `${NBATOOLS_SITE_URL}/#/create-shipment`,
        fields: shipmentDraft,
        createdAt: new Date().toISOString(),
      });
    } else if (builderMode === 'flight') {
      pushLocalToolArtifact({
        actionType: 'workspace_draft',
        id: `FLT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        workflowType: 'flight',
        title: `${flightDraft.airline} (${flightDraft.cabinClass}): ${flightDraft.from} → ${flightDraft.to}`,
        creditsCost: 10,
        targetUrl: `${NBATOOLS_SITE_URL}/#/create-flight`,
        fields: flightDraft,
        createdAt: new Date().toISOString(),
      });
    } else if (builderMode === 'receipt') {
      pushLocalToolArtifact({
        actionType: 'workspace_draft',
        id: `REC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        workflowType: 'receipt',
        title: `Receipt for ${receiptDraft.customerName} (${receiptDraft.currency})`,
        creditsCost: 5,
        targetUrl: `${NBATOOLS_SITE_URL}/#/create-receipt`,
        fields: receiptDraft,
        createdAt: new Date().toISOString(),
      });
    } else {
      pushLocalToolArtifact({
        actionType: 'workspace_draft',
        id: `IDM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        workflowType: 'id-mockup',
        title: `${idMockupDraft.idKind} — ${idMockupDraft.countryOrState}`,
        creditsCost: 6,
        targetUrl: `${NBATOOLS_SITE_URL}/#/id-creations`,
        fields: idMockupDraft,
        createdAt: new Date().toISOString(),
      });
    }
    setActiveTab('concierge');
  };

  // Credit Calculator Totals
  const totalCalculatedCredits =
    calcCounts.shipment * 10 +
    calcCounts.flight * 10 +
    calcCounts.idCreation * 6 +
    calcCounts.receipt * 5 +
    calcCounts.idStudio * 5 +
    calcCounts.imageEdit * 5;

  const recommendedPlan =
    CREDIT_PLANS.find((p) => p.credits >= Math.max(1, totalCalculatedCredits)) ||
    CREDIT_PLANS[CREDIT_PLANS.length - 1];

  const filteredKnowledge = KNOWLEDGE_ARTICLES.filter((art) => {
    const matchesCat = kbCategory === 'all' || art.category === kbCategory;
    const q = kbSearch.trim().toLowerCase();
    if (!q) return matchesCat;
    return (
      matchesCat &&
      (art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.details.some((d) => d.toLowerCase().includes(q)))
    );
  });

  const activeAudioEnergy = Math.max(micLevel, speakerLevel);
  const appHostUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const embedScriptSnippet = `<!-- Paste before </body> on https://nbatools.cc.cd -->\n<script src="${appHostUrl}/widget.js" defer></script>`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-slate-950/95 sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#concierge"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('concierge');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
        >
          NBATOOLS · TrackPort
        </a>

        {/* Zone 2: 5 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <a
            href="#concierge"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('concierge');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'concierge'
                ? 'text-white border-emerald-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Voice Concierge
          </a>
          <a
            href="#builder"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('builder');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'builder'
                ? 'text-white border-emerald-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Workspace Builder
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('pricing');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'pricing'
                ? 'text-white border-emerald-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Credits & Plans
          </a>
          <a
            href="#knowledge"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('knowledge');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'knowledge'
                ? 'text-white border-emerald-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Platform Guide
          </a>
          <a
            href="#embed"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('embed');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'embed'
                ? 'text-white border-emerald-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Website Embed
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <a
            href={NBATOOLS_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
          >
            <span>Open nbatools.cc.cd</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Mobile Navigation Bar (visible only on small screens) */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
        {(
          [
            ['concierge', 'Voice Concierge'],
            ['builder', 'Workspace Builder'],
            ['pricing', 'Credits & Plans'],
            ['knowledge', 'Platform Guide'],
            ['embed', 'Website Embed'],
          ] as Array<[NavTab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === id
                ? 'bg-emerald-400 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* =====================================================================
            TAB 1: LIVE VOICE CONCIERGE & CUSTOMER SUPPORT WORKSPACE
           ===================================================================== */}
        {activeTab === 'concierge' && (
          <div className="space-y-6">
            {/* Compact Contextual Banner with Hero Visual */}
            <section className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between z-10">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span>Target Domain: nbatools.cc.cd</span>
                      <span aria-hidden="true">·</span>
                      <span>Workspace: TrackPort Transport & Logistics</span>
                      {siteStatus && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400">
                            Reachable ({siteStatus.latencyMs}ms)
                          </span>
                        </>
                      )}
                    </div>
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display"
                      style={{ textWrap: 'balance' }}
                    >
                      Zara — Real-Time Voice & Customer Operations Concierge
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                      Speak naturally with Zara using low-latency Gemini 3.8 Live audio. She knows every shipment workflow, origin country auto-fill preset, airline boarding pass, thermal receipt template, educational ID studio mockup, and PalmPay credit plan on{' '}
                      <a
                        href={NBATOOLS_SITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                      >
                        nbatools.cc.cd
                      </a>
                      .
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <a
                        href="/api/download-zip"
                        download="nbatools-voice-concierge.zip"
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download Complete Project (.zip)</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveTab('embed')}
                        className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Get nbatools.cc.cd Embed Code
                      </button>
                    </div>
                  </div>

                  {/* Unboxed KPI & Capability Strip */}
                  <div className="pt-6 mt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400">Shipments & Flights</div>
                      <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                        10 credits · 40+ Airlines
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Receipts & AI Studio</div>
                      <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                        5 credits · Auto-Refund
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">ID Studio Mockups</div>
                      <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                        5–6 credits · US/UK/CA/AU
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">PalmPay Top-Up</div>
                      <div className="text-sm font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
                        8109893166 · ₦2,500+
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Media Slot with Measured Scrim & Zero-Broken-Image Fallback */}
                <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-slate-950 overflow-hidden">
                  {!heroImgError ? (
                    <img
                      src={HERO_BANNER_URL}
                      alt="TrackPort Global Multimodal Freight & Aviation Hub"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 flex items-center justify-center p-6">
                      <Package className="w-12 h-12 text-emerald-400/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg bg-slate-950/85 border border-slate-800/90 backdrop-blur-sm">
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      Quick Public Shipment Lookup · nbatools.cc.cd
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const tn = trackingLookupInput.trim();
                        if (!tn) return;
                        window.open(
                          `${NBATOOLS_SITE_URL}/?track=${encodeURIComponent(tn)}`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={trackingLookupInput}
                        onChange={(e) => setTrackingLookupInput(e.target.value)}
                        placeholder="SHP-2026-XXXXXX or FLT-2026-XXXXXX"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-950 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                      >
                        Track ↗
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>

            {/* Main 2-Column Live Voice & Customer Action Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 7 COLUMNS: Live Voice Call Stage + Conversation Transcript */}
              <div className="lg:col-span-7 space-y-6">
                {/* Live Voice Call Control Deck */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      {/* Zara Avatar with Live Acoustic Ring */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400/70 shrink-0 bg-slate-800">
                        {!avatarImgError ? (
                          <img
                            src={ZARA_AVATAR_URL}
                            alt="Zara — NBATOOLS AI Voice Concierge"
                            referrerPolicy="no-referrer"
                            onError={() => setAvatarImgError(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-emerald-300 font-bold text-xl">
                            Z
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white font-display">
                            Zara · NBATOOLS Voice Concierge
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                          <span>Model: gemini-3.8-live</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Status:{' '}
                            {callState === 'connected'
                              ? agentActivity === 'speaking'
                                ? 'Speaking (interruptible)'
                                : agentActivity === 'thinking'
                                ? 'Processing tool...'
                                : isMuted
                                ? 'Microphone Muted'
                                : 'Listening (16kHz PCM)'
                              : callState === 'connecting'
                              ? 'Connecting Live session...'
                              : 'Ready for Voice or Text'}
                          </span>
                          {callState === 'connected' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-400 font-semibold">
                                {formatDuration(callSeconds)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Voice Persona Selector */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="voice-persona-select" className="text-xs text-slate-400 whitespace-nowrap">
                        Voice:
                      </label>
                      <select
                        id="voice-persona-select"
                        value={voicePersona}
                        disabled={callState === 'connected' || callState === 'connecting'}
                        onChange={(e) => setVoicePersona(e.target.value as VoicePersona)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 disabled:opacity-50"
                      >
                        {VOICE_OPTIONS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label} — {v.tone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Acoustic Visualizer & Primary Call Controls */}
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                    {/* Dynamic 24-Bar Audio Visualizer */}
                    <div
                      className="h-14 flex items-center justify-center gap-1.5 px-4"
                      aria-label="Live voice audio level visualizer"
                    >
                      {Array.from({ length: 24 }).map((_, idx) => {
                        const centerDist = Math.abs(idx - 11.5) / 11.5;
                        const waveFactor = Math.max(0.15, 1 - centerDist * 0.75);
                        const heightPct =
                          callState === 'connected'
                            ? Math.min(
                                100,
                                Math.max(
                                  14,
                                  Math.round(
                                    (18 + activeAudioEnergy * 82 * waveFactor) *
                                      (0.75 + ((idx * 7) % 5) * 0.08)
                                  )
                                )
                              )
                            : 16;
                        return (
                          <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-transform duration-100 ${
                              callState === 'connected'
                                ? agentActivity === 'speaking'
                                  ? 'bg-emerald-400'
                                  : isMuted
                                  ? 'bg-amber-500/60'
                                  : 'bg-sky-400'
                                : 'bg-slate-800'
                            }`}
                            style={{
                              height: `${heightPct}%`,
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Live Subtitle / Real-Time Transcription Caption Box */}
                    <div className="min-h-[44px] max-w-xl px-4 flex items-center justify-center">
                      {callState === 'connected' ? (
                        liveAssistantCaption ? (
                          <p className="text-sm text-emerald-300 font-medium">
                            Zara: “{liveAssistantCaption}”
                          </p>
                        ) : liveUserCaption ? (
                          <p className="text-sm text-sky-300">
                            You: “{liveUserCaption}”
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">
                            {isMuted
                              ? 'Your microphone is muted. Click Unmute to speak with Zara.'
                              : 'Speak naturally—ask about shipments, flights, receipts, ID mockups, or PalmPay credits. You can interrupt Zara at any time.'}
                          </p>
                        )
                      ) : (
                        <p className="text-xs text-slate-400">
                          Click <strong className="text-slate-200">Start Live Voice Call</strong> to talk with Zara in real time, or select any customer scenario below.
                        </p>
                      )}
                    </div>

                    {/* Call Control Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {callState !== 'connected' ? (
                        <button
                          type="button"
                          disabled={callState === 'connecting'}
                          onClick={() => startCall()}
                          className="px-6 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-sm inline-flex items-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>
                            {callState === 'connecting'
                              ? 'Connecting Gemini Live...'
                              : 'Start Live Voice Call'}
                          </span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={toggleMute}
                            className={`px-4 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                              isMuted
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30'
                                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                            }`}
                          >
                            {isMuted ? (
                              <>
                                <MicOff className="w-4 h-4" />
                                <span>Unmute Mic</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4" />
                                <span>Mute Mic</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={endCall}
                            className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <PhoneOff className="w-4 h-4" />
                            <span>End Voice Call</span>
                          </button>
                        </>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="w-full max-w-lg p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3 text-left">
                        <span>{errorMessage}</span>
                        <button
                          type="button"
                          onClick={() => setErrorMessage(null)}
                          className="text-rose-300 hover:text-white underline whitespace-nowrap shrink-0"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Customer Prompt Starters */}
                  <div className="pt-4 border-t border-slate-800">
                    <div className="text-xs text-slate-400 mb-2.5">
                      Customer Prompts (works during Live Voice Call or via instant chat):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_SCENARIOS.map((sc) => (
                        <button
                          key={sc.label}
                          type="button"
                          onClick={() => handleQuickScenario(sc.prompt)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Conversation Transcript & Text Input */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 flex flex-col h-[460px]">
                  <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="text-sm font-semibold text-white font-display">
                      Live Conversation Transcript
                    </div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      {transcripts.length} messages · Voice & Text synced
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {transcripts.map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col ${
                          item.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 font-mono tabular-nums">
                          <span>{item.role === 'user' ? 'Customer' : 'Zara (NBATOOLS)'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.modality === 'voice' ? 'Spoken Audio' : 'Text'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.timestamp}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                            item.role === 'user'
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-slate-100'
                              : 'bg-slate-950 border border-slate-800 text-slate-200'
                          }`}
                        >
                          {item.text}
                        </div>
                      </div>
                    ))}

                    {isSendingText && (
                      <div className="text-xs text-slate-400 font-mono">
                        Zara is preparing your response...
                      </div>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>

                  <form
                    onSubmit={handleChatSubmit}
                    className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={
                        callState === 'connected'
                          ? 'Type a detail (tracking number, address, email) to send into the active voice call...'
                          : 'Ask Zara anything about nbatools.cc.cd or ask her to prepare a shipment, flight, receipt, or ID mockup...'
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={isSendingText || !textInput.trim()}
                      className="px-4 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </section>
              </div>

              {/* RIGHT 5 COLUMNS: Live Customer Action Cards & PalmPay Quick Desk */}
              <div className="lg:col-span-5 space-y-6">
                {/* Live Tool Output & Pre-filled Workspace Drafts */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-white font-display">
                        Live Concierge Actions & Drafts
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cards generated by Zara during your voice or text session appear here in real time.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('builder')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open Builder
                    </button>
                  </div>

                  {toolArtifacts.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <Sparkles className="w-7 h-7 text-emerald-400 mx-auto opacity-80" />
                      <div className="text-sm font-medium text-slate-200">
                        No active drafts generated yet in this session
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Ask Zara to calculate credits, prepare a DHL/FedEx shipment, set up a flight ticket, or build a receipt, and the interactive summary will appear right here.
                      </p>
                      <div className="pt-2 flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickScenario(
                              'Calculate the credits needed for 2 shipments, 1 flight ticket, and 2 receipts, and show me the best plan.'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-300 hover:border-emerald-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Run Sample Credit Calculation
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickScenario(
                              'Prepare a DHL Express shipment draft from London to Lagos for a 3 kg box of laptops.'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Generate Sample Shipment Draft
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4 max-h-[520px] overflow-y-auto pr-1">
                      {toolArtifacts.map((art, index) => (
                        <ToolArtifactCard
                          key={`${art.actionType}-${index}`}
                          artifact={art}
                          onCopy={handleCopyText}
                          copiedKey={copiedKey}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Instant PalmPay Top-Up & WhatsApp Verification Reference Card */}
                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-display">
                        Official Credit Top-Up & Bank Transfer Desk
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Direct bank transfer details for{' '}
                        <span className="font-mono text-slate-300">nbatools.cc.cd/#/subscription</span>
                      </p>
                    </div>
                    <a
                      href={`${NBATOOLS_SITE_URL}/#/subscription`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1"
                    >
                      <span>Subscription Page</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Bank Name</span>
                      <span className="font-semibold text-white font-mono">
                        {PALMPAY_BANK_DETAILS.bankName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 font-mono tabular-nums text-sm">
                          {PALMPAY_BANK_DETAILS.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText('palmpay-acc', PALMPAY_BANK_DETAILS.accountNumber)
                          }
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'palmpay-acc' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account Name</span>
                      <span className="font-semibold text-white">
                        {PALMPAY_BANK_DETAILS.accountName}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-slate-400 leading-relaxed">
                      {PALMPAY_BANK_DETAILS.narrationRule} Upload your receipt screenshot on the Payment page and click <strong className="text-slate-200">Buy Credit Now</strong>.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
                    {CREDIT_PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="text-slate-400 font-sans font-medium">{plan.name}</div>
                        <div className="text-sm font-bold text-white mt-1">
                          {plan.credits} cr · ₦{plan.amountNgn.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <a
                      href={NBATOOLS_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>WhatsApp Support & Receipt Approval</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: INTERACTIVE WORKSPACE BUILDER (SHIPMENTS, FLIGHTS, RECEIPTS, ID)
           ===================================================================== */}
        {activeTab === 'builder' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="text-xs text-slate-400 font-mono">
                  Interactive Pre-Fill Studio · nbatools.cc.cd
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
                  Prepare TrackPort Records with Country Auto-Fill
                </h1>
              </div>

              {/* Functional Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start">
                {(
                  [
                    ['shipment', 'Shipment (10 cr)'],
                    ['flight', 'Flight Ticket (10 cr)'],
                    ['receipt', 'Receipt (5 cr)'],
                    ['id-mockup', 'ID Studio (5–6 cr)'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBuilderMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      builderMode === mode
                        ? 'bg-emerald-400 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
                {builderMode === 'shipment' && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <h2 className="text-lg font-bold text-white font-display">
                          Multimodal Shipment Configuration
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Matches <span className="font-mono">nbatools.cc.cd/#/create-shipment</span> origin country auto-fill rules.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="origin-country-preset" className="text-xs text-slate-400 whitespace-nowrap">
                          Origin Country Preset:
                        </label>
                        <select
                          id="origin-country-preset"
                          value={selectedCountryCode}
                          onChange={(e) => handleCountryPresetChange(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          {COUNTRY_AUTOFILL_PRESETS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name} ({c.dialCode} · {c.currency} · {c.taxName} {c.taxRate}%)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Sender Full Name</span>
                        <input
                          type="text"
                          value={shipmentDraft.senderName}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, senderName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Sender Phone (with country code)</span>
                        <input
                          type="text"
                          value={shipmentDraft.senderPhone}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, senderPhone: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </label>
                      <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-slate-300 font-medium">Origin Pickup Address</span>
                        <input
                          type="text"
                          value={shipmentDraft.origin}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, origin: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Recipient Full Name</span>
                        <input
                          type="text"
                          value={shipmentDraft.recipientName}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, recipientName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Recipient Phone</span>
                        <input
                          type="text"
                          value={shipmentDraft.recipientPhone}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, recipientPhone: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </label>
                      <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-slate-300 font-medium">Destination Delivery Address</span>
                        <input
                          type="text"
                          value={shipmentDraft.destination}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, destination: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Carrier Brand</span>
                        <select
                          value={shipmentDraft.carrier}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, carrier: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          {SUPPORTED_CARRIERS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Shipment Status Stage</span>
                        <select
                          value={shipmentDraft.statusStage}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, statusStage: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          {SHIPMENT_STATUS_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Package Contents / Product</span>
                        <input
                          type="text"
                          value={shipmentDraft.productName}
                          onChange={(e) =>
                            setShipmentDraft({ ...shipmentDraft, productName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="space-y-1.5">
                          <span className="text-slate-300 font-medium">Weight (kg)</span>
                          <input
                            type="text"
                            value={shipmentDraft.weightKg}
                            onChange={(e) =>
                              setShipmentDraft({ ...shipmentDraft, weightKg: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-slate-300 font-medium">Currency</span>
                          <input
                            type="text"
                            value={shipmentDraft.currency}
                            onChange={(e) =>
                              setShipmentDraft({ ...shipmentDraft, currency: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-slate-300 font-medium">Value</span>
                          <input
                            type="text"
                            value={shipmentDraft.declaredValue}
                            onChange={(e) =>
                              setShipmentDraft({ ...shipmentDraft, declaredValue: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {builderMode === 'flight' && (
                  <div className="space-y-5">
                    <div className="pb-4 border-b border-slate-800">
                      <h2 className="text-lg font-bold text-white font-display">
                        Flight Ticket & Boarding Pass Configuration
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Supports 40+ international airlines on <span className="font-mono">nbatools.cc.cd/#/create-flight</span> (10 credits).
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Passenger Full Name</span>
                        <input
                          type="text"
                          value={flightDraft.passengerName}
                          onChange={(e) =>
                            setFlightDraft({ ...flightDraft, passengerName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Airline Brand</span>
                        <select
                          value={flightDraft.airline}
                          onChange={(e) =>
                            setFlightDraft({ ...flightDraft, airline: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          {Object.entries(SUPPORTED_AIRLINES_BY_REGION).map(([region, airlines]) => (
                            <optgroup key={region} label={region}>
                              {airlines.map((air) => (
                                <option key={air} value={air}>
                                  {air}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Departure City / Airport</span>
                        <input
                          type="text"
                          value={flightDraft.from}
                          onChange={(e) => setFlightDraft({ ...flightDraft, from: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Destination City / Airport</span>
                        <input
                          type="text"
                          value={flightDraft.to}
                          onChange={(e) => setFlightDraft({ ...flightDraft, to: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Departure Date</span>
                        <input
                          type="date"
                          value={flightDraft.departureDate}
                          onChange={(e) =>
                            setFlightDraft({ ...flightDraft, departureDate: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Cabin Class</span>
                        <select
                          value={flightDraft.cabinClass}
                          onChange={(e) =>
                            setFlightDraft({ ...flightDraft, cabinClass: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          {['Economy', 'Premium Economy', 'Business', 'First'].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )}

                {builderMode === 'receipt' && (
                  <div className="space-y-5">
                    <div className="pb-4 border-b border-slate-800">
                      <h2 className="text-lg font-bold text-white font-display">
                        Business & Thermal Receipt Configuration
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Matches <span className="font-mono">nbatools.cc.cd/#/create-receipt</span> (5 credits).
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Business Name</span>
                        <input
                          type="text"
                          value={receiptDraft.businessName}
                          onChange={(e) =>
                            setReceiptDraft({ ...receiptDraft, businessName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Customer Name</span>
                        <input
                          type="text"
                          value={receiptDraft.customerName}
                          onChange={(e) =>
                            setReceiptDraft({ ...receiptDraft, customerName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Payment Method</span>
                        <select
                          value={receiptDraft.paymentMethod}
                          onChange={(e) =>
                            setReceiptDraft({ ...receiptDraft, paymentMethod: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          {['Card', 'Cash', 'Bank transfer', 'Mobile money', 'Other'].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="space-y-1.5">
                          <span className="text-slate-300 font-medium">Currency</span>
                          <select
                            value={receiptDraft.currency}
                            onChange={(e) =>
                              setReceiptDraft({ ...receiptDraft, currency: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                          >
                            {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'INR', 'ZAR'].map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-slate-300 font-medium">Tax (%)</span>
                          <input
                            type="text"
                            value={receiptDraft.taxPercent}
                            onChange={(e) =>
                              setReceiptDraft({ ...receiptDraft, taxPercent: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                          />
                        </label>
                      </div>
                      <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-slate-300 font-medium">Line Items Summary</span>
                        <textarea
                          rows={3}
                          value={receiptDraft.itemsSummary}
                          onChange={(e) =>
                            setReceiptDraft({ ...receiptDraft, itemsSummary: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {builderMode === 'id-mockup' && (
                  <div className="space-y-5">
                    <div className="pb-4 border-b border-slate-800">
                      <h2 className="text-lg font-bold text-white font-display">
                        Educational ID Studio Mockup Configuration
                      </h2>
                      <p className="text-xs text-amber-300/90 mt-0.5">
                        Strict Policy: Creates fictional design mockups for educational and UI testing purposes only — never official identity documents.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Mockup Category</span>
                        <select
                          value={idMockupDraft.idKind}
                          onChange={(e) =>
                            setIdMockupDraft({ ...idMockupDraft, idKind: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          <option>Driver&apos;s License (USA / UK / Canada / Australia)</option>
                          <option>Military ID Card Mockup (Army / Navy / Air Force / Marines)</option>
                          <option>Citizenship / PR Card Mockup (Canada / Canada PR / USA)</option>
                          <option>SSN Display Mockup</option>
                          <option>Card Holder Studio (5 credits)</option>
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Region / State Template</span>
                        <select
                          value={idMockupDraft.countryOrState}
                          onChange={(e) =>
                            setIdMockupDraft({ ...idMockupDraft, countryOrState: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        >
                          <option>United States — Hawaii</option>
                          <option>United States — Texas</option>
                          <option>United States — Pennsylvania</option>
                          <option>United States — New Jersey</option>
                          <option>United States — New York</option>
                          <option>United Kingdom — Photocard</option>
                          <option>Canada — Provincial / PR</option>
                          <option>Australia — Driver Licence</option>
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Sample Full Name</span>
                        <input
                          type="text"
                          value={idMockupDraft.fullName}
                          onChange={(e) =>
                            setIdMockupDraft({ ...idMockupDraft, fullName: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-slate-300 font-medium">Sample Date of Birth</span>
                        <input
                          type="date"
                          value={idMockupDraft.dob}
                          onChange={(e) =>
                            setIdMockupDraft({ ...idMockupDraft, dob: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleSaveBuilderToFeed}
                    className="px-4 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Send Draft to Zara Concierge Feed</span>
                  </button>

                  <a
                    href={
                      builderMode === 'shipment'
                        ? `${NBATOOLS_SITE_URL}/#/create-shipment`
                        : builderMode === 'flight'
                        ? `${NBATOOLS_SITE_URL}/#/create-flight`
                        : builderMode === 'receipt'
                        ? `${NBATOOLS_SITE_URL}/#/create-receipt`
                        : `${NBATOOLS_SITE_URL}/#/id-creations`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Form on nbatools.cc.cd</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Right 4 Columns: Origin Country Auto-Fill Reference Table */}
              <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                <h3 className="text-base font-bold text-white font-display">
                  Origin Country Auto-Fill Presets
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When a customer selects an origin country on <span className="font-mono">nbatools.cc.cd</span>, TrackPort automatically configures dial codes, currency, tax rate, and lead days:
                </p>
                <div className="divide-y divide-slate-800 text-xs font-mono tabular-nums">
                  {COUNTRY_AUTOFILL_PRESETS.map((c) => (
                    <div key={c.code} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-white font-sans font-medium">{c.name}</div>
                        <div className="text-slate-400 text-[11px]">
                          {c.localCarriers.slice(0, 3).join(' · ')}
                        </div>
                      </div>
                      <div className="text-right text-slate-300">
                        <div>
                          {c.dialCode} · {c.currency}
                        </div>
                        <div className="text-emerald-400 text-[11px]">
                          {c.taxName} {c.taxRate}% · {c.leadDays}d ETA
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: CREDITS, PRICING PLANS & PALMPAY VERIFICATION
           ===================================================================== */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-5">
              <div className="text-xs text-slate-400 font-mono">
                Transparent Credit Economy · nbatools.cc.cd/#/subscription
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
                Credit Calculator, Tier Plans & PalmPay Verification
              </h1>
            </div>

            {/* Interactive Credit Estimator + Recommended Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-base font-bold text-white font-display">
                      Interactive Usage & Credit Estimator
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalcCounts({
                        shipment: 0,
                        flight: 0,
                        idCreation: 0,
                        receipt: 0,
                        idStudio: 0,
                        imageEdit: 0,
                      })
                    }
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-3">
                  {CREATION_COSTS.map((item) => {
                    const count = calcCounts[item.id];
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">{item.label}</div>
                          <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                            {item.credits} credits per creation · Route: {item.route}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center font-mono tabular-nums">
                          <button
                            type="button"
                            onClick={() =>
                              setCalcCounts((prev) => ({
                                ...prev,
                                [item.id]: Math.max(0, prev[item.id] - 1),
                              }))
                            }
                            className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-white">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCalcCounts((prev) => ({
                                ...prev,
                                [item.id]: prev[item.id] + 1,
                              }))
                            }
                            className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                          >
                            +
                          </button>
                          <span className="w-20 text-right text-xs text-emerald-400 font-semibold">
                            = {count * item.credits} cr
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 5 Columns: Recommended Plan & PalmPay Instructions */}
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 font-mono tabular-nums">
                    Estimated Total Requirement
                  </div>
                  <div className="text-4xl font-extrabold text-white font-mono tabular-nums">
                    {totalCalculatedCredits} <span className="text-lg font-normal text-slate-400">credits</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                    <div className="text-xs text-emerald-400 font-semibold">
                      Recommended Tier · {recommendedPlan.audience}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white font-display">
                        {recommendedPlan.name} Plan ({recommendedPlan.credits} Credits)
                      </span>
                      <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                        ₦{recommendedPlan.amountNgn.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      Effective rate: ₦{recommendedPlan.costPerCreditNgn.toFixed(2)} per credit · Leftover balance: {Math.max(0, recommendedPlan.credits - totalCalculatedCredits)} credits
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed pt-2">
                    <div className="font-semibold text-white">
                      Step-by-Step PalmPay Bank Transfer Workflow:
                    </div>
                    <p>
                      1. Open <span className="font-mono text-emerald-300">nbatools.cc.cd/#/subscription</span> and select the <strong>{recommendedPlan.name}</strong> plan.
                    </p>
                    <p>
                      2. Transfer <strong className="font-mono tabular-nums text-white">₦{recommendedPlan.amountNgn.toLocaleString()}</strong> to <strong>PalmPay · 8109893166 · Osanyinlusi Olayemi</strong> using the payment reference shown on screen as your narration.
                    </p>
                    <p>
                      3. Upload your transfer receipt screenshot and click <strong>Buy Credit Now</strong>. WhatsApp opens automatically so the admin can approve your credits immediately.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                  <a
                    href={`${NBATOOLS_SITE_URL}/#/subscription`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Buy {recommendedPlan.name} Plan on nbatools.cc.cd</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickScenario(
                        `I need ${totalCalculatedCredits} credits on nbatools.cc.cd. Explain why the ${recommendedPlan.name} plan at ₦${recommendedPlan.amountNgn} is best for me and how I complete the PalmPay transfer.`
                      )
                    }
                    className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Ask Zara</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Tier Plan Comparison Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CREDIT_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-6 flex flex-col justify-between ${
                    plan.popular
                      ? 'border-emerald-400/70 bg-slate-900'
                      : 'border-slate-800 bg-slate-900/70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400">{plan.audience}</div>
                    <h3 className="text-xl font-bold text-white font-display">{plan.name}</h3>
                    <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                      ₦{plan.amountNgn.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-400 font-mono tabular-nums">
                      {plan.credits} credits · ₦{plan.costPerCreditNgn.toFixed(2)} / credit
                    </div>
                    <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                      Capacity: {plan.exampleCapacity}
                    </p>
                  </div>

                  <a
                    href={`${NBATOOLS_SITE_URL}/#/subscription`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Select {plan.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: COMPLETE NBATOOLS.CC.CD PLATFORM KNOWLEDGE BASE
           ===================================================================== */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="text-xs text-slate-400 font-mono">
                  Complete Website Reference · nbatools.cc.cd
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
                  TrackPort Modules, Routes, Carriers & Security Policies
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    placeholder="Search carriers, routes, rules..."
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                  {(
                    [
                      ['all', 'All'],
                      ['shipments', 'Shipments'],
                      ['flights', 'Flights'],
                      ['receipts', 'Receipts'],
                      ['id-studio', 'ID Studio'],
                      ['credits', 'Credits'],
                    ] as const
                  ).map(([cat, label]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setKbCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        kbCategory === cat
                          ? 'bg-emerald-400 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredKnowledge.map((art) => (
                <article
                  key={art.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span>Route: {art.route}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">{art.costLabel}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white font-display">{art.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {art.summary}
                    </p>
                    <ul className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      {art.details.map((detail, i) => (
                        <li key={i} className="leading-relaxed">
                          • {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuickScenario(art.voicePrompt)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-400/15 hover:bg-emerald-400/25 border border-emerald-400/30 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ask Zara About This</span>
                    </button>
                    <a
                      href={`${NBATOOLS_SITE_URL}/${art.route}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-white font-mono inline-flex items-center gap-1"
                    >
                      <span>Open {art.route}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: WEBSITE EMBED SNIPPET FOR NBATOOLS.CC.CD
           ===================================================================== */}
        {activeTab === 'embed' && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b border-slate-800 pb-5">
              <div className="text-xs text-slate-400 font-mono">
                Drop-In Production Integration · nbatools.cc.cd
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
                Embed Zara Live Voice Concierge on nbatools.cc.cd
              </h1>
              <p className="text-sm text-slate-300 mt-2">
                Add a single script tag to <span className="font-mono text-white">https://nbatools.cc.cd</span> to mount a floating &ldquo;Talk to Zara&rdquo; voice button that opens this real-time Gemini 3.8 Live voice concierge over any page.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Download Full Source Code Archive (.zip)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Includes the Express + Gemini 3.8 Live WebSocket server (`server.ts`), React frontend (`src/`), `nbatools.cc.cd` knowledge base, and generated visual assets.
                  </p>
                </div>
                <a
                  href="/api/download-zip"
                  download="nbatools-voice-concierge.zip"
                  className="px-4 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download nbatools-voice-concierge.zip</span>
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>1-Line Floating Widget Script</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText('embed-script', embedScriptSnippet)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'embed-script' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Snippet</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Embed Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto">
                {embedScriptSnippet}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="mt-12 border-t border-slate-800/80 py-6 px-6 text-xs text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            NBATOOLS · TrackPort Voice & Customer Concierge for{' '}
            <a
              href={NBATOOLS_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-200 hover:underline"
            >
              https://nbatools.cc.cd
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`${NBATOOLS_SITE_URL}/#/subscription`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Subscription & Credits
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={`${NBATOOLS_SITE_URL}/#/track`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Track Shipment
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={NBATOOLS_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              WhatsApp Human Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ToolArtifactCard({
  artifact,
  onCopy,
  copiedKey,
}: {
  artifact: LiveToolArtifact;
  onCopy: (key: string, val: string) => void;
  copiedKey: string | null;
}) {
  if (artifact.actionType === 'workspace_draft') {
    const entries = Object.entries(artifact.fields || {}).filter(
      ([, v]) => v !== undefined && String(v).trim() !== ''
    );
    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400 font-mono tabular-nums">
          <span>
            Draft {artifact.id} · {artifact.workflowType.toUpperCase()}
          </span>
          <span className="text-emerald-400">{artifact.creditsCost} credits</span>
        </div>
        <div className="text-sm font-bold text-white font-display">{artifact.title}</div>
        {entries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {entries.map(([k, v]) => (
              <div key={k} className="truncate">
                <span className="text-slate-400">{k}: </span>
                <span className="text-slate-200 font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 flex items-center justify-between gap-2">
          <a
            href={artifact.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5"
          >
            <span>Open Form on nbatools.cc.cd</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => onCopy(artifact.id, JSON.stringify(artifact.fields, null, 2))}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === artifact.id ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (artifact.actionType === 'credit_calculation') {
    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
          <span>Credit Calculation Result</span>
          <span className="text-emerald-400 font-semibold">
            Total: {artifact.totalCreditsRequired} credits
          </span>
        </div>
        <div className="text-sm font-bold text-white font-display">
          Recommended: {artifact.recommendedPlan.name} Plan ({artifact.recommendedPlan.credits} credits · ₦
          {artifact.recommendedPlan.amountNgn.toLocaleString()})
        </div>
        <div className="text-xs text-slate-300 font-mono tabular-nums">
          PalmPay · 8109893166 · Osanyinlusi Olayemi
        </div>
        <div className="pt-1 flex items-center gap-2">
          <a
            href={artifact.subscriptionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1"
          >
            <span>Open Subscription Page</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <a
            href={artifact.whatsappVerificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium inline-flex items-center gap-1"
          >
            <span>WhatsApp Approval</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (artifact.actionType === 'carrier_country_lookup') {
    const c = artifact.matchedCountry;
    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
        <div className="text-slate-400 font-mono">
          Carrier & Origin Country Auto-Fill Lookup
        </div>
        {c ? (
          <div className="space-y-1">
            <div className="text-sm font-bold text-white">
              {c.name} ({c.code}) · {c.dialCode} · {c.currency}
            </div>
            <div className="text-slate-300 font-mono tabular-nums">
              Tax: {c.taxName} {c.taxRate}% · Default ETA: {c.leadDays} days
            </div>
            <div className="text-slate-400">
              Carriers: {c.localCarriers.join(' · ')}
            </div>
          </div>
        ) : (
          <div className="text-slate-300">
            Supported Carriers: {SUPPORTED_CARRIERS.join(' · ')}
          </div>
        )}
        <div className="pt-1">
          <a
            href={artifact.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Open Tracking Portal on nbatools.cc.cd</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5 text-xs">
      <div className="flex items-center justify-between text-amber-300 font-mono">
        <span>Support Escalation · {artifact.ticketReference}</span>
        <span>{artifact.category}</span>
      </div>
      <div className="text-sm font-semibold text-white">{artifact.summary}</div>
      <div className="pt-1">
        <a
          href={artifact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5"
        >
          <span>Continue on Official WhatsApp Support</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
