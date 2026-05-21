# Faltômetro

A mobile-first absence tracker that turns a stressful end-of-semester calculation into a glanceable, game-like dashboard.

The name is a contraction of *falta* (a missed class) and *-ômetro* (a meter): a measurer for how many absences you can still afford before a subject fails you on attendance alone.

Built as the A3 final project for the **Usability, Web, Mobile & Game Development** course.

**Live demo:** https://lucasgflores.github.io/A3-Usabilidade

<img width="480" height="363" alt="Faltômetro" src="https://github.com/user-attachments/assets/48695eb1-6576-48ae-9140-f399e70e871b" />

## Authors

- Francesco Ghisi
- João Pedro Gois
- Leonardo Alves Silva
- Lucas Gabriel Flores
- Mateus Nunes Lehmkuhl

## The Problem

Undergraduates fail a subject the moment their absences cross the 25% ceiling independent of grades. The catch is that nobody really tracks this in real time. University Grade/Absence tab doesn't show how many total possible missed classes you can have, nor how further you are from it; besides, also being poorly synchronized and frequently not showing every absence realized. Absences are scattered across a semester, spread over several subjects on different weekdays, and the realization that one course is already lost usually arrives too late to do anything about it.

**Persona.** A full-time student carrying five or six subjects, commuting, occasionally missing class for work, health, or fatigue. They do not want a spreadsheet or mental arithmetic; they want a five-second answer to a single question: *which subject is closest to the edge, and how much room is left?*

Faltômetro removes that friction. Each subject is given an absence budget, and the app counts down **visually** every time a class is missed.

## How It Works

1. **Add a subject >**  name it and pick the weekday (or two) it meets. The app derives an absence allowance from that schedule.
2. **Browse subjects >**  each subject is a full-screen card; swipe horizontally to move between them.
3. **Register an absence >**  a single tap on *Faltei hoje* spends one unit of the budget. The action is reversible.
4. **Read the meter >**  a ring around the counter behaves like a health bar: full when the semester is safe, draining as absences accumulate, with a status label that shifts from safe to warning to danger.
5. **Inspect history >**  the calendar view shows a per-month grid of absent / present / today, plus a scrollable absence log.

## Features

- Per-subject absence budget with a live remaining count
- Animated ring gauge that depletes like a life bar
- Three-tier urgency status (safe / warning / danger) that recolors as the budget runs low
- Swipeable subject carousel with navigation dots and arrow fallbacks
- Monthly calendar with absence history and a present/absent/today legend
- Single-tap absence registration with undo
- Add and edit subjects, including subjects that meet on two weekdays
- Confirmation prompt before any destructive action
- Empty state that guides first-time users
- Dark and light themes with a persisted preference
- No account, no backend, everything runs in the browser

## Usability and Human–Computer Interaction

Usability is treated as the core of the product, not a finishing layer.

**Error prevention.** The interface removes the chance to make a mistake rather than catching it afterwards. Weekdays are chosen from a constrained dropdown instead of free text, so a typo can never produce an invalid schedule. Absences are spent and refunded with discrete taps. There is no free-form number field to mistype. Every destructive action (deleting a subject and its entire history) is intercepted by a confirmation bottom sheet.

**Fitts's Law and the thumb zone.** The two primary actions, registering an absence and opening the calendar are anchored at the bottom of the screen, inside the natural arc of a thumb on a one-handed grip. Primary buttons span the full width and exceed the 48px minimum touch target, so they remain comfortable for large fingers and reduce mis-taps.

**Immediate feedback.** Every interactive element answers a press with a physical scale-down animation, the ring animates smoothly to its new value, and toast notifications confirm that an action succeeded. The user is never left guessing whether a tap registered.

**Resilience.** State is loaded defensively: missing or unreadable storage resolves to the guided empty state instead of a blank or broken screen, so the app degrades gracefully rather than failing silently.

## Accessibility

The interface is built to clear a Lighthouse accessibility score above 90.

- Dialogs use `role="dialog"`, `aria-modal`, and `aria-labelledby` so assistive technology announces them correctly
- Every icon-only button carries a descriptive `aria-label`; purely decorative SVGs are marked `aria-hidden`
- The empty state is an `aria-live` region, so its guidance is announced when it appears
- The subject carousel is exposed as a `tablist` with labelled controls
- Both themes are tuned for sufficient text contrast

## Gamification

A maintenance chore, counting absences, is reframed as a resource you defend.

- **The ring is a life bar.** It starts full and drains with every absence; the metaphor makes a dry number feel like something worth protecting.
- **Urgency through color.** The status badge moves through three tiers **safe, warning, danger** recoloring as the budget shrinks, so risk is legible at a glance without reading a single digit.
- **Tactile reward.** Buttons compress on press, giving each interaction a small, satisfying physical response.
- **Progression feedback.** The ring fill animates with eased motion, and toasts act as micro-confirmations for each action.

## Mobile First

The product was designed phone-first and scales up, never the reverse.

- The entire UI lives inside a phone frame and is gesture-driven: subjects are navigated by horizontal swipe
- Layout uses `dvh` units and `env(safe-area-inset-*)` to respect notches and home indicators on real devices
- The carousel keeps any number of subjects inside a fixed viewport, so there is never an unwanted horizontal scrollbar
- The layout reflows fluidly from small phones up to desktop browsers

## Data and Persistence

- All application state subjects, their weekdays, absence counts, and dated absence history is persisted in the browser via `LocalStorage`. No server and no sign-up are required.
- A central state module holds the in-memory model; storage logic serializes it on change and rehydrates it on load.
- The UI is driven by array operations over that state: adding and removing subjects, registering and undoing absences, and building the calendar grid.

## Tech Stack

- Semantic HTML5
- CSS3 custom theming, layout, and animations, no framework
- Vanilla JavaScript as native ES Modules, no build step or bundler
- `LocalStorage` for persistence
- Open Graph metadata for rich link previews when the app is shared

## Project Structure

```
A3-Usabilidade/
├── index.html            # Semantic markup: phone frame, modals, calendar
├── styles.css            # Theming, layout, and animations
├── icons.svg             # Inline SVG icon sprite
└── js/
    ├── app.js            # Entry point, wires modules, exposes handlers
    └── modules/
        ├── state.js      # Central in-memory application state
        ├── storage.js    # LocalStorage persistence and subject CRUD
        ├── slides.js     # Subject card rendering
        ├── carousel.js   # Swipe navigation between subjects
        ├── absences.js   # Register and undo absences
        ├── modal.js      # Add / edit subject flow
        ├── calendar.js   # Monthly calendar and absence history
        └── ui.js         # Theme toggle, confirmation dialog, toasts
```

## Running Locally

Will eventually hold and allow for either a PWA approach of a Web App, or, be natively installed through an apk.

Either option will exist directly related and sided with the Web version.\
For now, try the **[Faltômetro Web Demo →](https://lucasgflores.github.io/A3-Usabilidade)**