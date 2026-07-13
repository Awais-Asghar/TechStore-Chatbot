// techstore.com.pk chatbot backend - Vercel serverless function
// Integrates with WooCommerce REST API for live product search
// and Groq LLM for natural language responses.

// ── Extract search keywords from natural language ───────────────
function extractSearchTerms(message) {
  const lower = message.toLowerCase();

  // Remove common filler words to get better search terms
  const stopWords = [
    "suggest", "recommend", "show", "give", "tell", "find", "search",
    "me", "my", "i", "want", "need", "looking", "for", "a", "an", "the",
    "some", "any", "best", "good", "top", "please", "can", "you", "do",
    "have", "what", "which", "is", "are", "in", "of", "with", "about",
    "under", "below", "above", "budget", "range", "price", "between",
    "specs", "specifications", "details", "info", "information",
    "ok", "okay", "yes", "no", "thanks", "thank", "hi", "hello",
    "available", "stock", "buy", "purchase", "order"
  ];

  // Extract budget/price if mentioned (e.g., "30k", "30000", "30,000")
  let maxPrice = null;
  const priceMatch = lower.match(/(\d{1,3}),?(\d{3})/);
  const kMatch = lower.match(/(\d+)\s*k\b/);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[0].replace(",", ""));
  } else if (kMatch) {
    maxPrice = parseInt(kMatch[1]) * 1000;
  }

  // Clean up the message to extract product-relevant keywords
  const words = lower
    .replace(/[^\w\s-]/g, " ")    // remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.includes(w))
    .filter(w => !/^\d+k?$/.test(w));  // remove bare numbers

  // Build search query from remaining keywords
  const searchQuery = words.join(" ").trim();

  return { searchQuery, maxPrice };
}

