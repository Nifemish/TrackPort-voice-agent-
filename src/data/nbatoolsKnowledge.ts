export interface CreditPlan {
  id: 'starter' | 'plus' | 'pro' | 'business';
  name: string;
  credits: number;
  amountNgn: number;
  audience: string;
  costPerCreditNgn: number;
  popular?: boolean;
  exampleCapacity: string;
}

export interface CreationCost {
  id: 'shipment' | 'flight' | 'idCreation' | 'receipt' | 'idStudio' | 'imageEdit';
  label: string;
  credits: number;
  route: string;
  description: string;
}

export interface CountryPreset {
  code: string;
  name: string;
  dialCode: string;
  currency: string;
  taxName: string;
  taxRate: number;
  leadDays: number;
  sampleAddress: string;
  localCarriers: string[];
}

export interface KnowledgeArticle {
  id: string;
  category: 'shipments' | 'flights' | 'receipts' | 'id-studio' | 'credits' | 'account';
  title: string;
  route: string;
  costLabel: string;
  summary: string;
  details: string[];
  voicePrompt: string;
}

export const NBATOOLS_SITE_URL = 'https://nbatools.cc.cd';
export const NBATOOLS_WHATSAPP_URL = 'https://wa.link/q6bcsj';

export const PALMPAY_BANK_DETAILS = {
  bankName: 'PalmPay',
  accountName: 'Osanyinlusi Olayemi',
  accountNumber: '8109893166',
  narrationRule: 'Use the generated payment reference code as the bank transfer narration.',
  approvalFlow:
    'Select a plan on #/subscription, transfer the NGN amount to PalmPay (8109893166 · Osanyinlusi Olayemi), upload your payment receipt screenshot, and click "Buy Credit Now". Your request is logged for admin approval and opens WhatsApp with your reference. Credits update live in your wallet once approved.',
  maxPendingRequests: 3,
};

export const CREATION_COSTS: CreationCost[] = [
  {
    id: 'shipment',
    label: 'Trackable Shipment Record',
    credits: 10,
    route: '#/create-shipment',
    description:
      'Create a multimodal shipment (Ocean, Air, or Land) with sender/recipient details, carrier branding, 6-stage status timeline, live route map, and shareable tracking link.',
  },
  {
    id: 'flight',
    label: 'Flight Ticket & Boarding Pass',
    credits: 10,
    route: '#/create-flight',
    description:
      'Generate a complete airline itinerary and boarding pass across 40+ global airlines with departure/arrival airports, cabin class, passenger details, and gate info.',
  },
  {
    id: 'idCreation',
    label: 'Standard ID Card Mockup',
    credits: 6,
    route: '#/create-license',
    description:
      'Design-only educational mockups for USA State Driver Licenses (HI, TX, PA, NJ, NY), UK Photocard, Canada, Australia, Military ID, SSN, or Citizenship/PR cards.',
  },
  {
    id: 'receipt',
    label: 'Business & Thermal Receipt',
    credits: 5,
    route: '#/create-receipt',
    description:
      'Build print-ready thermal or formal business receipts (Classic, Modern, Minimal, Bold templates) with itemized line items, tax/discount, and multi-currency support.',
  },
  {
    id: 'idStudio',
    label: 'ID Studio & Card Holder Creation',
    credits: 5,
    route: '#/id-creations',
    description:
      'Advanced interactive ID Studio and Card Holder mockup workspace with live portrait preview and custom layout controls.',
  },
  {
    id: 'imageEdit',
    label: 'AI Studio Photo Edit',
    credits: 5,
    route: '#/image-edit',
    description:
      'Upload up to 4 images, describe changes by image number ("image 1", "image 2"), choose aspect ratio, and generate edited visuals. Credits auto-refund if generation fails.',
  },
];

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    amountNgn: 2500,
    audience: 'For individual shipments & quick tasks',
    costPerCreditNgn: 50,
    exampleCapacity: '5 shipments OR 10 receipts / AI edits',
  },
  {
    id: 'plus',
    name: 'Plus',
    credits: 120,
    amountNgn: 5500,
    audience: 'For active sellers & travel coordinators',
    costPerCreditNgn: 45.83,
    popular: true,
    exampleCapacity: '12 shipments OR 24 receipts / AI edits',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 300,
    amountNgn: 12000,
    audience: 'For high-volume logistics & operations teams',
    costPerCreditNgn: 40,
    exampleCapacity: '30 shipments OR 60 receipts / AI edits',
  },
  {
    id: 'business',
    name: 'Business',
    credits: 800,
    amountNgn: 30000,
    audience: 'For enterprise agencies & multi-client workflows',
    costPerCreditNgn: 37.5,
    exampleCapacity: '80 shipments OR 160 receipts / AI edits',
  },
];

