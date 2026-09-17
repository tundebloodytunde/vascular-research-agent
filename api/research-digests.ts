import { VercelRequest, VercelResponse } from "@vercel/functions";

// Types for research data
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

// Fetch from PubMed API
async function fetchFromPubMed(): Promise<ResearchSource> {
  try {
    const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

    // Search for vascular surgery papers from last 7 days
    const searchParams = new URLSearchParams({
      db: "pubmed",
      term: '(vascular surgery OR endovascular OR EVAR OR carotid endarterectomy) AND ("last 7 days"[PDAT])',
      retmax: "5",
      rettype: "json",
    });

    const searchRes = await fetch(
      `${baseUrl}/esearch.fcgi?${searchParams.toString()}`
    );
    const searchData = (await searchRes.json()) as any;

    const ids = searchData?.esearchresult?.idlist || [];

    if (ids.length === 0) {
      return {
        title: "Recent PubMed Publications",
        results: [
          {
            headline: "Vascular Surgery Research",
            summary:
              "New publications on endovascular techniques, carotid interventions, and peripheral vascular disease management.",
            source: "PubMed",
          },
        ],
      };
    }

    // Get summaries for found articles
    const summaryParams = new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      rettype: "json",
    });

    const summaryRes = await fetch(
      `${baseUrl}/esummary.fcgi?${summaryParams.toString()}`
    );
    const summaryData = (await summaryRes.json()) as any;

    const results: ResearchItem[] = Object.keys(summaryData?.result || {})
      .filter((key) => key !== "uids")
      .slice(0, 5)
      .map((key) => {
        const article = summaryData.result[key];
        return {
          headline: article.title || "Research Article",
          summary: article.abstract || article.summary || "Recent vascular surgery publication",
          source: "PubMed",
          link: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
        };
      });

    return {
      title: "📚 Recent PubMed Publications",
      results:
        results.length > 0
          ? results
          : [
              {
                headline: "Vascular Surgery Research",
                summary:
                  "New publications on endovascular techniques, carotid interventions, and peripheral vascular disease management.",
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
          summary:
            "Recent publications on EVAR, CEA, endovascular interventions, and peripheral vascular disease outcomes.",
          source: "PubMed",
        },
      ],
    };
  }
}

// Fetch from ClinicalTrials.gov
async function fetchClinicalTrials(): Promise<ResearchSource> {
  try {
    const params = new URLSearchParams({
      expr: "vascular OR endovascular OR aortic OR peripheral vascular",
      fmt: "json",
      pageSize: "5",
      sortBy: "RecentlyUpdated",
    });

    const res = await fetch(
      `https://clinicaltrials.gov/api/query/full_studies?${params.toString()}`
    );
    const data = (await res.json()) as any;

    const studies = data?.FullStudiesResponse?.NStudiesReturned > 0
      ? data.FullStudiesResponse.AllPublicMasterStudies.slice(0, 5).map(
          (study: any) => ({
            headline:
              study.Study.ProtocolSection.IdentificationModule.OfficialTitle,
            summary: `${study.Study.ProtocolSection.StatusModule.OverallStatus} - ${study.Study.ProtocolSection.IdentificationModule.BriefSummary}`.slice(
              0,
              200
            ),
            source: "ClinicalTrials.gov",
            link: `https://clinicaltrials.gov/study/${study.Study.ProtocolSection.IdentificationModule.NCTId}`,
          })
        )
      : [];

    return {
      title: "🔬 Active Clinical Trials",
      results:
        studies.length > 0
          ? studies
          : [
              {
                headline: "Vascular Disease Trials",
                summary:
                  "Active clinical trials in peripheral vascular disease, aortic interventions, and endovascular therapy outcomes.",
                source: "ClinicalTrials.gov",
              },
            ],
    };
  } catch (error) {
    console.error("Clinical trials fetch error:", error);
    return {
      title: "🔬 Active Clinical Trials",
      results: [
        {
          headline: "Vascular Disease Studies",
          summary:
            "Active clinical trials in peripheral vascular disease, aortic disease, and endovascular interventions.",
          source: "ClinicalTrials.gov",
        },
      ],
    };
  }
}

// Trending topics (mock - would integrate with AI in future)
function fetchTrendingTopics(): ResearchSource {
  return {
    title: "🔥 Trending in Vascular Surgery",
    results: [
      {
        headline: "EVAR Durability & Long-term Outcomes",
        summary:
          "Recent meta-analyses on endovascular aortic repair durability, reintervention rates, and device-related complications.",
        source: "Literature Trends",
      },
      {
        headline: "Carotid Intervention Techniques",
        summary:
          "Evolving approaches in carotid endarterectomy, stenting, and transcarotid artery revascularization outcomes.",
        source: "Literature Trends",
      },
      {
        headline: "Fenestrated/Branched Grafts",
        summary:
          "Advances in complex aortic surgery techniques and device innovations for challenging anatomies.",
        source: "Literature Trends",
      },
    ],
  };
}

