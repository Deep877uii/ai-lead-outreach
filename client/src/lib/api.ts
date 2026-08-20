// Signal Desk style reminder: keep integration logic quiet, centralized, and separate from editorial UI concerns.

export type Lead = {
  leadId: string;
  name: string;
  company: string;
  role: string;
  email: string | null;
  linkedinUrl: string;
  postUrl: string;
  postContent: string;
  postedAt: string;
  location: string;
  companyWebsite: string;
  jobTitle: string;
  source: string;
};

export type GeneratedEmail = {
  success: boolean;
  leadId: string;
  recipient: string | null;
  subject: string;
  body: string;
};

export type SendEmailRequest = {
  leadId: string;
  recipient: string;
  subject: string;
  body: string;
};

export type ScraperConfig = {
  searchQuery?: string;
  location?: string;
  datePosted?: string;
  maxPosts?: number;
};

const BASE_URL = (import.meta.env.VITE_N8N_BASE_URL || "https://deepashu.app.n8n.cloud/webhook").replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_N8N_API_KEY || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-KEY": API_KEY } : {}),
      ...(options.headers || {}),
    },
  });

  let payload: T & { error?: string; message?: string };
  try {
    payload = (await response.json()) as T & { error?: string; message?: string };
  } catch {
    throw new Error("Unable to connect to the outreach service.");
  }

  if (!response.ok || ("success" in payload && payload.success === false)) {
    throw new Error(payload.error || payload.message || "The outreach service returned an error.");
  }

  return payload;
}

export async function getLeads(): Promise<Lead[]> {
  const payload = await request<{ success: boolean; data: Lead[] }>("/leads");
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function runScraper(config: ScraperConfig) {
  return request<{ success: boolean; message?: string; leadsProcessed?: number }>("/run-scraper", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function generateEmail(lead: Lead) {
  return request<GeneratedEmail>("/generate-email", {
    method: "POST",
    body: JSON.stringify(lead),
  });
}

export async function sendEmail(data: SendEmailRequest) {
  return request<{ success: boolean; message?: string; recipient?: string }>("/send-email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
