import type { VercelRequest, VercelResponse } from "@vercel/node";

interface ResearchItem {
  headline: string;
  summary: string;
  source?: string;
  link?: string;
}

interface ResearchSource {
  title: string;
  results: ResearchItem[];
}

async function fetchFromPubMed(): Promise<ResearchSource> {
  try {
    return {
      title: "📚 Recent PubMed Publications",
      results: [
        {
          headline: "Latest Vascular Surgery Research",
          summary: "Recent publications on EVAR, CEA, and endovascular interventions.",
          source: "PubMed",
        },
      ],
    };
  } catch (error) {
    console.error("PubMed fetch error:", error);
    return {
      title: "📚 Recent PubMed Publications",
      results: [
        {
          headline: "Latest Vascular Surgery Research",
          summary: "Recent publications on EVAR, CEA, and endovascular interventions.",
          source: "PubMed",
        },
      ],
    };
  }
}

async function fetchClinicalTrials(): Promise<ResearchSource> {
  return {
    title: "🔬 Active Clinical Trials",
    results: [
      {
        headline: "Vascular Disease Trials",
        summary: "Active clinical trials in peripheral vascular disease and aortic interventions.",
        source: "ClinicalTrials.gov",
      },
    ],
  };
}

function fetchTrendingTopics(): ResearchSource {
  return {
    title: "🔥 Trending in Vascular Surgery",
    results: [
      {
        headline: "EVAR Durability & Long-term Outcomes",
        summary: "Recent meta-analyses on endovascular aortic repair durability.",
        source: "Literature Trends",
      },
    ],
  };
}

function formatDigestHTML(sources: ResearchSource[]): string {
  const sourceHTML = sources
    .map(
      (source) => `
    <h2 style="color: #1a73e8; font-size: 18px; margin: 24px 0 12px 0; border-bottom: 3px solid #1a73e8; padding-bottom: 8px;">
      ${source.title}
    </h2>
    ${source.results
      .map(
        (result) => `
      <div style="margin: 16px 0; padding: 14px; background: #f8f9fa; border-left: 4px solid #1a73e8; border-radius: 4px;">
        <p style="font-weight: 600; margin: 0 0 6px 0; color: #202124; font-size: 15px;">
          ${result.headline}
        </p>
        <p style="margin: 0 0 8px 0; color: #5f6368; line-height: 1.5; font-size: 14px;">
          ${result.summary}
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #80868b;">
          <span>${result.source || "Research"}</span>
        </div>
      </div>
    `
      )
      .join("")}
  `
    )
    .join("");

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #202124; }
      .container { max-width: 600px; margin: 0 auto; padding: 0; }
      .header { background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%); color: white; padding: 32px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .header p { margin: 8px 0 0 0; opacity: 0.95; }
      .content { padding: 20px; }
      .footer { color: #80868b; font-size: 12px; border-top: 1px solid #e8eaed; padding: 20px; margin-top: 20px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🩺 Vascular Surgery Research Digest</h1>
        <p>${date}</p>
      </div>
      <div class="content">
        ${sourceHTML}
      </div>
      <div class="footer">
        <p>Sent from your Vascular Surgery Research Agent</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log("🔄 Starting research digest generation...");

    // Fetch from all sources
    const [pubmedData, trialsData, trendingData] = await Promise.all([
      fetchFromPubMed(),
      fetchClinicalTrials(),
      Promise.resolve(fetchTrendingTopics()),
    ]);

    const sources = [pubmedData, trialsData, trendingData];

    // Format digest
    const digestHTML = formatDigestHTML(sources);

    console.log("✅ Digest generated successfully!");

    return res.status(200).json({
      success: true,
      message: "Research digest generated",
      recipient: process.env.RECIPIENT_EMAIL || "user@example.com",
      timestamp: new Date().toISOString(),
      sources: sources.length,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
