# DOUBLE GAME 🎮

**One man. Two identities. A billion-rupee secret.**

DOUBLE GAME is an original cinematic open-world action-adventure game set in a fictionalized
version of Hyderabad, India. You play **Akshay**, a sharp-eyed bank employee who stumbles into a
financial conspiracy — and into **Keerthy**, an architect with a sketchbook and a cancelled payment
order that matches the anomaly to the rupee.

Built with **TypeScript + Three.js + Vite**, playable in the browser, keyboard + mouse.

> GTA V is referenced only as a broad genre benchmark for open-world freedom and cinematic
> presentation. All characters, locations, missions, visuals and audio here are original.

---

## ▶️ Play now (Milestone 1 — vertical slice)

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173), click **NEW GAME**, and play
**Mission 1: Monday Morning** end to end (~10–15 minutes):

commute → bank → the ₹49,900 anomaly → Meera → Naveen → lunch at Charminar Chai Co. →
meet Keerthy → a shared activity (walk or café) → the Kaveri thread → the hook.

Progress auto-saves at every objective; **Continue** on the title screen resumes it.

### Controls

| Key | Action |
| --- | --- |
| **WASD** | Move (relative to camera) |
| **Mouse** | Camera — pointer-lock, or drag if the browser denies it |
| **Shift** | Sprint |
| **Space** | Jump |
| **E** | Interact / advance dialogue |
| **1–3** | Pick dialogue choices |
| **Tab** | Notebook — clues, deduction board, Keerthy page |
| **Esc** | Pause (save, mute, quit) |

---

## 🧩 What's actually in this slice

**Playable systems (all verified by automated runtime playthrough, see Testing):**

- Third-person Akshay controller: walk/sprint/jump, capsule collision vs. the world,
  wall-sliding, step-up, camera orbit with world collision (no clipping through walls).
- A compact open district: Street One with traffic, pedestrians, trees, lamps, parked cars,
  Akshay's apartment block, shops, **Janapriya Bank** (full interior: counters, desks, glass
  manager cabin, server room), **Charminar Chai Co.** and the plaza with the *Two Ledgers* mural.
- **Financial investigation**: a working CORE-banking terminal (inspect rows, file an anomaly
  report), physical evidence (the discarded remittance slip), testimony from colleagues, and a
  notebook with a real deduction board — connect two clues to unlock conclusions
  (`E1+E3 → The Blind Window`, `D1+E4 → The Kaveri Thread`). Evidence is tagged by reliability
  (confirmed record / testimony / physical / document).
- **Keerthy & the romance**: a full authored encounter with playful/sincere/awkward openers,
  an honesty choice with lasting consequences, a promise (Friday's exhibition), and a playable
  shared activity — she leads a walk to her mural, pausing with quips if you lag. Her discovery
  of the cancelled ₹49,900 payment is grounded in her own email, not magic knowledge.
- **Relationship state**: trust, closeness, suspicion, promises, shared memories, revelations and
  "what Keerthy believes" — tracked separately and shown in the notebook; the ending texts change
  with your honesty choice (honest → she sends the payment-order document = evidence E6).
- **Mission flow**: objectives + compass beacon, mission start/completion card, auto-save,
  manual save, and full save/resume from the title screen.
- **Hook cinematic**: black sedan, Naveen's warning, compliance email, Keerthy's message,
  "NEXT — Mission 2: The Missing Amount".
- Original procedural audio (Web Audio API): ambient city pad, footsteps, UI and story stingers.

**Deliberately not in Milestone 1** (per the milestone plan): driving, R/dual-identity system,
Naveen as a follower, Prithviraj's active interference, missions 2–15, map screen, more districts.

---

## 🏗️ Architecture

```
src/
  core/        engine (renderer/lights/loop), input, audio, collision (AABB + triggers), save
  systems/     relationship.ts, investigation.ts (pure logic, node-testable), dialogue types
  data/        content.ts (evidence/deductions), mission1.ts (dialogue graphs, objectives, phones)
  world/       build.ts — city block, bank, café, plaza, props, colliders, triggers
  entities/    humanoid (procedural characters + animation), player controller, NPCs
  ui/          hud, dialogue runner, notebook, bank terminal, phone/menus/mission card
  game.ts      orchestrator: phase machine, effects, walk-AI, cinematics, save/load
tests/
  logic.test.mts    pure-logic unit tests (relationship, investigation, content integrity)
  runtime.test.mts  headless full-playthrough test (jsdom + stubbed WebGL): boots the real game
                    and script-plays Mission 1 with simulated input, verifying every phase,
                    dialogue, clue, deduction, phone, cinematic and save/resume round-trip
```

## ✅ Testing

```bash
npm run typecheck      # strict TS
npm test               # pure-logic unit tests
npm run test:runtime   # headless scripted playthrough of the whole slice
npm run build          # production build
```

The runtime test cannot exercise the GPU (this repo's CI has no browser binary), so rendering is
verified by build + manual preview, while everything else — movement, collision, reachability of
every objective, mission phases, dialogue branching, terminal, notebook deductions, cinematics,
phone overlays and save/resume — is executed for real against the game code.

## 🗺️ Roadmap

Milestone 1 (this) → **Milestone 2**: deeper investigation, timeline reconstruction, framing &
escape (Missions 2–3) → **Milestone 3**: R + Naveen, cover stories, infiltration (Missions 4–6) →
**Milestone 4**: driving, city expansion (Missions 7–9) → **Milestone 5**: Prithviraj, finale,
sequel hook (Missions 10–15) → **Milestone 6**: polish & release.

---

## 📖 Story

Akshay, an intelligent and ambitious bank employee, discovers suspicious financial transactions
that connect to a powerful criminal network. When he is framed for a crime he never committed, he
creates an alternate identity known as **R** to infiltrate the network and uncover the truth.

With the help of **Naveen**, a witty and resourceful investigator, Akshay navigates dangerous
investigations, hilarious disguises, romantic complications, and encounters with **Prithviraj**,
a powerful kingmaker who operates behind a respectable public image. Meanwhile, **Keerthy** enters
Akshay's life, creating an emotional conflict between love and deception.

Every clue brings him closer to the truth—and deeper into a game he may not control.

**The question is not who is playing the game. It's who created it.**
