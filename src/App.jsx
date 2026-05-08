import { useState, useEffect, useRef } from "react";

// ... (your existing code)

async function callAI(u, s) {
  try {
    const r = await fetch("https:                                   
      method: "//api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: s,
        messages: [{ role: "user", content: u }]
      })
    });
    const d = await r.json();
    return JSON.parse(d.content.map(i => i.text || "").join("").replace(/
```json|
```/g, "").trim());
  } catch { return null; }
}

                           

                                        
function Dashboard({ journals, setScreen, setActiveJournal }) {
  const [dailyInsight, setDailyInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  async function getDailyInsight() {
    setLoadingInsight(true);
    const ctx = buildHistoryContext(journals);
    const result = await callAI(ctx, `You are an elite trading psychology coach...`);
    setDailyInsight(result || { insight: "// ... (your existing code)

// Add AI integration to your components
function Dashboard({ journals, setScreen, setActiveJournal }) {
  const [dailyInsight, setDailyInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  async function getDailyInsight() {
    setLoadingInsight(true);
    const ctx = buildHistoryContext(journals);
    const result = await callAI(ctx, `You are an elite trading psychology coach...`);
    setDailyInsight(result || { insight: "Your NY Open performance is your strongest edge...", type: "pattern", emoji: "🎯" });
    setLoadingInsight(false);
  }

  useEffect(() => {
    getDailyInsight();
  }, []);
}

// ... (your existing code)
