// techstore.com.pk chatbot backend - Vercel serverless version
// Same logic as server.js, but shaped as a serverless function
// instead of a continuously-running Express server.
//
// Deploy this whole project to Vercel, and this file automatically
// becomes reachable at: https://your-project.vercel.app/api/chat

const SYSTEM_PROMPT = `You are the customer support assistant for techstore.com.pk,
an online electronics and networking equipment store based in Multan, Pakistan.

What we sell: routers, switches, wireless access points, security cameras,
firewalls, servers, networking cables, and related IT hardware.

Shipping: within Pakistan, standard delivery.
Returns: 7-day return and warranty window on eligible items.
Payment: cash on delivery, bank transfer, and card payment.
Contact for anything you cannot answer: phone +92 331 0000203.

Rules for how you respond:
- Keep answers short, clear, and friendly, 2 to 4 sentences unless the customer asks for detail.
- Match the customer's language and style. Many customers write in Roman Urdu
  (Urdu written in English letters, e.g. "iska price kia hai" or "delivery kab tak hogi").
  If the customer writes in Roman Urdu, reply in Roman Urdu the same way.
  If they write in Urdu script, reply in Urdu script. If they write in English, reply in English.
  Do not force English replies onto a customer who did not write in English.
- Never invent a specific price or stock status you are not certain of.
  Instead say something like: "I don't have live stock info for that item yet,
  please call us at +92 331 0000203 or check the product page." (translate this
  naturally into Roman Urdu or Urdu if that is the language of the conversation)
- If asked something unrelated to the store (general chit chat is fine briefly,
  but do not answer questions about unrelated topics like coding help, homework, etc).
- If a customer seems frustrated or asks for a human, immediately give them the phone number.
`;

module.exports = async (req, res) => {
  // CORS: allows the standalone test page (or later, your live site) to call this.
  // "*" is fine for testing. Once live, replace with "https://techstore.com.pk".
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Browsers send an OPTIONS request first to check CORS is allowed, before the real POST.
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

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        temperature: 0.4,
        max_tokens: 400
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();

      if (groqResponse.status === 429) {
        console.warn("GROQ RATE LIMIT HIT — consider upgrading to Developer tier:", errText);
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