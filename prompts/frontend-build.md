Build a **production-quality AI Bug Commander dashboard** for an AI Software Engineer agent.

This is an **internal developer tool/dashboard**, NOT a landing page.

Do NOT create:

- Landing page
- Login/signup
- Authentication screens
- About page
- Marketing sections
- Pricing
- Testimonials
- Hero marketing content

The user should enter the application **directly into the working dashboard**.

## 1. Product Concept

AI Bug Commander is an AI agent that helps engineering teams discover, analyze, prioritize, and manage GitHub bugs.

Core workflow:

**User Prompt → Agent Reasoning → GitHub → Analyze Bugs → Agent Decision → Jira → Slack → Final Result**

The application should make this workflow visually obvious and impressive during a live demo.

The agent should not simply execute fixed API calls. The UI should communicate that the agent is dynamically deciding which tools/actions are required.

---

# 2. Technology

Build the frontend using:

- React
- Vite
- TypeScript
- Modern component architecture
- Reusable components
- Responsive design
- Clean state management
- Component-driven UI
- API-ready architecture

Keep the frontend ready to connect to a FastAPI backend later.

Do NOT put fake business logic throughout components.

Create clean service/API abstraction layers so backend APIs can be connected easily.

---

# 3. Overall Layout

Create a professional SaaS-style dashboard.

Desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Header                                                   │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│   Sidebar    │              Main Workspace                   │
│              │                                               │
│              │                                               │
│              │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

## Sidebar

Create a left sidebar that contains the application's main modules.

Sidebar must support:

- Expanded state
- Collapsed state
- Smooth collapse/expand animation
- Tooltips when collapsed
- Active navigation state
- Icons + labels when expanded
- Icons only when collapsed
- Persistent state during the session

Sidebar navigation:

- 🧠 Command Center
- 🐛 Bug Analysis
- ⚡ Agent Workflow
- 🔗 Integrations
- 📋 Jira Tasks
- 💬 Slack Activity
- 📜 Execution History
- ⚙️ Settings

Keep navigation visually consistent.

Do not create unnecessary pages just to fill the sidebar. Pages should be functional dashboard views or clearly structured placeholders for backend integration.

---

# 4. Visual Design

Use a **professional modern developer-tool aesthetic**.

Think:

- Linear
- Vercel
- GitHub
- Raycast
- modern AI developer tools

But do NOT copy any existing product.

Use a restrained professional color palette.

Recommended direction:

- Neutral/slate background
- White or slightly tinted surfaces
- Dark text
- Muted secondary text
- One strong primary accent color
- Subtle success/warning/error colors
- Minimal gradients
- No excessive neon
- No random colorful cards

The UI should feel like a serious engineering product.

## Typography

Use a professional modern font such as:

- Inter
- Geist
- IBM Plex Sans

Use a clear hierarchy:

- Page title: 24–28px
- Section heading: 16–20px
- Body: 14–15px
- Secondary text: 12–13px
- Buttons: 13–14px

Use appropriate font weights:

- 600–700 for headings
- 500–600 for labels/buttons
- 400 for body text

Avoid oversized typography.

---

# 5. Design System

Create reusable design primitives.

Every button throughout the application must use the same button system.

Create reusable:

- Button
- IconButton
- Input
- Select
- SearchInput
- Badge
- StatusBadge
- Card
- Modal
- Drawer
- Tooltip
- Dropdown
- Tabs
- Table
- EmptyState
- LoadingState
- ErrorState
- Toast
- ProgressIndicator
- Timeline
- Avatar
- SkeletonLoader

Do NOT create one-off button styles.

Buttons must have consistent:

- Height
- Border radius
- Font
- Font weight
- Padding
- Hover
- Focus
- Disabled
- Loading
- Active states

Maintain consistent spacing throughout the entire application.

Use a coherent spacing system such as 4px/8px increments.

---

# 6. Command Center — Main Screen

The Command Center is the most important screen.

It should immediately communicate:

> "Tell the AI what you want it to do."

Top section:

### Repository Selector

Add a prominent GitHub repository selector.

Example:

```text
Repository

[ 🐙 my-company/backend-api              ▼ ]
```

The selector should support:

- Search repositories
- Repository name
- Owner/organization
- Repository icon
- Selected state
- Loading state
- Empty state
- Error state

The selected repository becomes the context for the agent.

Do NOT automatically hide repository selection.

---

# 7. Chat / Prompt Interface

Create a polished AI command interface.

Example:

```text
┌─────────────────────────────────────────────────────┐
│ Tell AI Bug Commander what to do...                 │
│                                                     │
│ Analyze unresolved bugs and handle critical ones.   │
│                                                     │
│                                    [Run Agent →]     │
└─────────────────────────────────────────────────────┘
```

Features:

- Multi-line input
- Submit button
- Keyboard shortcut
- Loading state
- Disabled state
- Character-friendly layout
- Clear button
- Prompt history during current session

Include example prompts below the input.

Examples:

