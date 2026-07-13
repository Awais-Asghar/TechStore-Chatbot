# TechBot – Project Documentation

> AI Customer Support Chatbot for [techstore.com.pk](https://techstore.com.pk)
> Last Updated: July 13, 2026

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
- Quick action buttons (expanded to 10 in Phase 4.5)
- Timestamps on every message
- Smooth animations on message appearance
- Mobile responsive design
- "Powered by TechStore.com.pk" footer

### Phase 4: WooCommerce API Integration ✅ (COMPLETE)
- **WooCommerce API keys generated and configured in Vercel** (`WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`)
- Removed the static product catalog from the system prompt — replaced entirely by **live product data**
- Added `extractSearchTerms()` — strips filler/stop words and detects budget/price (e.g. "30k", "30,000") from the user's message
- Added `searchProducts()` — calls the WooCommerce REST API (`/wp-json/wc/v3/products?search=...`) with Basic auth and an 8s timeout (price filtering is now done in JS — see Phase 4.5)
- Cleans HTML/entities out of product descriptions and returns structured fields: name, price, regular/sale price, on-sale flag, stock status, permalink, description, short description, categories
- Added `formatProductContext()` — injects live search results into the LLM context and instructs the model to ONLY use those products/URLs (anti-fabrication guardrail)
- Tightened generation params: `temperature: 0.3`, `max_tokens: 1000`
- Added graceful fallbacks: missing API keys, empty results, and Groq 429 rate-limit handling

### Phase 4.5: Reliability & UX Hardening ✅ (July 13, 2026)

**Search accuracy & anti-fabrication (`api/chat.js`)**
- **Fixed budget queries returning zero results** — removed the `max_price` query param (it is a WooCommerce *Store-API* parameter that the v3 REST API ignores/misbehaves on). Price filtering is now done **client-side in JS** on the numeric price and sorted cheapest-first. This was the root cause of both the "no switches found" bug and the fabricated 404 URLs (the LLM invented products when search returned nothing).
- **Preserve spec digits** — the `"6"` in "wifi 6" was being dropped by a `length > 1` filter; now kept, so WiFi 6 / WiFi 5 queries match.
- **Singular-first search** (`buildSearchCandidates()`) — searches the singular form first (`switch`, `router`) because WooCommerce LIKE-search matches those far better than plurals; falls through candidate queries until one yields usable results.
- **Typo tolerance** (`correctTypo()` + `editDistance()`) — maps misspelled product words to the nearest known keyword via Levenshtein distance (e.g. `swithces → switches`, `rooters → routers`) while leaving brand/model names (cisco, netgear, tp-link, rt-ax56u) untouched.
- **De-duplicate junk variants** (`normalizeProducts()`) — drops "Product (1)", "Product (2)" clones.
- **`sanitizeProductUrls()` guardrail** — any fabricated `/product/` URL in the reply is replaced with the shop page so a 404 link can never reach a customer.
- Added more filler stopwords (`gimme`, `pls`, `wanna`, `bro`, etc.).

**Abusive-message de-escalation (`api/chat.js`)**
- New system-prompt section: on abusive input the bot stays calm, asks the reason for the frustration, shares ONE **hard-coded authentic** quote discouraging abuse (Tirmidhi 1977 / Bukhari 48 & Muslim 64 / Quran 49:11), and offers the human helpline — in the customer's language. The prompt explicitly forbids inventing or paraphrasing any hadith/verse to prevent misquotation.

**Frontend UX (`Techbot.html`)**
- **Fixed broken links** — `linkify()` now parses markdown `[text](url)` links and bare URLs in one pass (it previously mangled markdown links into broken hrefs → false "page not found"). Safari-safe (no regex lookbehind).
- **Asterisk bullets** — `*` and `+` now render as list bullets, not just `-`/`•`.
- **Spacing between products** — any bullet containing a `/product/` link gets extra bottom margin, visually separating product blocks.
- **Emoji picker** — smiley button next to Send opens an emoji panel; inserts at the cursor, closes on outside click.
- **Expanded quick-action buttons (10, no emoji icons):** Best Sellers, Routers, WiFi 6, Switches, Mesh Systems, Access Points, Cameras, Payment, Shipping, Returns.

---

## ⚠️ Known Issues (Current)

### 1. Search Term Matching
Keyword extraction is heuristic (stop-word removal + typo correction + singular-first). It handles common typos and plurals now, but very vague queries can still miss or return loosely related products.

### 2. Single-Turn Context
Each request is stateless — no conversation history is passed, so multi-turn follow-ups ("what about the cheaper one?") lack context.

### 3. WooCommerce Dependency / Slow Site
If the WooCommerce API is slow or down, product search returns empty and the bot falls back to category links only (8s timeout guards against hangs). The live site can also be slow to load product pages (links are valid, just slow).

### 4. Inconsistent Response Formatting
The LLM sometimes formats products as bullet lists, sometimes as `|`-separated lines, and sometimes emits markdown `[text](url)` links. The frontend handles all of these, but the product-spacing UX only triggers on bulleted output.

---

## 🔜 What's Next (Remaining)

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
| `WC_CONSUMER_KEY` | Vercel ✅ | WooCommerce API read access |
| `WC_CONSUMER_SECRET` | Vercel ✅ | WooCommerce API authentication |

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **LLM** | Groq API – llama-3.3-70b-versatile |
| **Backend** | Node.js serverless function (Vercel) |
| **Frontend** | Vanilla HTML/CSS/JS |
| **Hosting** | Vercel (auto-deploy from GitHub) |
| **Store Platform** | WordPress + WooCommerce |
| **API Integration** | WooCommerce REST API v3 ✅ (live) |

---

## 📞 Store Information

- **Website:** https://techstore.com.pk
- **Phone:** +92 331 0000203
- **Address:** Tech Store, New Shahshams Commercial Center, Mumtazabad, Multan
- **Business:** New and used networking equipment (routers, switches, access points, etc.)
- **Brands:** ASUS, TP-Link, D-Link, Netgear, Cisco, MikroTik, Ubiquiti, and more
