# Copilot instructions for Ropeybot

## Repository shape and architecture

This repo is a Node.js + TypeScript project for a Bondage Club bot framework. The important split is:

- Root package: the runnable app (`bin/`, `package.json`), which loads a `config.json`, chooses a game from `config.game`, and starts the bot.
- `src/`: the reusable library package published as `bc-bot` (`src/package.json`, `src/index.ts`). This is where the underlying BC API wrappers and shared bot primitives live.
- `bin/games/` and `bin/hub/`: concrete runtime game implementations. The README describes the built-in games; they are selected by the `game` field in config rather than by a central plugin registry.

The startup flow is intentionally simple:

- `bin/main.ts` reads the config file and calls `startBot()`.
- `startBot()` creates an `API_Connector`, joins the configured room, and dispatches to the selected game (`kidnappers`, `roleplay`, `petspa`, `dare`, `maidspartynight`, `casino`, etc.).
- `src/index.ts` re-exports the reusable API types and helpers used by the app and by game code.

The low-level BC abstractions live in files like `src/api.ts`, `src/apiConnector.ts`, `src/apiChatroom.ts`, `src/apiMap.ts`, and related modules. Game logic is event-driven and often interacts with these wrappers directly; when fixing or extending behavior, trace from the game class into the underlying API helpers, not just one file.

## Build, validation, and workflow commands

This repo does not define a dedicated unit-test runner or lint script. CI checks are based on formatting + type-checking + compilation:

```bash
# install dependencies
pnpm install

# root-level validation used in CI
pnpm run prettier
pnpm run types

# library compile step
cd src && pnpm install
cd src && pnpm run compile

# bundle the app for local runtime/Docker
pnpm run bundle

# run the bot locally
pnpm start
```

Useful build/runtime commands from the project README and package scripts:

```bash
# from the repo root
pnpm install
pnpm start

# build the Docker image locally
pnpm run bundle && docker build -t ropeybot --no-cache .
```

There is no single `test` command in the repo today. If the project gains tests later, prefer running the smallest relevant file/test target instead of the full suite; for now the main validation path is the TypeScript compile + Prettier checks above.

## Conventions specific to this repository

- The project intentionally uses a split package layout: `src` is the library, root app is the consumer. Changes to exported API surface often require touching both the library and the app wiring.
- This is a strict TypeScript project with ESM (`"type": "module"`). Respect the existing module style and avoid adding CommonJS patterns unless the codebase already does so in that area.
- Runtime configuration is externalized into `config.json`; the bot chooses game and room at startup based on configuration instead of hard-coded app state. Be careful not to add required config values without updating the README or the caller assumptions.
- Game code is not centralized in one mega-controller. Each game is a separate class/module and the root startup switch selects it. New game logic should follow that pattern.
- `bin/main.ts` is startup orchestration; keep game-specific behavior inside the game modules or the relevant `hub/logic` class instead of expanding startup logic into a catch-all.
- The repo includes legacy hub code under `bin/hub/` and newer event-based game code under `bin/games/`. The legacy code is copied from the original bot hub and may be less polished; preserve compatibility around those modules when editing them.
- Prettier is enforced, and formatting should follow the repo configuration rather than ad hoc style choices.

## Practical guidance for edits

- Start from the selected game module and follow the event flow into the API wrappers it calls.
- For shared bot behavior or API additions, check `src/index.ts` and the corresponding `src/*.ts` export modules before editing.
- Prefer small, targeted changes in the existing game or API module; avoid introducing new abstractions unless the change is truly cross-cutting.
- The project is strongly tied to the Bondage Club server API and real-time room events. Keep browser/game-state assumptions tied to the existing event model rather than rewriting gameplay flow broadly.

## Documentation and repo references

Relevant project references:

- `README.md`: startup instructions, bot/game overview, and repo layout.
- `package.json` and `src/package.json`: package scripts and build targets.
- `.github/workflows/*.yaml`: CI and publish pipeline behavior.

When troubleshooting or making changes, use these as the canonical source for expected commands and the intended app/library split.
