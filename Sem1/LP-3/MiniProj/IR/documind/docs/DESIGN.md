# DocuMind Design System & UI Architecture

## 1. Overview & Aesthetic Direction

DocuMind is an AI-powered PDF workspace designed with a sleek, dark-first, focused aesthetic.
It eliminates clutter and prioritizes readability, rapid document comprehension, and grounded conversational Q&A.

Key aesthetic principles:
- **Focused Workspace:** Clean division between document management and the active workspace (summaries + chat).
- **Subtle Modern Accents:** Deep neutral surfaces (`zinc-950` / `background`) with restrained violet accents (`violet-400`/`violet-500`) for focal points, active states, and AI generation cues.
- **Accessible & Consistent:** Pure semantic design tokens mapped through Tailwind CSS v4 and shadcn/ui configured on **Base UI** primitives.

---

## 2. Design Tokens & Color Palette

All styling utilizes semantic CSS variables declared in `app/globals.css`:

| Token | Dark Mode Value | Usage |
|---|---|---|
| `--background` | `oklch(0.145 0 0)` | Root application surface |
| `--foreground` | `oklch(0.985 0 0)` | Primary body and heading text |
| `--card` | `oklch(0.165 0 0)` | Elevated containers, document cards |
| `--card-foreground` | `oklch(0.985 0 0)` | Text inside cards |
| `--popover` | `oklch(0.165 0 0)` | Floating menus, tooltips, dialogs |
| `--primary` | `oklch(0.985 0 0)` | High-contrast actions |
| `--muted` | `oklch(0.24 0 0)` | Subdued backgrounds |
| `--muted-foreground` | `oklch(0.708 0 0)` | Supporting metadata, timestamps, secondary labels |
| `--accent` | `oklch(0.24 0 0)` | Hover and active background highlights |
| `--border` | `oklch(0.269 0 0)` | Structural dividing lines and borders |
| `--sidebar` | `oklch(0.13 0 0)` | Collapsible navigation sidebar |
| `--sidebar-primary` | `oklch(0.65 0.22 290)` | Accent brand container |

---

## 3. Typography

- **Primary Sans:** Geist Sans (`--font-geist-sans`), clean geometric sans-serif optimized for interfaces and legibility.
- **Monospace:** Geist Mono (`--font-geist-mono`), used for code snippets, citations, and metadata.
- **Type Scale:**
  - Page Titles: `text-2xl font-semibold tracking-tight`
  - Section Headers: `text-lg font-semibold tracking-tight`
  - Body Text: `text-sm leading-relaxed text-foreground`
  - Metadata / Captions: `text-xs text-muted-foreground`
  - Badges / Micro-labels: `text-[11px] font-medium tracking-wide uppercase`

---

## 4. Component Primitives & Base UI Integration

DocuMind uses shadcn/ui built on **Base UI** (`@base-ui/react`):
- **Sidebar:** `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarTrigger`
- **Buttons:** Base UI `ButtonPrimitive` with CVA variants (`default`, `outline`, `ghost`, `secondary`, `destructive`)
- **Containers:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Form Controls:** `Textarea`, `Input` with explicit focus rings (`focus-visible:ring-2 focus-visible:ring-ring`)
- **Scroll Areas:** Base UI `ScrollAreaPrimitive` for smooth scrolling in long chat histories and summaries.

---

## 5. Layout Architecture

The application layout follows a three-tier hierarchy:

1. **Root Layout (`app/layout.tsx`):**
   - Injects Geist fonts, global CSS variables, dark theme default, and `TooltipProvider`.
2. **Dashboard Shell (`app/dashboard/components/dashboard-shell.tsx`):**
   - Collapsible desktop & mobile sidebar navigation.
   - Top header with mobile trigger, breadcrumbs, and user session badge with sign-out.
3. **Workspace Views (`app/dashboard/components/dashboard-views.tsx`):**
   - **Upload View:** Drag-and-drop PDF dropzone with file size/type validation and extraction status feedback.
   - **Library & Document View:** Grid of user documents, signed URL PDF preview, length-selectable AI summarizer (`short`, `medium`, `detailed`), and multi-turn document chat.

---

## 6. Motion & Micro-interactions

Motion is subtle, functional, and uses `framer-motion` / `motion`:
- **State transitions:** Subtle fade/slide in on message stream chunks and document selection.
- **Interactive feedback:** Smooth hover backgrounds (`transition-colors duration-150`) and button press feedback (`active:scale-[0.98]`).
