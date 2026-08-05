# incconutwo.com 

The official personal portfolio website and project showcase for **incconu_two** ([@tnemoroccan](https://x.com/tnemoroccan)) — developer of privacy-focused browser extensions and tools.

Live Website: **[incconutwo.com](https://incconutwo.com)** | Bio Links: **[incconutwo.com/links](https://incconutwo.com/links)**

---

## <img src="./public/assets/icons/readme/sparkles.svg" width="24" height="24" align="center" alt="Key Features" /> Key Features & Architecture

- **Lightning-Fast Hybrid SSR/Static:** Powered by **Astro 5+** with Vercel serverless integration.
- **Glassmorphism & Custom Design System:** Built with modern Vanilla CSS, custom HSL color tokens, responsive layouts, and interactive micro-animations.
- **Live Widgets & Dynamic API Integrations:**
  - <img src="./public/assets/icons/readme/music.svg" width="16" height="16" align="center" alt="Spotify" /> **Spotify Now Playing & Top Tracks:** Live track status with real-time extracted cover palette colors.
  - <img src="./public/assets/icons/readme/gamepad.svg" width="16" height="16" align="center" alt="Steam" /> **Steam Gaming Activity:** Accurate last played game detection sorted by `rtime_last_played`.
  - <img src="./public/assets/icons/readme/trophy.svg" width="16" height="16" align="center" alt="Lichess" /> **Lichess Stats:** Rating and game count proxy integration.
  - <img src="./public/assets/icons/readme/bell.svg" width="16" height="16" align="center" alt="Alerts" /> **Instant Phone Alerts:** Serverless `ntfy.sh` integration with 30-second rate-limiting cooldown and message truncation.
- **Zero-Lag Interactive UI:**
  - 1:1 instant custom mouse tracking with dynamic velocity-based shake scaling.
  - Smooth inertia scrolling via Lenis.
  - High-performance layout shift (CLS) pre-reserved containers and asset preloading.

---

## <img src="./public/assets/icons/readme/cpu.svg" width="24" height="24" align="center" alt="Tech Stack" /> Tech Stack

- **Framework:** [Astro 5](https://astro.build/)
- **Styling:** Vanilla CSS (Modular design tokens, glassmorphism, responsive breakpoints)
- **Deployment:** [Vercel](https://vercel.com/) (Serverless Functions + Analytics + Speed Insights)
- **APIs:** Spotify Web API, Steam Web API, Lichess API, ntfy.sh

---

## <img src="./public/assets/icons/readme/terminal.svg" width="24" height="24" align="center" alt="Quick Start" /> Quick Start

### 1. Prerequisites
Ensure you have **Node.js 18+** installed.

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/incconutwo/incconutwo.com.git
cd incconutwo.com
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Spotify Integration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token

# Steam Integration
STEAM_API_KEY=your_steam_api_key
STEAM_USER_ID=your_steam_64_id

# Phone Notifications (Optional)
NTFY_TOPIC=your_ntfy_topic_name
```

### 🔑 Telemetry & Analytics Pipeline (Optional)
This portfolio features an autonomous CWS & AMO extension analytics collector (`scripts/cws-collector/`):
- **Upstash Redis:** Caches 90-day time-series data and rotated session cookies.
- **GitHub Actions Workflow (`.github/workflows/cws-analytics.yml`):** Runs Playwright every 2 hours to update user counts.

Add these secrets to GitHub Repository Settings / Vercel Environment Variables:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CWS_COOKIE`


### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:4321` in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## <img src="./public/assets/icons/readme/folder.svg" width="24" height="24" align="center" alt="Project Structure" /> Project Structure

```text
├── public/                 # Static assets, fonts, project screenshots
├── src/
│   ├── components/         # Page sections & interactive widgets
│   ├── js/                 # Client-side interactivity (cursor, smooth scroll, widgets)
│   ├── layouts/            # Base HTML & SEO head metadata
│   ├── pages/              # Astro pages & API serverless endpoints (/api/*)
│   └── styles/             # Modular CSS design system & utilities
└── astro.config.mjs        # Astro configuration with Vercel adapter
```

---

## <img src="./public/assets/icons/readme/file.svg" width="24" height="24" align="center" alt="License" /> License

Distributed under the MIT License. See `LICENSE` for more details.