# Navigator — SF Service Guide

An AI-powered resource finder for case workers and people helping individuals in crisis. Built for [ShelterTech](https://www.sheltertech.org/) / SF Service Guide.

**Find. Connect. Help.**

---

## What it does

Navigator lets case workers describe who they are helping in plain language. An AI agent identifies the relevant groups (e.g. a family needing shelter + an individual needing mental health support), collects any missing eligibility info through a structured intake flow, then returns matched services from the SF Service Guide database — grouped and ranked per need.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| State | Redux Toolkit |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React + Material Symbols |
| Validation | Zod |
| Backend | REST + Server-Sent Events (SSE) |

---

## Getting started

### Prerequisites

- Node.js 18+
- A running instance of the Navigator backend API

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
VITE_API_KEY=your-api-key-here
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## Project structure

```
src/
├── app/
│   ├── providers/       # App-level React providers
│   ├── router/          # Routes, AppRouter, ProtectedRoute
│   └── store/           # Redux store + slices (chat, ui, user)
├── features/
│   ├── landing/         # Landing page with search input + prompt chips
│   └── chat/            # Chat pane, results panel, intake card, group cards
├── services/
│   └── api.ts           # SSE client for /chat, /chat/resume, /services/batch
└── shared/
    └── components/      # Sidebar, ErrorBoundary, logos, shared UI
```

---

## How the agent flow works

1. User describes a need in plain text
2. Backend agent classifies one or more **groups** (Who needs what, where)
3. For any group missing eligibility info, the UI presents a **structured intake card** — a stepped, per-group questionnaire
4. Once all groups are complete, the agent searches the SF Service Guide and streams back matched services
5. Results appear in the right panel, organized by group, with an AI rationale summary

Eligibility dimensions the agent can ask about: Age, Housing Status, Gender, Family Status, Employment, Financial Status, Health Concerns, Ethnicity, Immigration Status, and more.

---

## Mockups

Static HTML/CSS/JS mockups live in `mockups/` and can be opened directly in a browser — no build step needed.

| File | Screen |
|---|---|
| `mockups/landing.html` | Landing / search home |
| `mockups/chat.html` | Chat + intake card + results panel |

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the Navigator backend API |
| `VITE_API_KEY` | API key sent as `X-API-Key` header |