- "Find the most critical unresolved bugs."
- "Analyze open bugs and create Jira tasks for critical issues."
- "Find high-priority bugs and notify the team on Slack."
- "Review unresolved bugs and recommend what needs immediate attention."

Clicking an example prompt should populate the input.

---

# 8. Live Agent Workflow

After clicking "Run Agent", transition into a live workflow view.

Make this the visual centerpiece of the demo.

Display:

```text
Understand Request
       ↓
Fetch GitHub Issues
       ↓
Analyze Bugs
       ↓
Prioritize
       ↓
Decide Actions
       ↓
Create Jira Tasks
       ↓
Notify Slack
       ↓
Verify Results
       ↓
Completed
```

Each step should have states:

- Pending
- Running
- Completed
- Failed
- Skipped

Use subtle animations.

Example:

```text
✓ Understand Request
✓ Fetch GitHub Issues
◉ Analyze Bugs...
○ Decide Actions
○ Create Jira Tasks
○ Notify Slack
```

The current step should be visually highlighted.

Do not over-animate the interface.

---

# 9. Agent Status

Display a compact agent status card.

Example:

```text
● Agent Running

Analyzing 17 GitHub issues...

Current action:
Determining bug severity and impact
```

When finished:

```text
✓ Agent Completed

3 critical bugs identified
3 Jira tasks created
3 Slack notifications sent
```

---

# 10. Tool / API Activity

Create a real-time activity panel showing which tools the agent is using.

Example:

```text
Agent Activity

✓ GitHub
  Fetched 17 unresolved issues
  2.4s

✓ AI Analysis
  Analyzed 17 issues
  4.8s

✓ Jira
  Created 3 tasks
  1.7s

✓ Slack
  Sent 3 notifications
  0.9s
```

Clearly distinguish:

- Tool selected
- API request
- Processing
- Result
- Error

This should make the Swytchcode API integration visible to judges.

---

# 11. GitHub Issues Panel

Create a dedicated GitHub issues section.

Show:

- Issue number
- Title
- Labels
- Status
- Severity
- Priority
- Created date
- Assignee
- AI recommendation

Example:

```text
#142  Payment checkout fails
      bug · payment
      CRITICAL
      AI: Immediate action required
```

Allow:

- Search
- Filtering
- Sorting
- Severity filtering
- Priority filtering
- Selected state

---

# 12. AI Bug Analysis

When an issue is selected, show an analysis panel.

Example:

```text
AI Bug Analysis

Payment checkout fails after successful
authentication.

Severity
CRITICAL

Impact
HIGH

Confidence
94%

Why this matters
Users cannot complete purchases.

Recommended action
Create Jira task and notify payment team.
```

Use clear visual hierarchy.

Do not make AI analysis look like generic text.

---

# 13. Severity & Priority

Use consistent badges:

- Critical
- High
- Medium
- Low

Use subtle semantic colors.

Do not use huge colored cards.

---

# 14. Selected Bugs

Create a section showing bugs selected by the agent.

Example:

```text
Selected for Action

✓ #142 Payment checkout fails
✓ #137 Authentication timeout
✓ #128 Invoice generation failure
```

Show why each bug was selected.

Example:

```text
Critical + customer-facing impact
```

---

# 15. Agent Decisions

Create a dedicated decision panel.

Example:

```text
Agent Decisions

#142
→ Create Jira task
→ Notify Slack

#137
→ Create Jira task
→ Notify Slack

#128
→ Monitor
→ No immediate action
```

This is important because it visually proves that the agent is making decisions based on intermediate results.

---

# 16. Jira Tasks

Create a Jira task results section.

Display:

- Jira task ID
- Title
- Priority
- Status
- Assignee
- Created time
- Link/open action

Example:

```text
BUG-421
Fix payment checkout failure

Priority: Critical
Status: Created
```

Use realistic but clearly demo/test data until the backend is connected.

---

# 17. Slack Notifications

Create a Slack activity section.

Show:

```text
Slack

✓ #engineering

"AI Bug Commander identified 3 critical
bugs requiring immediate attention."

Sent 10:42 AM
```

Include:

- Channel
- Message preview
- Status
- Timestamp

---

# 18. Execution Timeline

Create a chronological execution timeline.

Example:

```text
10:42:01  Request received
10:42:02  GitHub selected
10:42:04  17 issues fetched
10:42:09  AI analysis completed
10:42:10  3 critical bugs selected
10:42:12  Jira tasks created
10:42:14  Slack notifications sent
10:42:15  Workflow completed
```

Make it easy to understand at a glance.

---

# 19. Final Result

At the end of the workflow, display a polished result card.

Example:

```text
✓ Bug Analysis Completed

17 issues analyzed

3 Critical
5 High
6 Medium
3 Low

Actions Taken
✓ 3 Jira tasks created
✓ 3 Slack notifications sent

[ View Jira Tasks ] [ View Slack Activity ]
```

---

# 20. Error & Retry

Every asynchronous operation must have proper error UI.

