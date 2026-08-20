// Signal Desk style reminder: editorial hierarchy, visible workflow state, warm surfaces, and chartreuse only for clear action.

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight, Check, ChevronDown, Clock3, Compass, Copy, ExternalLink, FileText,
  Filter, Inbox, Layers3, Loader2, Mail, Menu, PanelLeft, RefreshCw, Search,
  Send, Sparkles, Users, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lead, GeneratedEmail, getLeads, startScraper, generateEmail, sendEmail } from "@/lib/api";

type Page = "leads" | "outreach" | "sent";
type SentRecord = { id: string; lead: Lead; recipient: string; subject: string; sentAt: string };

const demoLeads: Lead[] = [];
const defaultScraper = { searchQuery: "Python backend engineer", location: "India", datePosted: "past 24 hours", maxPosts: 20 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "NL"; }
function formatDate(date: string) { if (!date) return "—"; return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)); }
function relativeTime(date: string) { const diff = Math.max(0, Date.now() - new Date(date).getTime()); const mins = Math.floor(diff / 60000); return mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`; }

function AppMark({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "mark mark-compact" : "brand-lockup"}>
    <div className="brand-mark"><Compass size={compact ? 18 : 22} strokeWidth={2.4} /></div>
    {!compact && <div><div className="brand-kicker">AI</div><div className="brand-name"><span>Lead</span> <em>Outreach</em></div></div>}
  </div>;
}

function StatCard({ label, value, caption, icon: Icon, accent }: { label: string; value: number; caption: string; icon: typeof Users; accent?: boolean }) {
  return <div className={`stat-card ${accent ? "stat-accent" : ""}`}><div className="stat-top"><span>{label}</span><Icon size={17} /></div><div className="stat-value">{value}</div><div className="stat-caption">{caption}</div></div>;
}

function EmptyState({ title, description, onAction, actionLabel = "Find New Leads" }: { title: string; description: string; onAction?: () => void; actionLabel?: string }) {
  return <div className="empty-state"><div className="empty-art"><img src="/manus-storage/ai-lead-outreach-abstract-1_3bba8dd3.png" alt="" /></div><div className="empty-copy"><span className="eyebrow">No signal yet</span><h3>{title}</h3><p>{description}</p>{onAction && <Button className="button-primary" onClick={onAction}><Zap size={16} />{actionLabel}</Button>}</div></div>;
}

export default function Home({ initialPage = "leads" }: { initialPage?: Page }) {
  const [page, setPage] = useState<Page>(initialPage);
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [contactedIds, setContactedIds] = useState<string[]>([]);
  const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
  const [generated, setGenerated] = useState<Record<string, GeneratedEmail>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [composerLead, setComposerLead] = useState<Lead | null>(null);
  const [draft, setDraft] = useState<GeneratedEmail | null>(null);
  const [composerError, setComposerError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scraperOpen, setScraperOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [scraperConfig, setScraperConfig] = useState(defaultScraper);
  const [scraping, setScraping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => { setLoadingLeads(true); setLoadError(""); try { setLeads(await getLeads()); } catch (error) { setLoadError(error instanceof Error ? error.message : "Unable to connect to the outreach service."); } finally { setLoadingLeads(false); } };
  useEffect(() => { void load(); }, []);

  const locations = useMemo(() => Array.from(new Set(leads.map((lead) => lead.location).filter(Boolean))).sort(), [leads]);
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const haystack = [lead.name, lead.company, lead.role, lead.jobTitle, lead.email, lead.location, lead.postContent].join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesEmail = emailFilter === "all" || (emailFilter === "has" ? Boolean(lead.email) : !lead.email);
    const matchesLocation = locationFilter === "all" || lead.location === locationFilter;
    return matchesQuery && matchesEmail && matchesLocation;
  }).sort((a, b) => sort === "oldest" ? new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime() : sort === "name" ? a.name.localeCompare(b.name) : sort === "company" ? a.company.localeCompare(b.company) : new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()), [leads, query, emailFilter, locationFilter, sort]);

  const beginScrape = async () => { setScraping(true); setScraperOpen(false); try { const result = await startScraper(scraperConfig); if (result.success) { toast.success(`${result.leadsProcessed || 0} leads processed`); await load(); } } catch (error) { toast.error(error instanceof Error ? error.message : "The scraping workflow is taking longer than expected. Please check the leads again shortly."); } finally { setScraping(false); } };
  const openGenerate = async (lead: Lead) => { if (generating) return; setComposerLead(lead); setComposerError(""); setGenerating(true); try { const result = await generateEmail(lead); if (!result.success) throw new Error("The email could not be generated. Please try again."); setDraft(result); setGenerated((current) => ({ ...current, [lead.leadId]: result })); } catch (error) { setComposerLead(null); toast.error(error instanceof Error ? error.message : "The email could not be generated."); } finally { setGenerating(false); } };
  const validateDraft = () => { if (!draft?.leadId || !draft.recipient || !emailPattern.test(draft.recipient) || !draft.subject.trim() || !draft.body.trim()) { setComposerError(!draft?.recipient ? "No email address was found for this lead. Enter a valid recipient before sending." : "Check the recipient, subject, and message before sending."); return false; } setComposerError(""); return true; };
  const confirmSend = () => { if (validateDraft()) setConfirmOpen(true); };
  const send = async () => { if (!draft || !composerLead || !validateDraft()) return; setSending(true); try { const result = await sendEmail({ leadId: draft.leadId, recipient: draft.recipient || "", subject: draft.subject, body: draft.body }); if (!result.success) throw new Error("Failed to send email. Please try again later."); setContactedIds((current) => Array.from(new Set([...current, composerLead.leadId]))); setSentRecords((current) => [{ id: crypto.randomUUID(), lead: composerLead, recipient: draft.recipient || "", subject: draft.subject, sentAt: new Date().toISOString() }, ...current]); toast.success("Email sent successfully", { description: `To ${draft.recipient}` }); setConfirmOpen(false); setComposerLead(null); setDraft(null); } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to send email. Please try again later."); } finally { setSending(false); } };

  const showDetails = (lead: Lead) => { setSelectedLead(lead); setDetailOpen(true); };
  const showComposer = composerLead && (draft || generating);
  const navItems: { id: Page; label: string; icon: typeof Users; count?: number }[] = [{ id: "leads", label: "Leads", icon: Users, count: leads.length }, { id: "outreach", label: "Outreach", icon: Sparkles, count: Object.keys(generated).length }, { id: "sent", label: "Sent", icon: Send, count: sentRecords.length }];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-head"><AppMark /><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="main-nav">{navItems.map(({ id, label, icon: Icon, count }) => <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => { setPage(id); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{count ? <span className="nav-count">{count}</span> : null}</button>)}</nav>
      <div className="sidebar-illustration"><img src="/manus-storage/ai-lead-outreach-abstract-2_50b23345.png" alt="" /><div><span className="eyebrow">Human in the loop</span><p>Review every message before it leaves your desk.</p></div></div>
      <div className="sidebar-footer"><div className="avatar">DM</div><div><strong>Deepesh</strong><span>Outreach workspace</span></div><ChevronDown size={15} /></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{page === "leads" ? "Leads" : page === "outreach" ? "Outreach" : "Sent"}</strong></div><div className="top-actions"><button className="icon-button" onClick={() => void load()} disabled={loadingLeads} aria-label="Refresh leads"><RefreshCw size={17} className={loadingLeads ? "spin" : ""} /></button><Button className="button-primary top-cta" onClick={() => setScraperOpen(true)} disabled={scraping}><Zap size={16} />{scraping ? "Finding leads..." : "Find New Leads"}</Button></div></header>
      <div className="workspace">
        {page === "leads" && <>
          <section className="page-intro"><div><span className="eyebrow">Lead dashboard</span><h1>Find the right signal.</h1><p>Discover and contact relevant leads with AI-powered outreach.</p></div><div className="workflow-strip"><span className="workflow-active">01 Find</span><span>02 Review</span><span>03 Write</span><span>04 Send</span></div></section>
          <section className="stats-grid"><StatCard label="Total leads" value={leads.length} caption="Loaded from your latest search" icon={Users} /><StatCard label="With email" value={leads.filter((lead) => Boolean(lead.email)).length} caption="Ready for outreach" icon={Mail} /><StatCard label="Emails generated" value={Object.keys(generated).length} caption="Drafts in this session" icon={Sparkles} accent /><StatCard label="Emails sent" value={sentRecords.length} caption="Successfully delivered" icon={Send} /></section>
          {loadError && <div className="alert error-alert"><X size={17} /><div><strong>Unable to connect to the outreach service.</strong><span>{loadError}</span></div><Button variant="outline" onClick={() => void load()}>Retry</Button></div>}
          <section className="lead-workspace"><div className="section-heading"><div><span className="eyebrow">Prospect library</span><h2>Leads to review <span>{filteredLeads.length}</span></h2></div><div className="table-meta"><span className="live-dot" /> Live workspace</div></div><div className="control-bar"><div className="search-wrap"><Search size={17} /><Input placeholder="Search leads..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-control"><Filter size={15} /><select value={emailFilter} onChange={(event) => setEmailFilter(event.target.value)}><option value="all">All emails</option><option value="has">Has email</option><option value="none">No email</option></select></div><div className="filter-control"><select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}><option value="all">All locations</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select></div><div className="filter-control sort-control"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name A-Z</option><option value="company">Company A-Z</option></select><ChevronDown size={14} /></div></div>
            {loadingLeads ? <div className="skeleton-table">{[1, 2, 3, 4].map((item) => <div className="skeleton-row" key={item}><span /><span /><span /><span /><span /></div>)}</div> : filteredLeads.length ? <><div className="lead-table-wrap"><table className="lead-table"><thead><tr><th>Lead</th><th>Company</th><th>Role</th><th>Location</th><th>Email</th><th>Source</th><th>Posted</th><th /></tr></thead><tbody>{filteredLeads.map((lead) => <tr key={lead.leadId}><td><button className="lead-cell" onClick={() => showDetails(lead)}><span className="lead-avatar">{initials(lead.name)}</span><span><strong>{lead.name || "Unnamed lead"}</strong><small>{lead.jobTitle || lead.role || "—"}</small></span></button></td><td><span className="company-cell">{lead.company || "—"}</span></td><td>{lead.role || "—"}</td><td>{lead.location || "—"}</td><td>{lead.email ? <a className="email-link" href={`mailto:${lead.email}`}>{lead.email}</a> : <span className="muted">No email</span>}</td><td><Badge className="source-badge">{lead.source || "LinkedIn"}</Badge></td><td>{formatDate(lead.postedAt)}</td><td><div className="row-actions"><button className="text-button" onClick={() => showDetails(lead)}>View</button><button className="row-generate" onClick={() => void openGenerate(lead)} disabled={generating || contactedIds.includes(lead.leadId)}>{contactedIds.includes(lead.leadId) ? <><Check size={13} /> Contacted</> : <><Sparkles size={13} /> Generate</>}</button></div></td></tr>)}</tbody></table></div><div className="mobile-leads">{filteredLeads.map((lead) => <div className="mobile-lead-card" key={lead.leadId}><div className="mobile-card-head"><span className="lead-avatar">{initials(lead.name)}</span><div><strong>{lead.name || "Unnamed lead"}</strong><span>{lead.role || "—"} · {lead.company || "—"}</span></div>{contactedIds.includes(lead.leadId) && <Badge className="contacted-badge"><Check size={12} /> Contacted</Badge>}</div><div className="mobile-card-line"><span>⌖ {lead.location || "Location unavailable"}</span>{lead.email && <a href={`mailto:${lead.email}`}>✉ {lead.email}</a>}</div><p>{lead.jobTitle || lead.postContent || "No role context provided."}</p><div className="mobile-card-actions"><Button variant="outline" onClick={() => showDetails(lead)}>View Details</Button><Button className="button-primary" onClick={() => void openGenerate(lead)} disabled={generating || contactedIds.includes(lead.leadId)}><Sparkles size={15} /> Generate Mail</Button></div></div>)}</div></> : <EmptyState title={query || emailFilter !== "all" || locationFilter !== "all" ? "No matching leads" : "No leads found"} description={query || emailFilter !== "all" || locationFilter !== "all" ? "Try a different search or filter." : "Run the lead discovery workflow to find new prospects."} onAction={() => setScraperOpen(true)} />}
          </section>
        </>}
        {page === "outreach" && <section className="subpage"><div className="page-intro"><div><span className="eyebrow">Review queue</span><h1>Make it yours.</h1><p>Generated emails and leads awaiting your editorial pass.</p></div></div><div className="outreach-grid">{Object.keys(generated).length ? Object.entries(generated).map(([leadId, email]) => { const lead = leads.find((item) => item.leadId === leadId); return <div className="outreach-card" key={leadId}><div className="card-label"><Sparkles size={15} /> AI draft <span>{lead?.company}</span></div><h3>{email.subject || "Untitled subject"}</h3><p>{email.body}</p><div className="outreach-footer"><span>{email.recipient || "Recipient needed"}</span><Button variant="outline" onClick={() => { if (lead) { setComposerLead(lead); setDraft(email); } }}>Review draft <ArrowUpRight size={14} /></Button></div></div>; }) : <EmptyState title="No drafts yet" description="Generate a personalized email from any lead to start your review queue." onAction={() => setPage("leads")} actionLabel="Browse leads" />}</div></section>}
        {page === "sent" && <section className="subpage"><div className="page-intro"><div><span className="eyebrow">Session history</span><h1>Sent with intention.</h1><p>Successful outreach from this current application session.</p></div></div>{sentRecords.length ? <div className="sent-list">{sentRecords.map((record) => <div className="sent-row" key={record.id}><div className="sent-status"><Check size={16} /></div><div className="sent-main"><strong>{record.recipient}</strong><span>{record.lead.company} · {record.subject}</span></div><div className="sent-time"><Clock3 size={14} /> {relativeTime(record.sentAt)}</div><Badge className="sent-badge">Sent</Badge></div>)}</div> : <EmptyState title="No emails sent yet" description="Your successfully sent outreach will appear here." onAction={() => setPage("leads")} actionLabel="Find a lead" />}</section>}
      </div>
    </main>

    <Dialog open={scraperOpen} onOpenChange={setScraperOpen}><DialogContent className="scraper-dialog"><DialogHeader><span className="dialog-kicker"><Zap size={14} /> Lead discovery</span><DialogTitle>Find new leads</DialogTitle><DialogDescription>Set the search signal, then let the existing workflow do the heavy lifting.</DialogDescription></DialogHeader><div className="workflow-note"><div className="workflow-note-icon"><Clock3 size={18} /></div><div><strong>This may take a little while.</strong><span>We’ll keep the dashboard available while the AI lead discovery workflow runs.</span></div></div><div className="form-grid"><label>Search query<Input value={scraperConfig.searchQuery} onChange={(event) => setScraperConfig({ ...scraperConfig, searchQuery: event.target.value })} placeholder="Python backend engineer" /></label><label>Location<Input value={scraperConfig.location} onChange={(event) => setScraperConfig({ ...scraperConfig, location: event.target.value })} placeholder="India" /></label><label>Date posted<select value={scraperConfig.datePosted} onChange={(event) => setScraperConfig({ ...scraperConfig, datePosted: event.target.value })}><option>past 24 hours</option><option>past week</option><option>past month</option></select></label><label>Maximum posts<Input type="number" min="1" max="100" value={scraperConfig.maxPosts} onChange={(event) => setScraperConfig({ ...scraperConfig, maxPosts: Number(event.target.value) })} /></label></div><DialogFooter><Button variant="outline" onClick={() => setScraperOpen(false)}>Cancel</Button><Button className="button-primary" onClick={() => void beginScrape()} disabled={scraping}><Zap size={16} /> Start finding leads</Button></DialogFooter></DialogContent></Dialog>

    <Sheet open={detailOpen} onOpenChange={setDetailOpen}><SheetContent className="detail-sheet"><SheetHeader><span className="dialog-kicker">Lead profile</span><SheetTitle>{selectedLead?.name || "Lead details"}</SheetTitle></SheetHeader>{selectedLead && <div className="detail-content"><div className="detail-profile"><span className="detail-avatar">{initials(selectedLead.name)}</span><div><strong>{selectedLead.company || "Company unavailable"}</strong><span>{selectedLead.role || selectedLead.jobTitle || "Role unavailable"}</span></div></div><div className="detail-facts">{[["Job title", selectedLead.jobTitle], ["Email", selectedLead.email], ["Location", selectedLead.location], ["Source", selectedLead.source], ["Posted", formatDate(selectedLead.postedAt)]].filter(([, value]) => value).map(([label, value]) => <div className="detail-fact" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="detail-links">{selectedLead.linkedinUrl && <a href={selectedLead.linkedinUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> LinkedIn profile</a>}{selectedLead.companyWebsite && <a href={selectedLead.companyWebsite} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Company website</a>}{selectedLead.postUrl && <a href={selectedLead.postUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View original post</a>}</div><div className="post-block"><span className="eyebrow">Original post</span><p>{selectedLead.postContent || "No post content was provided."}</p></div><Button className="button-primary full-button" onClick={() => { setDetailOpen(false); void openGenerate(selectedLead); }} disabled={generating || contactedIds.includes(selectedLead.leadId)}><Sparkles size={16} /> Generate personalized mail</Button></div>}</SheetContent></Sheet>

    <Sheet open={Boolean(showComposer)} onOpenChange={(open) => { if (!open && !sending) { setComposerLead(null); setDraft(null); } }}><SheetContent className="composer-sheet"><SheetHeader><div className="composer-title-row"><div><span className="dialog-kicker"><Sparkles size={14} /> Human review</span><SheetTitle>AI generated outreach</SheetTitle></div>{composerLead && <span className="composer-context">For {composerLead.name}</span>}</div></SheetHeader>{generating ? <div className="generating-state"><div className="generating-orbit"><Sparkles size={25} /></div><h3>AI is writing your personalized email...</h3><p>Reading the lead’s role, company, and original post to find a relevant angle.</p><Loader2 className="spin" size={18} /></div> : draft && <div className="composer-content"><div className="editor-note"><FileText size={17} /><span>Edit every field before you send. Nothing leaves this workspace without your confirmation.</span></div><label>Recipient<Input value={draft.recipient || ""} onChange={(event) => setDraft({ ...draft, recipient: event.target.value })} placeholder="name@company.com" /></label>{!draft.recipient && <div className="inline-warning"><Mail size={15} /> No email address was found for this lead. Enter one manually.</div>}<label>Subject<Input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></label><label>Message<Textarea className="body-editor" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>{composerError && <div className="inline-error"><X size={15} /> {composerError}</div>}<div className="composer-actions"><Button variant="outline" onClick={() => void openGenerate(composerLead!)} disabled={generating || sending}><RefreshCw size={15} /> Regenerate</Button><div><Button variant="ghost" onClick={() => { setComposerLead(null); setDraft(null); }} disabled={sending}>Cancel</Button><Button className="button-primary" onClick={confirmSend} disabled={sending || !draft.recipient || !emailPattern.test(draft.recipient)}><Send size={15} /> Send mail</Button></div></div></div>}</SheetContent></Sheet>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent className="confirm-dialog"><DialogHeader><span className="dialog-kicker"><Send size={14} /> Final check</span><DialogTitle>Send this email?</DialogTitle><DialogDescription>You’re about to send this edited message through Gmail. Confirm only when it looks right.</DialogDescription></DialogHeader>{draft && <div className="confirmation-preview"><div><span>To</span><strong>{draft.recipient}</strong></div><div><span>Subject</span><strong>{draft.subject}</strong></div><div><span>Message preview</span><p>{draft.body}</p></div></div>}<DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</Button><Button className="button-primary" onClick={() => void send()} disabled={sending}>{sending ? <><Loader2 size={15} className="spin" /> Sending email...</> : <><Send size={15} /> Send email</>}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