// ── WooCommerce product search ──────────────────────────────────
async function searchProducts(searchQuery, maxPrice) {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!key || !secret) {
    console.warn("WooCommerce API keys not configured, skipping product search");
    return [];
  }

  if (!searchQuery || searchQuery.length < 2) return [];

  try {
    let url = `https://techstore.com.pk/wp-json/wc/v3/products?search=${encodeURIComponent(searchQuery)}&per_page=8&status=publish&orderby=popularity`;
    if (maxPrice) {
      url += `&max_price=${maxPrice}`;
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const response = await fetch(url, {
      headers: { "Authorization": `Basic ${auth}` },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      console.error("WooCommerce API error:", response.status, await response.text());
      return [];
    }

    const products = await response.json();

    return products.map(p => {
      // Strip HTML tags from description to get clean text
      const desc = (p.description || "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#8211;/g, "–")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .substring(0, 1500);

      const shortDesc = (p.short_description || "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .substring(0, 500);

      return {
        name: p.name,
        price: p.price ? `Rs. ${Number(p.price).toLocaleString()}` : "Contact for price",
        regular_price: p.regular_price ? `Rs. ${Number(p.regular_price).toLocaleString()}` : null,
        sale_price: p.sale_price ? `Rs. ${Number(p.sale_price).toLocaleString()}` : null,
        on_sale: p.on_sale || false,
        stock_status: p.stock_status || "unknown",
        url: p.permalink,
        description: desc,
        short_description: shortDesc,
        categories: (p.categories || []).map(c => c.name).join(", "),
      };
    });
  } catch (err) {
    console.error("WooCommerce search failed:", err.message);
    return [];
  }
}

// ── Format product results for LLM context ─────────────────────
function formatProductContext(products) {
  if (!products.length) {
    return "\n\n=== PRODUCT SEARCH RESULTS ===\nNo matching products found in the database. Tell the customer you couldn't find an exact match, and suggest browsing the relevant category page or searching on the website. Do NOT invent or guess any product names, URLs, or prices.\n";
  }

  let context = "\n\n=== LIVE PRODUCT SEARCH RESULTS (from techstore.com.pk database) ===\n";
  context += "IMPORTANT: ONLY recommend products listed below. Do NOT invent products, URLs, or prices that are not in this list.\n\n";

  products.forEach((p, i) => {
    context += `PRODUCT ${i + 1}: ${p.name}\n`;
    context += `  Price: ${p.price}`;
    if (p.on_sale && p.regular_price) context += ` (was ${p.regular_price})`;
    context += "\n";
    context += `  Stock: ${p.stock_status === "instock" ? "In Stock ✓" : p.stock_status === "outofstock" ? "Out of Stock" : "Check availability"}\n`;
    context += `  URL: ${p.url}\n`;
    if (p.categories) context += `  Category: ${p.categories}\n`;
    if (p.short_description) context += `  Summary: ${p.short_description}\n`;
    if (p.description) context += `  Full Description:\n${p.description}\n`;
    context += "\n";
  });

  return context;
}

// ── System prompt ───────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TechBot, the AI customer support assistant for techstore.com.pk,
an online electronics and networking equipment store based in Multan, Pakistan.
Website: https://techstore.com.pk
Phone: +92 331 0000203
Address: Tech Store, New Shahshams Commercial Center, Mumtazabad, Multan

=== LANGUAGE RULES (CRITICAL, FOLLOW STRICTLY) ===
- If the customer writes in English, you MUST reply in English only. Do NOT switch to Urdu or Roman Urdu.
- If the customer writes in Roman Urdu, reply in Roman Urdu.
- If they write in Urdu script, reply in Urdu script.
- NEVER mix languages. Match the customer's language exactly.

=== STORE POLICIES ===
- Shipping: Nationwide delivery across Pakistan (all major cities including Karachi, Lahore, Islamabad, Peshawar, Multan, Faisalabad, etc.)
- Returns: 7-day return and warranty window on all items
- Payment: Cash on Delivery (COD), bank transfer, and card payment
- Products: Mix of brand new (boxed) and branded used/renewed items, all tested and in working condition

=== CRITICAL RULE: NEVER FABRICATE PRODUCTS ===
You will receive LIVE PRODUCT SEARCH RESULTS from the store's real database.
- ONLY mention products that appear in the search results below.
- NEVER invent, guess, or fabricate product names, model numbers, URLs, prices, or specs.
- If the search results don't have what the customer wants, say so honestly and suggest browsing the category page.
- EVERY product URL you share MUST come exactly from the search results. Do NOT construct or guess URLs.

=== HOW TO FORMAT RESPONSES ===
When presenting products, use bullet points:
- **Model:** [exact name from search results]
- **WiFi Standard:** [from description]
- **Speed:** [from description]
- **Processor:** [from description]
- **Memory:** [from description]
- **Ports:** [from description]
- **Features:** [from description]
- **Price:** Rs. X (was Rs. Y if on sale)
- **Stock:** In Stock / Out of Stock
- **Product Page:** [exact URL from search results]

If the customer asks for budget recommendations, only show products from the search results that fit their budget.
If the product is on sale, highlight both the sale price and original price.

=== CATEGORY BROWSE LINKS ===
When a customer wants to browse a category, give them these links:
- All Routers: https://techstore.com.pk/product-category/routers/
- WiFi 6 Routers: https://techstore.com.pk/product-category/routers/wifi-6/
- WiFi 6E Routers: https://techstore.com.pk/product-category/routers/wi-fi-6e/
- WiFi 5 Routers: https://techstore.com.pk/product-category/routers/wi-fi-5-routers/
- Gaming Routers: https://techstore.com.pk/product-category/gaming-router
- Mesh Systems: https://techstore.com.pk/product-category/mesh-system
- VPN Routers: https://techstore.com.pk/product-category/routers/vpn-router/
- ASUS Routers: https://techstore.com.pk/product-category/asus/
- TP-Link Routers: https://techstore.com.pk/product-category/routers/tp-link/
- D-Link Routers: https://techstore.com.pk/product-category/routers/d-link/
- Netgear Routers: https://techstore.com.pk/product-category/routers/netgear-router/
- MikroTik Routers: https://techstore.com.pk/product-category/routers/mikrotik-routers/
- Network Switches: https://techstore.com.pk/product-category/network-switches/
- Cisco Switches: https://techstore.com.pk/product-category/cisco-switches
- PoE Switches: https://techstore.com.pk/product-category/poe-switch
- Access Points: https://techstore.com.pk/product-category/access-point
- WiFi Extenders: https://techstore.com.pk/product-category/wifi-extender-repeater
- Security Cameras: https://techstore.com.pk/product-category/dvr/security-cameras/
- Firewalls: https://techstore.com.pk/product-category/firewall
- Servers: https://techstore.com.pk/product-category/server-adapter/
- DAC Cables: https://techstore.com.pk/product-category/dac-cables/
- Fiber Optic Cables: https://techstore.com.pk/product-category/accessories/fiber-optic-cable/
- Best Sellers: https://techstore.com.pk/product-category/best-sellers/
- New Arrivals: https://techstore.com.pk/product-category/new-arrival/
- Shop All: https://techstore.com.pk/shop/

=== RESPONSE RULES ===
- Format product specs using bullet points (use - prefix for each spec line).
- Keep answers clear and helpful.
- ONLY use URLs from the search results or from the category links above. NEVER construct URLs yourself.
- If asked something unrelated to the store (general chit chat is fine briefly, but do not answer questions about coding, homework, etc).
- If a customer seems frustrated or asks for a human, immediately give them the phone number +92 331 0000203.
- NEVER respond in a language different from what the customer used. This is your most important rule.
`;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userMessage = (req.body?.message || "").trim();

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (userMessage.length > 1000) {
      return res.status(400).json({ error: "Message too long" });
    }

    // ── Extract smart search terms and budget from user message ──
    const { searchQuery, maxPrice } = extractSearchTerms(userMessage);
    console.log(`Search: "${searchQuery}" | Budget: ${maxPrice || "none"}`);

    // ── Search WooCommerce for relevant products ──
    const products = await searchProducts(searchQuery, maxPrice);
    const productContext = formatProductContext(products);

    // ── Build the full prompt with live product data ──
    const fullSystemPrompt = SYSTEM_PROMPT + productContext;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();

      if (groqResponse.status === 429) {
        console.warn("GROQ RATE LIMIT HIT:", errText);
        return res.status(429).json({
          reply: "We're getting a lot of questions right now, please try again in a minute, or call us at +92 331 0000203."
        });
      }

      console.error("Groq API error:", errText);
      return res.status(502).json({ error: "Chatbot service is unavailable right now" });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.";

    res.status(200).json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};