export const SHIPMENT_STATUS_STAGES = [
  'Order Created',
  'Picked Up',
  'In Transit',
  'Arrived at Facility',
  'Out for Delivery',
  'Delivered',
];

export const SUPPORTED_CARRIERS = [
  'TrackPort Logistics',
  'DHL Express',
  'FedEx',
  'UPS',
  'Aramex',
  'GIG Logistics',
  'Chronopost',
  'EMS',
  'USPS',
];

export const SUPPORTED_AIRLINES_BY_REGION: Record<string, string[]> = {
  'Global & Flagship': ['TrackPort Air', 'Emirates', 'Qatar Airways', 'Etihad Airways', 'Saudia', 'Oman Air', 'Flydubai'],
  Europe: ['British Airways', 'Lufthansa', 'Air France', 'KLM Royal Dutch Airlines', 'Turkish Airlines', 'Swiss International Air Lines', 'Ryanair', 'EasyJet'],
  'Asia-Pacific': ['Singapore Airlines', 'Cathay Pacific', 'Japan Airlines', 'All Nippon Airways', 'Korean Air', 'Air India', 'IndiGo', 'Malaysia Airlines', 'Qantas'],
  'North America': ['American Airlines', 'Delta Air Lines', 'United Airlines', 'Southwest Airlines', 'Air Canada', 'JetBlue Airways'],
  Africa: ['Ethiopian Airlines', 'Kenya Airways', 'RwandAir', 'EgyptAir', 'Royal Air Maroc', 'South African Airways', 'Air Mauritius', 'Arik Air', 'Air Peace'],
};

