export default async function handler(req, res) {
  // Allow requests from the hosted tutor page. For production, replace * with
  // the exact origin where your GRAB Tutor page is hosted.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server is missing OPENAI_API_KEY." });

  try {
    const { message, history = [], program = [], registers = [], pc = 0 } = req.body || {};
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A non-empty message is required." });
    }

    const safeHistory = Array.isArray(history) ? history.slice(-12).map(item => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || "").slice(0, 4000)
    })) : [];

    const context = {
      currentProgram: Array.isArray(program) ? program.slice(0, 150) : [],
      registers: Array.isArray(registers) ? registers.slice(0, 8) : [],
      programCounter: Number.isFinite(pc) ? pc : 0
    };

    const instructions = `You are the AI tutor inside GRAB Tutor, an educational companion for GRAB's GASM programming language.
Be friendly, clear, and accurate. Help write, explain, and debug GASM. Never invent an instruction or claim uncertain syntax is verified.
Known instruction families include SET, SWAP, ADD, SUB, MUL, DIV, POW, MOD, SQRT, ABS, EQUAL, LESS, GREATER, AND, OR, NOT, LABEL, GOTO, IF, END, SLEEP, RAND, FLOOR, SIN, COS, ATAN2, and VEC_SET, VEC_ADD, VEC_SUB, VEC_MUL, VEC_SCL, VEC_LEN, VEC_DOT.
General known patterns: LABEL name; GOTO name; IF REG label (jump when register is nonzero); SET DST SRC; arithmetic DST A B; comparisons DST A B. Player and object fields must be configured as connections in the user's level. Distinguish confirmed facts from assumptions. Collision detection, raycasts, and pathfinding are not confirmed by the provided reference; do not invent commands for them.
When asked for code, provide a complete code block and briefly explain setup/required connections. For debugging, inspect labels, operand counts, register usage, and control flow.
Current editor context (may be incomplete): ${JSON.stringify(context)}`;

    const input = [
      ...safeHistory,
      { role: "user", content: message.trim() }
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions,
        input
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "The AI provider returned an error."
      });
    }

    const reply = data.output_text || (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n");

    return res.status(200).json({ reply: reply || "I couldn't generate a response. Please try again." });
  } catch (error) {
    return res.status(500).json({ error: "Tutor server error: " + error.message });
  }
}
