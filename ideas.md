# AI Lead Outreach — Design Direction

## Three stylistic approaches

### Theme Name: Signal Desk
Very brief intro: A warm editorial command center that turns noisy lead discovery into a calm, legible workflow. Ink, parchment, and sharp chartreuse cues make the human review step feel deliberate rather than clinical.
Probability: 0.06

### Theme Name: Quiet Graphite
Very brief intro: A restrained monochrome operations console with cool graphite surfaces and precise blue status accents. The mood is focused, technical, and quietly confident.
Probability: 0.03

### Theme Name: Field Notes
Very brief intro: A tactile notebook-inspired interface with soft paper tones, hand-drawn markers, and lightweight annotations. It makes outreach feel personal and considered without becoming playful.
Probability: 0.08

## Selected approach: Signal Desk

### Design Movement
Contemporary editorial Swiss design translated into a B2B operations product: structured typography, asymmetric composition, measured contrast, and a tactile paper-like surface.

### Core Principles
1. **Make the workflow visible.** Every screen should clarify where the user is in Find → Review → Write → Confirm → Send.
2. **Warm the machine.** Use parchment surfaces, ink typography, and human-readable microcopy so AI feels like an assistant, not an opaque automation layer.
3. **Use contrast as navigation.** Reserve chartreuse for actions and positive state; use clay for attention and navy for structure.
4. **Prefer editorial rhythm over boxed sameness.** Let sections breathe, use strong alignment rails, and avoid a field of identical rounded cards.

### Color Philosophy
The base is warm ivory rather than sterile white, giving the dashboard the feeling of a well-used desk. Deep ink navy anchors hierarchy and makes dense tables readable. Chartreuse is the ownable action color: alert, optimistic, and easy to spot without looking like a generic SaaS blue. Muted clay marks human attention and review moments; pale sage supports successful contacted states.

### Layout Paradigm
A persistent left rail establishes the product vocabulary while the main workspace uses a broad editorial column with a narrow utility rail for context. The lead table is a long horizontal reading surface; drawers and composers slide in from the right so the user retains the underlying lead context.

### Signature Elements
- A small compass-arrow mark used as the brand anchor and workflow motif.
- Thin ink rules and offset section labels that feel like editorial marginalia.
- Chartreuse “signal” markers for active, actionable, and completed states.

### Interaction Philosophy
Actions should feel intentional and reversible. Primary actions are visually unmistakable; destructive or externally consequential actions require a second explicit confirmation. Hover and focus states reveal context with a quick underline or subtle lift, while loading states narrate what the n8n workflow is doing.

### Animation
Use 160–220ms ease-out transitions for buttons, filters, and row emphasis. Drawers enter from the right with opacity and translate only; dialogs begin at 95% scale rather than 0%. Lead rows stagger by 30ms on first load. Never animate the table layout itself. Honor `prefers-reduced-motion` by removing entrance and decorative motion.

### Typography System
Use **DM Sans** for UI copy and tables because it stays crisp at small sizes. Pair it with **Space Grotesk** for page titles, section labels, and metric numbers to give the product a distinct instrument-panel voice. Headings use compact, slightly tight tracking; body copy stays at comfortable 1.5 line height.

### Brand Essence
AI Lead Outreach is a human-in-the-loop workspace for thoughtful outbound teams who want faster research without surrendering editorial control. **Precise. Warm. Decisive.**

### Brand Voice
Headlines are direct and active. CTAs name the next meaningful action, not a vague promise. Microcopy explains what is happening and what the user can do next.

Example lines:
- “Find the people already telling you what they need.”
- “Review the signal. Then make it yours.”

### Wordmark & Logo
Use the generated compass-arrow symbol beside a compact two-line wordmark: “AI Lead” above “Outreach,” set in Space Grotesk with a custom oversized “O” counter. The symbol should remain recognizable without the wordmark at favicon size.

### Signature Brand Color
**Signal Chartreuse — `#D5F26A`**. It is bright enough to guide action, unusual enough to be ownable, and warm enough to belong on parchment rather than a neon interface.

## Style Decisions
- Keep the interface light and editorial; do not introduce dark neon/cyberpunk surfaces.
- Use generated abstract assets sparingly for empty states and context panels, never as decoration behind dense table text.
- Keep destructive/external actions visually distinct from neutral navigation.
