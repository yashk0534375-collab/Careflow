# CAREFLOW

> **Mission-grade health tracking.**

CareFlow is an austere, high-performance health tracking interface engineered with aerospace design principles. Built on a pure black canvas with a focus on typography and full-bleed imagery, it provides a precise, no-nonsense environment for monitoring your vital metrics: nutrition, hydration, medicine routines, and nearby medical facilities.

## Core Telemetry

- **Command Dashboard:** A unified command center for your daily health metrics.
- **Nutrition & Hydration:** Track caloric intake and water consumption with engineered precision.
- **Medical Proximity:** Integrated mapping to locate nearby hospitals and emergency centers instantly.
- **Medicine Regimen:** Uncompromising reminders for your medicinal schedule.
- **BMI Analysis:** Real-time body mass index calculation and tracking.
- **AI Assistant:** Integrated Gemini-powered chatbot for health queries and system assistance.

## Technical Foundation

- **Frontend:** React 19, Vite, TailwindCSS v4
- **Motion:** Framer Motion & GSAP for subtle, engineered micro-interactions
- **Mapping:** Leaflet & React-Leaflet for geospatial data
- **Backend & AI:** Express Server powering the Gemini AI integration

## Launch Sequence

**Prerequisites:** Node.js (v18 or higher)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Set your Gemini API key in a `.env.local` file at the root of the project to enable AI features:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Ignition:**
   ```bash
   npm run dev
   ```
   *The telemetry interface will be accessible locally.*

## Design Philosophy

The interface is an exercise in negation: pure black canvas, tight vertical leading, uppercase industrial typography, and ghost-outlined CTAs. It prioritizes data clarity and visual minimalism over decorative elements, delivering an unapologetically focused user experience.
