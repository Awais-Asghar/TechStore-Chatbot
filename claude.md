# TechBot – Project Documentation

> AI Customer Support Chatbot for [techstore.com.pk](https://techstore.com.pk)
> Last Updated: July 12, 2026

---

## 📁 Project Structure

```
Chatbot/
├── api/
│   └── chat.js              # Serverless backend (Vercel Function)
├── images/
│   ├── chatbot-logo.png      # TechBot robot avatar (purple)
│   └── techstore-logo.png    # TechStore "M" logo (purple circle)
├── Techbot.html              # Frontend chat UI
├── package.json              # Node.js dependencies (groq-sdk)
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules
├── README.md                 # Repo readme
└── claude.md                 # This file – project documentation
```

---

## 🌐 Live URLs

| Resource | URL |
|----------|-----|
| **Chat UI** | https://techstore-chatbot.vercel.app/Techbot.html |
| **API Endpoint** | https://techstore-chatbot.vercel.app/api/chat |
| **GitHub Repo** | https://github.com/Awais-Asghar/TechStore-Chatbot |
| **Vercel Dashboard** | https://vercel.com (TechStore-Chatbot project) |

---

## ✅ What's Been Done

### Phase 1: Clean-Slate Deployment
- Initialized a fresh Node.js project with `groq-sdk` dependency
- Created `api/chat.js` as a Vercel serverless function
- Connected to Groq API using `llama-3.3-70b-versatile` model
- Set up CORS headers for cross-origin requests
- Deployed to Vercel via GitHub auto-deploy
- Configured `GROQ_API_KEY` environment variable in Vercel

### Phase 2: System Prompt & Product Catalog
- Built a comprehensive system prompt with:
  - Store identity (TechStore, Multan, Pakistan)
  - Contact info (+92 331 0000203)
  - Address (New Shahshams Commercial Center, Mumtazabad, Multan)
  - Store policies (7-day return, COD available, nationwide shipping)
  - **Static product catalog** (~28 products with specs, prices, URLs)
  - 24+ category browsing links
- Implemented strict language matching rules (English ↔ Roman Urdu)
- Set `temperature: 0.4` and `max_tokens: 800`

### Phase 3: Frontend Redesign (TechBot)
- Renamed from `standalone-test.html` → `Techbot.html`
- Renamed chatbot from "techstore.com.pk assistant (test mode)" → **TechBot**
- **Purple/blue theme** (`#2D0A7E`) matching techstore.com.pk website
- Custom logos:
  - Purple robot avatar for bot messages (`images/chatbot-logo.png`)
  - TechStore "M" logo for website link (`images/techstore-logo.png`)
- Tagline: **"Your Tech Assistant"**
- Auto-resizing textarea (grows with text like modern chat apps)
- Proper text wrapping (`word-wrap: break-word`, `white-space: pre-wrap`)
- Markdown-style bullet point rendering (`-` and `•` → HTML `<ul>`)
- URL auto-linking (clickable product links in bot responses)
- Bold text rendering (`**text**` → `<strong>`)
- Typing indicator (animated dots while bot thinks)
- Quick action buttons (Best Sellers, WiFi 6, Payment, Returns)
- Timestamps on every message
- Smooth animations on message appearance
- Mobile responsive design
- "Powered by TechStore.com.pk" footer

---

## ⚠️ Known Issues (Current)

### 1. Static Product Catalog
The bot only knows ~28 products hard-coded in the system prompt. Products not in this list get generic "browse our website" responses.

### 2. Wrong Product Links
Since the LLM matches products by name similarity from a small static list, it sometimes returns the wrong product URL (e.g., asked about RT-AX56U but gets RT-AX82U link).

### 3. Missing Detailed Specs
The static catalog has abbreviated specs. The bot can't provide the full bullet-point specs shown on the actual product pages.

### 4. No Real-Time Prices or Stock
Prices in the catalog are snapshots that become outdated. Stock availability is unknown.

---

## 🔜 What's Next (Remaining)

### Phase 4: WooCommerce API Integration (Priority: HIGH)

**Goal:** Connect TechBot to the live techstore.com.pk product catalog so it can search, fetch real specs, prices, and stock in real-time.

**Status:** ⏳ Waiting for WooCommerce API keys from user

#### Steps Required:

1. **Generate WooCommerce API Keys** (User action):
   - WordPress Admin → WooCommerce → Settings → Advanced → REST API
   - Create key with **Read** permission
   - Copy `Consumer Key` (ck_...) and `Consumer Secret` (cs_...)

2. **Add Keys to Vercel Environment Variables**:
   - `WC_CONSUMER_KEY` = your consumer key
   - `WC_CONSUMER_SECRET` = your consumer secret

3. **Update `api/chat.js`** (Code changes):
   - Add `searchProducts()` function that calls WooCommerce REST API
   - Endpoint: `https://techstore.com.pk/wp-json/wc/v3/products?search=KEYWORD`
   - Extract real product data: name, price, sale price, description, permalink, stock status
   - Inject search results into LLM context before generating response
   - Remove static product catalog from system prompt (replaced by live data)
   - Update response formatting rules to use bullet points

#### Expected Results After Integration:
- ✅ Real-time product specs pulled from website
- ✅ Correct product URLs (no more wrong links)
- ✅ Live prices including sale prices
- ✅ Stock availability status
- ✅ Bullet-point formatted specs matching the website
- ✅ Coverage of ALL products, not just 28

---

### Phase 5: WordPress Embedding (Priority: MEDIUM)

**Goal:** Embed TechBot as a floating chat widget on the live techstore.com.pk website.

#### Steps:
1. Create a WordPress-embeddable widget snippet (iframe or JS embed)
2. Add a floating chat button (bottom-right corner) that opens the chatbot
3. Style the widget to match the website seamlessly
4. Add the embed code to WordPress theme (via header/footer plugin or theme customizer)

---

### Phase 6: Polish & Monitoring (Priority: LOW)

- Monitor bot accuracy with real customer queries
- Add conversation history support (multi-turn context)
- Add rate limiting to prevent API abuse
- Set CORS to only allow `techstore.com.pk` origin (remove wildcard `*`)
- Add analytics/logging for common queries
- Consider adding product image thumbnails in responses

---

## 🔧 Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `GROQ_API_KEY` | Vercel | Groq LLM API authentication |
| `WC_CONSUMER_KEY` | Vercel (pending) | WooCommerce API read access |
| `WC_CONSUMER_SECRET` | Vercel (pending) | WooCommerce API authentication |

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **LLM** | Groq API – llama-3.3-70b-versatile |
| **Backend** | Node.js serverless function (Vercel) |
| **Frontend** | Vanilla HTML/CSS/JS |
| **Hosting** | Vercel (auto-deploy from GitHub) |
| **Store Platform** | WordPress + WooCommerce |
| **API Integration** | WooCommerce REST API v3 (pending) |

---

## 📞 Store Information

- **Website:** https://techstore.com.pk
- **Phone:** +92 331 0000203
- **Address:** Tech Store, New Shahshams Commercial Center, Mumtazabad, Multan
- **Business:** New and used networking equipment (routers, switches, access points, etc.)
- **Brands:** ASUS, TP-Link, D-Link, Netgear, Cisco, MikroTik, Ubiquiti, and more