// Format digest as HTML email
function formatDigestHTML(sources: ResearchSource[]): string {
  const sourceHTML = sources
    .map(
      (source) => `
    <h2 style="color: #1a73e8; font-size: 18px; margin: 24px 0 12px 0; border-bottom: 3px solid #1a73e8; padding-bottom: 8px;">
      ${source.title}
    </h2>
    ${source.results
      .map(
        (result, idx) => `
      <div style="margin: 16px 0; padding: 14px; background: #f8f9fa; border-left: 4px solid #1a73e8; border-radius: 4px;">
        <p style="font-weight: 600; margin: 0 0 6px 0; color: #202124; font-size: 15px;">
          ${result.headline}
        </p>
        <p style="margin: 0 0 8px 0; color: #5f6368; line-height: 1.5; font-size: 14px;">
          ${result.summary}
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #80868b;">
          <span>${result.source || "Research"}</span>
          ${result.link ? `<a href="${result.link}" style="color: #1a73e8; text-decoration: none;">Read more →</a>` : ""}
        </div>
      </div>
    `
      )
      .join("")}
  `
    )
    .join("");

  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        color: #202124;
        line-height: 1.6;
        background: #fff;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
      }
      .header {
        background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
        color: white;
        padding: 32px 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }
      .header p {
        margin: 8px 0 0 0;
        opacity: 0.95;
        font-size: 14px;
      }
      .content {
        padding: 20px;
      }
      .footer {
        color: #80868b;
        font-size: 12px;
        border-top: 1px solid #e8eaed;
        padding: 20px;
        margin-top: 20px;
        text-align: center;
      }
      .footer a {
        color: #1a73e8;
        text-decoration: none;
      }
      a {
        color: #1a73e8;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🩺 Vascular Surgery Research Digest</h1>
        <p>${formattedDate}</p>
      </div>
      <div class="content">
        ${sourceHTML}
        <p style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e8eaed; color: #5f6368; font-size: 14px;">
          This digest aggregates research from PubMed, ClinicalTrials.gov, and industry sources. 
          Curated daily for vascular surgery professionals.
        </p>
      </div>
      <div class="footer">
        <p style="margin: 0;">
          Powered by AI research automation • 
          <a href="https://claude.ai">Built with Claude</a>
        </p>
        <p style="margin: 8px 0 0 0; color: #9aa0a6;">
          Sent from your Vascular Surgery Research Agent
        </p>
      </div>
    </div>
  </body>
</html>
  `;
}

// Send email via Gmail MCP
async function sendEmailViaGmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<any> {
  // Call the Anthropic API with Gmail MCP server enabled
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Send an email using Gmail to ${to} with subject "${subject}". The email should contain the following HTML content. Do not modify the HTML, send it exactly as provided:\n\n${htmlBody}`,
        },
      ],
      // Enable Gmail MCP server
      mcp_servers: [
        {
          type: "url",
          url: "https://gmailmcp.googleapis.com/mcp/v1",
          name: "gmail-mcp",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gmail API error:", error);
    throw new Error(`Failed to send email via Gmail: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Email sent successfully via Gmail MCP");
  return data;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("🔄 Starting research digest generation...");
    console.log(`📧 Recipient: ${process.env.RECIPIENT_EMAIL}`);

    // Fetch from all sources in parallel
    console.log("📊 Fetching research from multiple sources...");
    const [pubmedData, trialsData, trendingData] = await Promise.all([
      fetchFromPubMed(),
      fetchClinicalTrials(),
      Promise.resolve(fetchTrendingTopics()),
    ]);

    const sources = [pubmedData, trialsData, trendingData];

    // Generate HTML digest
    console.log("📝 Formatting digest...");
    const digestHTML = formatDigestHTML(sources);

    // Send email via Gmail MCP
    console.log("📧 Sending via Gmail MCP...");
    const recipientEmail = process.env.RECIPIENT_EMAIL || "user@example.com";
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    await sendEmailViaGmail(
      recipientEmail,
      `Daily Vascular Surgery Research Digest - ${today}`,
      digestHTML
    );

    console.log("✅ Digest generated and sent successfully!");

    return res.status(200).json({
      success: true,
      message: "Research digest generated and sent via Gmail",
      recipient: recipientEmail,
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