Example:

```text
⚠ GitHub request failed

Unable to fetch repository issues.

[ Retry ]
```

For agent workflow failures:

- Clearly identify failed step
- Show useful error message
- Provide Retry
- Do not break the entire application
- Preserve previous successful results

---

# 21. Clear / Reset Session

Add:

```text
Clear Session
```

This should reset:

- Prompt
- Agent workflow
- Tool activity
- Selected bugs
- Jira results
- Slack results
- Final response

Ask for confirmation only if there is meaningful generated state.

---

# 22. Integration Status

Create an Integrations page/panel showing:

```text
GitHub     ● Connected
Jira       ● Connected
Slack      ● Connected
OpenAI     ● Connected
Swytchcode  ● Connected
```

Use:

- Connected
- Not Connected
- Error
- Checking

Do not expose API keys.

---

# 23. Dark / Light Mode

Implement both:

- Light mode
- Dark mode

Theme switch should be available in the top header/sidebar.

Persist the user's theme preference.

Make sure every component works correctly in both themes.

Do not simply invert colors.

---

# 24. Responsive Design

The application must work properly on:

- Large desktop
- Standard desktop
- Laptop
- Tablet
- Mobile

Desktop:

- Persistent sidebar
- Multi-column dashboard

Tablet:

- Collapsible sidebar
- Responsive cards

Mobile:

- Sidebar becomes a drawer
- Cards stack vertically
- Tables become responsive
- Prompt input remains easy to use
- Workflow remains readable
- No horizontal overflow

Do not just shrink the desktop UI.

Actually redesign layouts at responsive breakpoints.

---

# 25. Animation

Use subtle, purposeful animations:

- Sidebar collapse
- Page transitions
- Card appearance
- Agent workflow state changes
- Progress indicators
- Loading states
- Toasts
- Dropdowns

Animations should feel fast and professional.

Avoid:

- Excessive bouncing
- Large animations
- Distracting effects
- Constant movement

---

# 26. Important Demo Experience

The most important user journey must be extremely polished:

```text
1. Select GitHub repository
        ↓
2. Enter natural-language request
        ↓
3. Click Run Agent
        ↓
4. Watch agent understand request
        ↓
5. Watch GitHub tool execute
        ↓
6. Watch issues appear
        ↓
7. Watch AI analyze severity
        ↓
8. Watch agent decide which bugs require action
        ↓
9. Watch Jira tasks get created
        ↓
10. Watch Slack notification happen
        ↓
11. Show final result
```

The user should never wonder:

> "What is the AI doing right now?"

The interface should always communicate the current state.

---

# 27. Dashboard Information Hierarchy

Prioritize information in this order:

1. Current repository
2. User prompt
3. Agent status
4. Current workflow step
5. Tool/API activity
6. AI decisions
7. Bug analysis
8. Jira/Slack results
9. Execution history

Do not overwhelm the initial screen with every detail.

Use cards, tabs, drawers, and expandable sections where appropriate.

---

# 28. Empty States

Create polished empty states.

Examples:

```text
No repository selected

Select a GitHub repository to begin.
```

```text
No agent run yet

Enter a request above to start Bug Commander.
```

```text
No critical bugs found

The agent did not identify any bugs requiring immediate action.
```

---

# 29. Loading States

Never leave blank areas during API calls.

Use:

- Skeleton loaders
- Spinners where appropriate
- Progress states
- "Agent is analyzing..." messages
- Tool execution states

---

# 30. Code Quality

Structure the application into reusable components.

Example:

```text
src/
├── components/
│   ├── ui/
│   ├── sidebar/
│   ├── header/
│   ├── agent/
│   ├── github/
│   ├── jira/
│   ├── slack/
│   └── workflow/
│
├── pages/
│   ├── CommandCenter/
│   ├── BugAnalysis/
│   ├── Workflow/
│   ├── Integrations/
│   ├── JiraTasks/
│   ├── SlackActivity/
│   ├── History/
│   └── Settings/
│
├── services/
│   └── api/
│
├── hooks/
├── types/
├── utils/
└── App.tsx
```

Keep components small and reusable.

---

# 31. API-Ready Architecture

The frontend will later connect to a FastAPI backend.

Create a clean API service layer.

For example:

```text
POST /api/agent/run
GET  /api/repositories
GET  /api/integrations
GET  /api/history
```

The frontend should not directly contain GitHub/Jira/Slack API logic.

Use mock/demo data only through a clearly separated mock service so it can easily be replaced with real backend APIs.

---

# 32. Final Design Requirement

Do NOT generate a generic AI dashboard.

Think through the entire product before implementing it.

The application should feel like a **real internal AI engineering command center** that could actually be used by a development team.

Every screen, button, card, spacing value, typography choice, icon, state, and interaction should feel intentional.

Prioritize:

**Clarity → Professionalism → Agent visibility → Consistency → Demo impact → Responsiveness**

The final result should be polished enough for a live buildathon jury demonstration.