export const COUNTRY_AUTOFILL_PRESETS: CountryPreset[] = [
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    currency: 'GBP',
    taxName: 'VAT',
    taxRate: 20,
    leadDays: 3,
    sampleAddress: '221B Baker Street, London NW1 6XE',
    localCarriers: ['Royal Mail', 'DPD UK', 'Evri', 'Parcelforce', 'DHL Express'],
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    currency: 'USD',
    taxName: 'Sales Tax',
    taxRate: 8.25,
    leadDays: 4,
    sampleAddress: '350 Fifth Avenue, New York, NY 10118',
    localCarriers: ['USPS', 'UPS', 'FedEx', 'DHL Express'],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    dialCode: '+234',
    currency: 'NGN',
    taxName: 'VAT',
    taxRate: 7.5,
    leadDays: 3,
    sampleAddress: '14 Admiralty Way, Lekki Phase 1, Lagos',
    localCarriers: ['GIG Logistics', 'DHL Express', 'FedEx', 'TrackPort Logistics'],
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    currency: 'CAD',
    taxName: 'GST/HST',
    taxRate: 13,
    leadDays: 4,
    sampleAddress: '100 Queen Street West, Toronto, ON M5H 2N2',
    localCarriers: ['Canada Post', 'Purolator', 'FedEx', 'UPS'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    currency: 'AED',
    taxName: 'VAT',
    taxRate: 5,
    leadDays: 3,
    sampleAddress: 'Sheikh Zayed Road, Downtown Dubai',
    localCarriers: ['Aramex', 'Emirates Post', 'DHL Express', 'FedEx'],
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    currency: 'EUR',
    taxName: 'MwSt',
    taxRate: 19,
    leadDays: 3,
    sampleAddress: 'Friedrichstraße 108, 10117 Berlin',
    localCarriers: ['DHL Paket', 'Hermes', 'DPD', 'UPS'],
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    currency: 'EUR',
    taxName: 'TVA',
    taxRate: 20,
    leadDays: 3,
    sampleAddress: '24 Rue du Faubourg Saint-Honoré, 75008 Paris',
    localCarriers: ['Chronopost', 'Colissimo', 'DHL Express', 'FedEx'],
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    currency: 'AUD',
    taxName: 'GST',
    taxRate: 10,
    leadDays: 5,
    sampleAddress: '200 George Street, Sydney NSW 2000',
    localCarriers: ['Australia Post', 'StarTrack', 'DHL Express', 'FedEx'],
  },
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'shipments-overview',
    category: 'shipments',
    title: 'Creating & Tracking Multimodal Shipments',
    route: '#/create-shipment',
    costLabel: '10 credits',
    summary:
      'Create ocean, air, or ground freight shipments with automated country dial codes, VAT/tax rates, carrier branding, and live OpenStreetMap route tracking.',
    details: [
      'Supported carriers include TrackPort Logistics, DHL Express, FedEx, UPS, Aramex, GIG Logistics, Chronopost, EMS, and USPS.',
      'Selecting an origin country (UK, US, Nigeria, Canada, UAE, Germany, France, Australia) automatically fills the sender dial code, currency, local tax rate, and estimated delivery date.',
      'Every shipment moves through 6 clear stages: Order Created, Picked Up, In Transit, Arrived at Facility, Out for Delivery, and Delivered.',
      'Public deep links (?track=SHP-2026-XXXXXX, #/track/ID, #/pickup/ID, #/shipment-receipt/ID) survive email click-tracking redirects and can be shared with recipients without requiring login.',
    ],
    voicePrompt: 'Explain how shipment creation, origin country auto-fill, and tracking links work on nbatools.cc.cd.',
  },
  {
    id: 'flights-overview',
    category: 'flights',
    title: 'Flight Tickets & Airline Boarding Passes',
    route: '#/create-flight',
    costLabel: '10 credits',
    summary:
      'Organize air travel itineraries and generate branded boarding passes across 40+ international airlines in Economy, Premium Economy, Business, or First Class.',
    details: [
      'Includes authentic airline marks and color palettes for Emirates, Qatar Airways, British Airways, Lufthansa, Air France, KLM, Delta, United, American Airlines, Ethiopian Airlines, Air Peace, and TrackPort Air.',
      'Captures departure city/airport code, destination, date, cabin class, passenger full name, contact email/phone, and optional flight number.',
      'Supports route stops and airport terminal lookups for major hubs including Lagos (MMIA), Abuja, London, Dubai, New York, and Toronto.',
    ],
    voicePrompt: 'Tell me how to create a flight ticket on nbatools.cc.cd and what airlines and cabin classes are supported.',
  },
  {
    id: 'receipts-overview',
    category: 'receipts',
    title: 'Print-Ready Business & Thermal Receipts',
    route: '#/create-receipt',
    costLabel: '5 credits',
    summary:
      'Generate thermal-style or formal client receipts with itemized descriptions, quantities, unit prices, tax/discount percentages, and multi-currency formatting.',
    details: [
      'Supports 4 layout templates: Classic, Modern, Minimal, and Bold.',
      'Supports currencies including USD, EUR, GBP, NGN, CAD, AUD, INR, and ZAR.',
      'Payment methods include Card, Cash, Bank transfer, Mobile money, or custom entries.',
      'Receipts can be downloaded as high-resolution images or printed directly from the browser once generated with credits.',
    ],
    voicePrompt: 'How do I generate a business or thermal receipt on nbatools.cc.cd, and how many credits does it cost?',
  },
  {
    id: 'id-studio-overview',
    category: 'id-studio',
    title: 'ID Studio & Educational Document Mockups',
    route: '#/id-creations',
    costLabel: '5–6 credits',
    summary:
      'Create strictly educational, fictional design mockups for driver licenses, military IDs, SSN layouts, citizenship/PR cards, and card holders.',
    details: [
      'Driver Licenses (6 credits): USA State Licenses (Hawaii, Texas, Pennsylvania, New Jersey, New York), UK Photocard, Canada, and Australia.',
      'Military ID Mockups (6 credits): Supports Army, Navy, Air Force, Marines, Coast Guard, and Space Force with rank, pay grade, unit, and duty status.',
      'SSN & Citizenship Mockups (6 credits): SSN card mockup and Canada ID, Canada Permanent Resident (PR), and USA Citizenship card mockups.',
      'ID Studio & Card Holder (5 credits): Interactive preview studio with auto-shrinking portrait upload.',
      'Mandatory Policy: All ID outputs are design mockups for educational and demonstration purposes only—never official identity documents.',
    ],
    voicePrompt: 'What ID card mockups can I create in the ID Studio on nbatools.cc.cd, and what are the rules and credit costs?',
  },
  {
    id: 'ai-image-editor',
    category: 'account',
    title: 'AI Studio Multi-Photo Prompt Editor',
    route: '#/image-edit',
    costLabel: '5 credits',
    summary:
      'Upload up to 4 photos, describe how to combine or edit them by image number ("image 1", "image 2"), choose your aspect ratio, and download the result.',
    details: [
      'Supports up to 4 reference images (max 25 MB each; automatically resized for fast cloud processing).',
      'Prompt examples: "Let the person in image 1 hold the bag from image 2" or "Place the product on a clean studio table".',
      'Costs 5 credits per generation. If the server times out or encounters an error, your 5 credits are automatically refunded to your wallet.',
    ],
    voicePrompt: 'How does the AI photo editor work on nbatools.cc.cd, and what happens to my credits if an edit fails?',
  },
  {
    id: 'credits-and-payments',
    category: 'credits',
    title: 'Credits, Subscription Plans & PalmPay Bank Transfer',
    route: '#/subscription',
    costLabel: '₦2,500 – ₦30,000',
    summary:
      'Top up your TrackPort wallet via bank transfer to PalmPay (8109893166 · Osanyinlusi Olayemi) with live Firestore wallet sync and WhatsApp verification.',
    details: [
      '4 Plans: Starter (50 credits · ₦2,500), Plus (120 credits · ₦5,500), Pro (300 credits · ₦12,000), and Business (800 credits · ₦30,000).',
      'Bank Details: PalmPay · Account Number: 8109893166 · Account Name: Osanyinlusi Olayemi. Always put the generated reference code in your transfer narration.',
      'Upload your payment receipt screenshot and click "Buy Credit Now". You can have up to 3 pending payment requests at a time.',
      'Zero-Credit Guard: When your balance is 0 credits, document exports are watermarked/locked and screenshot protection is active until credits are added.',
    ],
    voicePrompt: 'Walk me through the credit plans on nbatools.cc.cd and how to pay via PalmPay and get my credits approved.',
  },
];

