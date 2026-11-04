# NBATOOLS · TrackPort Voice & Customer Concierge (Zara)

Real-time conversational voice & text customer concierge for **https://nbatools.cc.cd** (**TrackPort — Transport & Logistics**), powered by **Gemini 3.8 Live (`gemini-3.8-live`)** and **Gemini 3.8 Flash (`gemini-3.8-flash`)**.

## Features Included

1. **Real-Time Voice Conversations (`gemini-3.8-live`)**:
   - Server-side WebSocket bridge (`/ws/live`) in `server.ts`.
   - 16kHz PCM microphone input streaming & gapless 24kHz PCM voice output playback.
   - Barge-in / interruption support, live input & output transcriptions, and 6 selectable voice personas (`Zephyr`, `Kore`, `Aoede`, `Puck`, `Fenrir`, `Charon`).
2. **Complete `nbatools.cc.cd` Domain Knowledge & Live Tool Calling**:
   - **Trackable Shipments (`#/create-shipment`, `#/track`)**: 10 credits, 6-stage status flow, supported carriers (`TrackPort Logistics`, `DHL Express`, `FedEx`, `UPS`, `Aramex`, `GIG Logistics`, `Chronopost`, `EMS`, `USPS`), and origin country auto-fill presets.
   - **Flight Tickets (`#/create-flight`)**: 10 credits across 40+ international airlines.
   - **Business & Thermal Receipts (`#/create-receipt`)**: 5 credits across 4 templates.
   - **ID Studio & Document Mockups (`#/id-creations`)**: 5–6 credits for educational design mockups.
   - **AI Studio Photo Editor (`#/image-edit`)**: 5 credits with automatic refund on timeout/error.
   - **Credits & PalmPay Transfer Desk (`#/subscription`)**: Starter (`50 cr · ₦2,500`), Plus (`120 cr · ₦5,500`), Pro (`300 cr · ₦12,000`), Business (`800 cr · ₦30,000`), PalmPay (`8109893166 · Osanyinlusi Olayemi`), and WhatsApp verification (`https://wa.link/q6bcsj`).
3. **1-Line Drop-In Widget for `https://nbatools.cc.cd`**:
   - Embed `<script src="https://YOUR_HOST_DOMAIN/widget.js" defer></script>` before `</body>` on `https://nbatools.cc.cd`.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your `.env` file:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```
3. Start the server (runs on port `3000`):
   ```bash
   npm run dev
   ```
4. For production build:
   ```bash
   npm run build
   npm start
   ```