export const ZARA_SYSTEM_INSTRUCTION = `You are Zara, the official AI Voice & Customer Support Concierge for NBATOOLS / TrackPort (https://nbatools.cc.cd) — "One workspace. Every journey."
You speak with warmth, clarity, confidence, and helpful efficiency. Keep spoken responses natural, conversational, and concise (2 to 4 sentences per turn unless the customer asks for a detailed breakdown), and proactively use your tools whenever the customer asks about credit costs, plans, shipment/flight/receipt/ID setup, carrier/country rules, or support escalation.

COMPLETE KNOWLEDGE OF HTTPS://NBATOOLS.CC.CD (TRACKPORT / NBATOOLS):
1. WHAT THE WEBSITE IS:
   - Domain: https://nbatools.cc.cd (branded as TrackPort — Transport & Logistics / NBATOOLS).
   - Purpose: An all-in-one cloud and local-resilient workspace connecting trackable shipment records, airline flight tickets, print-ready business/thermal receipts, AI photo editing, and educational design-only ID card mockups.
   - Authentication & Storage: Uses Firebase Authentication & Firestore (project trackport-7ca87) with per-account data isolation and an offline PBKDF2-SHA256 local fallback so users never lose drafts. Uploaded images are automatically compressed under 150 KB to stay well under Firestore's 1 MB document limit.

2. CREDIT COSTS PER ACTION:
   - New Trackable Shipment (#/create-shipment): 10 credits
   - Flight Ticket & Boarding Pass (#/create-flight): 10 credits
   - Driver's License / Military / SSN / Citizenship ID Mockup (#/create-license, #/create-id-card/military, #/id-ssn, #/create-id-card/citizenship): 6 credits
   - ID Studio / Card Holder Creation (#/id-creations, #/create-card-holder): 5 credits
   - Business / Thermal Receipt (#/create-receipt): 5 credits
   - AI Studio Photo Edit (#/image-edit): 5 credits (automatically refunded if generation fails or times out!)

3. CREDIT PLANS & HOW TO PAY:
   - Starter Plan: 50 credits for ₦2,500 (₦50/credit)
   - Plus Plan: 120 credits for ₦5,500 (~₦45.83/credit)
   - Pro Plan: 300 credits for ₦12,000 (₦40/credit)
   - Business Plan: 800 credits for ₦30,000 (₦37.50/credit)
   - Payment Method: Bank transfer on #/subscription (or #/credits) to:
     * Bank Name: PalmPay
     * Account Number: 8109893166
     * Account Name: Osanyinlusi Olayemi
     * Narration: Use the unique payment reference shown on the Payment page.
   - Verification Flow: After transferring, upload the payment receipt screenshot (JPEG/PNG/WebP) and click "Buy Credit Now". The request is saved in Firestore for the admin and opens WhatsApp (https://wa.link/q6bcsj) with the payment details. Once the admin approves it, credits appear live in the user's wallet chip in the top bar. Up to 3 pending top-up requests are allowed at once.
   - Zero-Credit Protection: When a signed-in user has 0 credits, previews show a watermark, export/download/print buttons are locked, and screenshot/screen-capture protection blanks the screen until credits are added.

4. SHIPMENT CREATION & TRACKING (#/create-shipment, #/track):
   - Services: Multimodal Transport (Ocean Freight, Air Freight, Land Transport).
   - Supported Carriers: TrackPort Logistics, DHL Express, FedEx, UPS, Aramex, GIG Logistics, Chronopost, EMS, and USPS.
   - 6-Stage Status Flow: Order Created -> Picked Up -> In Transit -> Arrived at Facility -> Out for Delivery -> Delivered.
   - Origin Country Auto-Fill: Picking or typing an origin country (UK, USA, Nigeria, Canada, UAE, Germany, France, Australia, etc.) automatically fills the sender/recipient phone dial code (+44, +1, +234, +971, etc.), local currency (GBP, USD, NGN, CAD, AED, EUR, AUD), local tax/VAT rate (e.g. UK 20% VAT, Nigeria 7.5% VAT), local carriers, and estimated delivery date.
   - Package Types: Box, Envelope, Pallet, Documents, Crate, Fragile, Other.
   - Public Deep Links: ?track=ID, ?tn=ID, ?pickup=ID, ?receipt=ID, or #/track/ID work publicly for recipients and automatically normalize email click-tracking links.

5. FLIGHT TICKETS (#/create-flight):
   - Supports 40+ global airlines across Global/Middle East (TrackPort Air, Emirates, Qatar Airways, Etihad, Saudia, Oman Air, Flydubai), Europe (British Airways, Lufthansa, Air France, KLM, Turkish Airlines, Swiss, Ryanair, EasyJet), Asia-Pacific (Singapore Airlines, Cathay Pacific, JAL, ANA, Korean Air, Air India, IndiGo, Malaysia Airlines, Qantas), North America (American, Delta, United, Southwest, Air Canada, JetBlue), and Africa (Ethiopian Airlines, Kenya Airways, RwandAir, EgyptAir, Royal Air Maroc, South African Airways, Air Mauritius, Arik Air, Air Peace).
   - Cabins: Economy, Premium Economy, Business, First.
   - Fields: Departure city/airport, Destination, Departure Date, Cabin Class, Main Passenger Name, Email, Phone, Airline, Flight Number.

6. BUSINESS & THERMAL RECEIPTS (#/create-receipt):
   - Templates: Classic, Modern, Minimal, Bold (thermal-style and formal receipts).
   - Currencies: USD, EUR, GBP, NGN, CAD, AUD, INR, ZAR.
   - Payment Methods: Card, Cash, Bank transfer, Mobile money, Other.
   - Fields: Business Name, Address, Contact, Customer Name, Receipt Title, Receipt Number, Payment Method, Currency, Date, Tax Rate (%), Discount Rate (%), Line Items (Description, Quantity, Unit Price), Notes.

7. ID CREATION & MOCKUP STUDIO (#/id-creations):
   - Driver's Licenses (#/create-license): USA (Hawaii, Texas, Pennsylvania, New Jersey, New York), United Kingdom Photocard, Canada, Australia.
   - Military ID (#/create-id-card/military): Full name, Branch (Army, Navy, Air Force, Marines, Coast Guard, Space Force), Rank, Pay Grade, Unit, Duty Status, Issue/Expiry Date, Portrait Photo.
   - SSN Mockup (#/id-ssn): Full Name, SSN Display Format, Date of Birth, Issue Date.
   - Citizenship / PR Cards (#/create-id-card/citizenship): Canada Identification Card, Canada Permanent Resident (PR) Card, America/USA Citizenship Card.
   - Card Holder Studio (#/create-card-holder).
   - Strict Disclaimer: Always remind users that ID tools create fictional design mockups for educational and demonstration purposes only and are never official identity documents.

8. HUMAN SUPPORT & ESCALATION:
   - Direct WhatsApp Human Support & Payment Verification: https://wa.link/q6bcsj
   - Feature/Tool Requests: Users can also submit feature, tool, or setting requests directly to the admin (collection trackportRequests).

BEHAVIOR & TOOL USE:
- Whenever a customer asks how much their tasks will cost or which plan to buy, call \`calculateCreditsAndPlan\`.
- Whenever a customer wants to prepare a shipment, flight ticket, receipt, or ID mockup during the conversation, gather their details naturally and call \`prepareWorkspaceDraft\` so the pre-filled card appears on their screen ready to launch on https://nbatools.cc.cd.
- Whenever a customer asks about carriers, shipment stages, or country auto-fill rules, call \`lookupCarrierOrCountryInfo\`.
- Whenever a customer needs human help, has a pending payment issue, or wants to submit a feature request, call \`createSupportEscalation\`.`;
