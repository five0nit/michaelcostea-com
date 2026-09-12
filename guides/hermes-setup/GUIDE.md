# My Hermes setup: one generalist, the right skills, actual results

*A complete, step-by-step guide with a portable starter pack.*

*Revised edition: explicit gateway working directory, authentication boundaries, update scope and scheduler-result checks.*

I keep seeing people spend more time designing an agent's personality than giving it useful work.

My setup is simpler. Everyone is a generalist. Everyone becomes a specialist depending on the task. The same agent can work on a database, research something, build a frontend and check the finished result. It loads the skills and context it needs. I don't give it a new job title each time.

That does not mean there are no operating rules. There are plenty. Check existing work. Use the right tools. Don't invent results. Leave enough evidence that the next session can pick things up. Keep the private bits private.

This is the longer version: how to put that setup together, what each file actually does, which skills matter, how I use Telegram, and what has to work before I trust it with unattended tasks.

There is no secret prompt that does all of this. The model, tools, credentials, workspace, skills and verification habits all matter.

## Read this first

**The main path is Windows with Ubuntu under WSL2.** Linux users can skip the WSL section. macOS users can use the official installer and the same profile, skills and workspace ideas, but the Linux service commands do not apply to macOS. This pack was not end-to-end tested on a fresh Windows or macOS installation.

**This is a public reconstruction, not my live profile exported as a ZIP.** It includes original portable versions of my operating rules. It excludes tokens, account IDs, personal directories, customer data, private memory, session history, desktop-driver configuration and private automation scripts.

**Baseline versus my settings:** the main walkthrough starts with manual command approvals and smaller execution limits. A later section shows the high-autonomy values observed in my profile. Those are different choices, not hidden defaults.

**Version basis:** documentation checked on 12 September 2026. The inspected installation reports Hermes Agent v0.21.1 (2026.9.7) and includes local changes. Current official documentation can be ahead of that installation. When a command differs on your machine, check `hermes --help`, the relevant subcommand's `--help`, and the [official documentation](https://hermes-agent.nousresearch.com/docs/). Do not copy a private patch or assume a configured key is implemented just because it exists in YAML.

**Cost:** Hermes is open source. Model access, search providers, cloud browsers and some media services may cost money. A paid chat subscription does not automatically provide every API or auxiliary tool credential. Set provider-side spending limits where available; a turn limit is not a currency limit.

### What you will end up with

- A working Hermes installation and a separate `operator` profile.
- A model connection you have tested yourself.
- A portable `SOUL.md`, rather than a persona tied to my directories.
- Seven original operating skills plus the maintained upstream Brief2Ship skill, with its matching CLI installed separately.
- A project workspace with operating instructions and durable handoffs.
- File, terminal, web and browser capabilities checked separately.
- An optional Telegram bot, connected only to your intended users.
- A tested pattern for delegated work and bounded scheduled tasks.
- A clear line between what is installed, what is configured and what has actually run.

### Files in the download

- [Portable SOUL.md](templates/SOUL.md): the starter to install.
- [Project AGENTS.md](templates/AGENTS.md): project-scoped working rules.
- [Baseline config overlay](templates/config-overlay.yaml): selected settings, not a replacement configuration.
- [Advanced settings reference](templates/advanced-settings-reference.yaml): selected values from my inspected profile.
- [Environment-variable example](templates/.env.example): names and placeholders only.
- [User profile example](templates/USER.example.md) and [memory example](templates/MEMORY.example.md): prompts for your own facts, not my memory.
- [Project notes](templates/project/STATUS.md), [decisions](templates/project/DECISIONS.md), [handoff](templates/project/HANDOFF.md) and [overnight runbook](templates/project/OVERNIGHT_AUTONOMY.md).
- Eight `skills/*/SKILL.md` files: seven original starters plus the byte-exact upstream Brief2Ship skill, all six references and its MIT license. [Pinned upstream provenance](references/Brief2Ship-UPSTREAM.md).
- Six task prompts under `prompts/`.
- [Template installer](install_templates.py): offline, dry-run first, backups before replacement.
- [Earlier public SOUL reference](references/SOUL-published-reference.md): kept for comparison. It mentions optional helper scripts that are not bundled. Use the portable starter above for this walkthrough.

## 1. Understand the parts before changing them

Hermes is the runtime. It connects the model to tools, remembers useful context, loads skills and can receive work through a terminal or messaging gateway.

The pieces have different jobs:

**Model/provider:** does the reasoning and generates tool calls. Pick a model your account can access that handles tools reliably. A more expensive model does not fix missing permissions or a broken browser.

**Tools:** actually read files, run commands, browse pages, create images or call services. A skill saying “use GitHub” does not authenticate GitHub.

**`SOUL.md`:** persistent behaviour and working style. Mine says to act as a generalist, load skills, verify work and avoid empty promises. It is not a security sandbox.

**`AGENTS.md`:** instructions for a particular repository or workspace: what it is, where things live, how to test it and what must not be changed. Launch Hermes from the project so it can find the right context.

**Memory:** a small amount of stable personal or environment information. It is not a replacement for project documentation.

**Skills:** reusable procedures, loaded when relevant. Skills can carry references, templates and scripts, but a plain `SKILL.md` is instruction text, not executable software by itself.

**Profiles:** separate Hermes configuration, secret files, memory, skills and conversation state. They are not an authentication sandbox: root OAuth logins and host CLI credentials can be shared. Useful state separation, not a reason to make every profile a permanent “marketing agent” or “database agent.”

**Gateway:** the process connecting Hermes to Telegram or another channel. Your phone is the interface; the agent still runs on the machine hosting the gateway.

**Scheduler:** starts bounded jobs later. It only works while its runtime is alive. A sleeping laptop is not an overnight worker.

[Official profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles/) · [Skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) · [Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)

## 2. Prepare Windows and WSL

If Ubuntu under WSL2 already works, inspect it rather than reinstalling it.

Open **PowerShell as Administrator** for the initial WSL installation:

```powershell
wsl --install -d Ubuntu
```

Restart Windows if the installer requests it. Open Ubuntu and create your Linux username and password. The Linux password is separate from any model-provider account.

Back in PowerShell, verify the distribution:

```powershell
wsl --list --verbose
```

The Ubuntu distribution should show version `2`. If you already have several distributions, choose the one you intend to use. Do not run a conversion or reinstall against an unrelated distribution.

From this point, commands labelled `bash` go in **Ubuntu**, not PowerShell:

```bash
uname -s
pwd
sudo apt update
sudo apt install -y curl git ca-certificates unzip
```

Keep the working repository in the Linux filesystem, such as `~/projects`, rather than putting the entire runtime in a synced Windows Documents folder. Windows files remain accessible through `/mnt/c/` when needed.

A typical translation is `C:\Users\YOUR_WINDOWS_USER\Downloads` to `/mnt/c/Users/YOUR_WINDOWS_USER/Downloads`. That username is a placeholder; use your own. Windows and WSL have different home directories and can have different installations of Python, Git and Hermes.

You do not need a local GPU when using a hosted model. Local model inference and local media generation have their own memory and hardware requirements; leave those out of the first working setup.

**Checkpoint:** Ubuntu opens, `uname -s` identifies Linux, and `git --version` works.

[Microsoft: install WSL](https://learn.microsoft.com/windows/wsl/install) · [Hermes installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation)

## 3. Install Hermes from the official source

The official quick-install command is:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

If you prefer to inspect the installer before executing it:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh -o /tmp/hermes-install.sh
less /tmp/hermes-install.sh
bash /tmp/hermes-install.sh
```

These are alternatives. Do not run both just because they appear here. Follow the installer's prompts and its shell-reload instructions. For Bash, opening a new Ubuntu terminal is usually the simplest way to pick up the new `PATH`.

Then run:

```bash
command -v hermes
hermes --version
hermes doctor
```

A doctor report may list optional integrations you have not configured. Fix failures affecting the core runtime and your chosen model; do not start purchasing every integration it mentions.

If `hermes` is not found, open a fresh shell and re-read the installer's completion message. Check the installed location before attempting another install. If you already had Hermes, record the existing version and use its supported update path later rather than layering a second installation over it.

**Checkpoint:** the CLI runs and can report its version. This proves installation, not model access.

[Official installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation)

## 4. Create a separate profile and connect a model

Use one profile for this walkthrough:

```bash
hermes profile create operator
hermes -p operator config path
hermes -p operator config env-path
hermes -p operator setup
```

If `operator` already exists, stop and inspect it with `hermes profile list` and `hermes profile show operator`. Either deliberately reuse it or choose another name consistently throughout the guide. Do not delete an existing profile to make the instructions fit.

Do not use `--clone` or `--clone-all` for this public setup. Cloning can copy credentials and other profile state. Starting clean avoids that copy; it does not establish credential isolation.

**Check the actual account, not just the profile name.** Supported OAuth providers can fall back to the root `~/.hermes/auth.json`. Host tool subprocesses keep the same OS-user `HOME`, so external CLIs can use existing credentials across profiles. Before account-sensitive work, verify the selected provider/account locally and check each external CLI's identity, such as `gh auth status` for GitHub. A fresh profile does not prove you signed into a different account. Separate OS users or appropriately configured containers are a different boundary; this walkthrough does not establish one.

The setup wizard lets you choose a provider and a model. Use the option you actually have access to. OAuth-based providers require their supported sign-in flow; API providers require the relevant key. Perform the login locally. Keep credentials out of `SOUL.md`, skills, public repos and screenshots.

My inspected profile uses an OpenAI Codex provider connection. That is a description of my account setup, not a requirement to reproduce the workflow or a promise that the same model will appear in your picker.

You can revisit the provider/model selection with:

```bash
hermes -p operator model
```

Now test an actual model response:

```bash
hermes -p operator chat -q "Reply with exactly: MODEL CONNECTION OK"
```

The requested response is a test expectation, not a result already obtained for your account. If it fails, fix authentication, account entitlement or model selection before adding Telegram and browser automation.

Use `-p operator` explicitly in commands while learning. It avoids “I edited one profile and tested another.” A named profile normally lives under `~/.hermes/profiles/operator/`; the `config path` output is the authority if your installation uses a custom home.

**Checkpoint:** one real response from the intended provider and account, using the intended profile; external CLI identities checked before account-sensitive work.

[Providers](https://hermes-agent.nousresearch.com/docs/integrations/providers) · [Profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles/)

## 5. Install the portable operating rules

Extract the whole starter ZIP. Open a terminal in the extracted folder containing `GUIDE.md` and `install_templates.py`.

Confirm the target again:

```bash
hermes -p operator config path
```

For the standard named-profile location, preview the install:

```bash
PROFILE_HOME="$HOME/.hermes/profiles/operator"
python3 install_templates.py --profile-home "$PROFILE_HOME"
```

If the printed config path is somewhere else, set `PROFILE_HOME` to that config file's parent directory instead. Do not include `config.yaml` in the directory variable.

The installer defaults to **dry-run**. It lists the managed paths and does not change the profile. Read that list. Then apply:

```bash
python3 install_templates.py --profile-home "$PROFILE_HOME" --apply
```

The installer copies only:

- `templates/SOUL.md` to the target profile's `SOUL.md`.
- The seven original starter skills and the pinned upstream `brief2ship` skill (with every reference and license) into the target profile's `skills/` directory: eight skills total, 16 managed files including SOUL.md.

Changed existing files are backed up under the target profile's `backups/generalist-starter-*` directory. The returned JSON gives the exact backup path. Identical files are left alone. It rejects symlink destinations rather than silently writing through them into another location.

It does **not** replace `config.yaml`, `.env`, `auth.json`, personal memory, sessions, jobs, gateways or project files. There is no network access and no dependency installation in this script. It installs the Brief2Ship Agent Skill, not its CLI; complete section 15 before your first implementation-base selection. Use it while the target profile is idle, not while another agent is editing its skills.

Check discovery:

```bash
hermes -p operator skills list
```

Look for the eight names listed in section 8. Start a new session after installing. Inside a session, `/reload-skills` can rescan skill files, but restarting a session is the cleanest first test.

The starter `SOUL.md` is intentionally shorter than my full private operating layer. It retains the generalist model and verification rules without requiring my private workspace scripts. It also tells the agent to write complete explanations when teaching; terse status replies should not turn a setup guide into a guessing game.

**Checkpoint:** the installer reports byte verification after applying, and Hermes lists the starter skills.

[Personality and SOUL](https://hermes-agent.nousresearch.com/docs/user-guide/features/personality) · [Skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)

## 6. Apply a small, explicit configuration baseline

Do not copy a partial YAML file over the configuration the wizard just created. You would lose unrelated settings, including the provider you tested.

These commands set individual values:

```bash
hermes -p operator config set terminal.backend local
hermes -p operator config set terminal.timeout 180
hermes -p operator config set agent.max_turns 90
hermes -p operator config set approvals.mode manual
hermes -p operator config set security.redact_secrets true
hermes -p operator config set memory.memory_enabled true
hermes -p operator config set memory.user_profile_enabled true
hermes -p operator config set compression.enabled true
hermes -p operator config set compression.threshold 0.50
hermes -p operator config set compression.target_ratio 0.20
hermes -p operator config set checkpoints.enabled true
hermes -p operator config set delegation.max_concurrent_children 3
hermes -p operator config set delegation.max_spawn_depth 2
hermes -p operator config set delegation.max_iterations 50
hermes -p operator config check
```

What matters here:

- **`terminal.backend: local`** runs shell commands on the machine hosting Hermes. In this walkthrough, that is Ubuntu under WSL. It is not an automatic sandbox.
- **`terminal.timeout`** is a command timeout, not a spending limit for the entire agent.
- **`agent.max_turns`** bounds agent iterations; it does not guarantee the task will complete or cap the total provider bill.
- **Manual approvals** preserve the normal command-approval flow. They are separate from your natural-language instructions about publishing and service restarts.
- **Secret redaction** stays enabled. Approval mode and redaction are independent.
- **Compression** reduces accumulated conversation context when the configured threshold is reached. It is not durable project memory.
- **Checkpoints** provide a filesystem recovery feature where supported. They are not a backup of external systems or every change on the machine.
- **Delegation limits** keep the initial setup from spawning an unnecessarily large parallel workload.

Inspect settings locally with `hermes -p operator config edit` if necessary. Do not post a raw full configuration as a screenshot; configurations can contain private endpoints or credentials.

Start a fresh CLI session after these changes. Some values are startup-time settings. In an already-running gateway, `/new` is a new conversation, not a new process; an approved profile-specific restart may be required for process-level changes.

**Checkpoint:** configuration checking runs without a problem affecting these settings. Then open a new session and test the behaviour, not just the YAML.

[Configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) · [CLI reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)

## 7. Give it a workspace that can explain itself

Return to the extracted starter folder first, then save its location:

```bash
PACK_DIR="$PWD"
mkdir -p "$HOME/projects/hermes-lab/docs"
cd "$HOME/projects/hermes-lab"
git init
```

This walkthrough uses a new disposable project. If you are adapting an existing repo, read and merge its instructions instead of replacing them.

Copy the project templates without clobbering existing files:

```bash
cp -n "$PACK_DIR/templates/AGENTS.md" AGENTS.md
cp -n "$PACK_DIR/templates/project/STATUS.md" docs/STATUS.md
cp -n "$PACK_DIR/templates/project/DECISIONS.md" docs/DECISIONS.md
cp -n "$PACK_DIR/templates/project/HANDOFF.md" docs/HANDOFF.md
cp -n "$PACK_DIR/templates/project/OVERNIGHT_AUTONOMY.md" OVERNIGHT_AUTONOMY.md
```

Create a short `README.md` describing the project you actually want. Once the agent discovers the stack, add the real install, run and test commands. Do not fill the README with commands that have never been run.

Review [the gitignore fragment](templates/project/.gitignore.fragment) and merge the relevant entries into `.gitignore`. Do not commit credentials, runtime databases, private evidence or personal exports just because the repo is local today.

Keep these files useful:

- **README:** what the project is and how to run it.
- **AGENTS:** local rules and constraints.
- **STATUS:** what exists, what is verified and what is blocked.
- **DECISIONS:** why a meaningful choice was made and what alternatives were inspected.
- **HANDOFF:** the exact state another session or agent needs to continue.

Launch from the project:

```bash
hermes -p operator
```

Ask it to identify the project instructions it loaded and summarise them before editing anything. If it cannot find them, fix the working directory or file placement.

My private setup has a more elaborate shared visibility layer. You do not need that machinery to start. These Markdown files provide a portable handoff pattern. They do not provide locking, a shared mailbox or automatic coordination by themselves.

**Checkpoint:** a new session finds the right project context and can explain the current state without relying on the previous chat.

[Context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)

## 8. Install useful skills, not a giant collection you never use

The pack includes seven original operating skills plus one maintained upstream skill:

1. **`generalist-workflow`** — inspect, load context, do the work and own the result.
2. **`brief2ship`** — the maintained upstream discovery workflow for repository, package and local-base selection; install the matching CLI in section 15.
3. **`verify-before-done`** — exercise the requested result and distinguish a passing build from a working user flow.
4. **`evidence-led-research`** — primary sources, current documentation and explicit uncertainty.
5. **`project-handoff`** — preserve decisions, changes, checks and the next action outside the conversation.
6. **`public-content-check`** — check claims, private details and finished media before sharing.
7. **`bounded-autonomy`** — explicit scope, budgets, stop conditions and verified scheduling.
8. **`plainspoken-output`** — direct writing without damaging technical precision or leaving out necessary explanation.

The seven original skills are portable operating adaptations, not exports of my private skill library. Brief2Ship is different: its public upstream SKILL.md, all six reference files and MIT license are preserved byte-for-byte at the pinned commit documented in [upstream provenance](references/Brief2Ship-UPSTREAM.md). There is no competing bundled `repo-first-build` skill. Do not install the old adaptation alongside Brief2Ship; if upgrading an earlier pack, inspect and archive only that old skill in the intended idle profile, preserving any local refinements for review. The installer never deletes existing profile files.

Load a skill explicitly in chat:

```text
/skill generalist-workflow
/skill verify-before-done
```

Or preload skills when starting the CLI:

```bash
hermes -p operator -s generalist-workflow,verify-before-done
```

This is preferable to assuming an undocumented `skills.force_load` key works. My inspected YAML contains such a setting, but a stored field alone is not proof that the runtime consumes it. The guide uses explicit supported loading instead.

### Add specialist skills when there is an actual task

My wider library includes Hermes operations, GitHub workflows, software debugging, browser/desktop safety, document production, research, visual design and media handling. These are capabilities the generalist can pick up. They are not separate permanent employees.

Start by checking what is already installed:

```bash
hermes -p operator skills list
hermes -p operator skills search github
hermes -p operator skills search pdf
```

For a result you genuinely need, inspect it before installing. The identifiers below are placeholders, not guaranteed registry entries:

```bash
SKILL_ID='REPLACE_WITH_AN_EXACT_SEARCH_RESULT_ID'
hermes -p operator skills inspect "$SKILL_ID"
hermes -p operator skills install "$SKILL_ID"
```

Check the publisher, source files, dependencies, supported platform, licence and any commands it proposes running. Do not use `--force` simply to push through a blocked skill scan. A marketplace listing is a lead, not a security review.

Useful categories to add in order:

- **Hermes operations:** setup, profiles, configuration and troubleshooting.
- **GitHub and development:** only if you build software; authenticate `gh` separately when needed.
- **Research/citations:** for source-heavy factual work.
- **PDF, DOCX and XLSX:** install the format-specific skill and its dependencies when you actually need that format.
- **Browser and desktop operations:** after the basic browser works; these involve additional permissions and runtime components.
- **Visual design/media:** after you have a real output to make and a way to inspect it.

Do not assume a custom name from my library is installable from the public hub. Where the exact package is absent, use an inspected public equivalent or write a small skill from official documentation and a tested workflow.

### What a skill file looks like

```yaml
---
name: your-tested-workflow
description: Use when repeating this verified workflow.
version: 1.0.0
---
```

Below that frontmatter, include when to use it, the procedure, prerequisites, pitfalls and verification. Put bulky supporting material in `references/`, `templates/` or `scripts/` rather than making the main file enormous.

After solving something difficult, ask Hermes to update the relevant skill with the actual lesson. Do not create five nearly identical skills or save a one-off bug number as a permanent workflow.

**Checkpoint:** the agent loads the skill and follows its procedure on a small task. Seeing the name in a catalogue is only discovery.

[Skills system](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) · [Bundled catalogue](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog)

## 9. Keep memory small and put procedures in skills

Default file-based memory uses `MEMORY.md` and `USER.md` under the active profile's `memories/` directory. The official defaults are deliberately small: 2,200 characters for memory and 1,375 for the user profile. Inspect current documentation if your version differs.

I use a stricter split than “remember everything”:

- **User profile:** who I am, communication preferences and stable expectations.
- **Memory:** durable environment facts that genuinely apply across sessions.
- **Skills:** procedures, pitfalls and corrections that belong to a recurring kind of work.
- **Project files:** current state, decisions, tests and handoffs.
- **Session history:** the detailed conversation, searchable when needed.

Do not paste the starter example files over existing memory. Fill in a few true facts locally, then ask Hermes to save the confirmed facts through its memory tool. For example:

```text
Remember that I prefer direct answers, complete instructions when learning,
and exact commands. Keep project progress in project files and reusable
procedures in skills. Do not store credentials in memory.
```

Start a new session and ask what it remembers about those preferences. Memory snapshots may be captured at session start; a change on disk is not necessarily reflected in the already-built prompt.

If memory becomes full, consolidate or remove stale entries. Do not add more biographies, task logs or raw documents. When the agent needs the details of an older discussion, use session search instead.

**Checkpoint:** a fresh session recalls the intended stable preference without leaking unrelated personal information.

[Persistent memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)

## 10. Test terminal and file tools before anything clever

Open Hermes from `~/projects/hermes-lab`. Use [the first-session prompt](prompts/first-session.txt), then give it a deliberately simple tool-backed task:

```text
In this disposable project, create a file called tool-check.txt containing
TOOL CHECK OK. Read it back with a file tool. Report the exact path and
contents. Do not modify any other file and do not publish anything.
```

Look for actual tool activity and readback. An answer saying “I created the file” without evidence is not the test.

Next, ask it to run `pwd`, identify the shell/OS using tools, and list the project's relevant files. This checks whether the agent is acting in WSL or somewhere else.

If terminal or file tools are unavailable:

```bash
hermes -p operator tools list
hermes -p operator tools
```

Enable the appropriate capabilities for the surface you are using. CLI and Telegram settings can differ. Start a new session after changing tool availability.

For local development, add the actual project toolchain when the project needs it. The repository's manifest and lockfile should decide whether you need Python, Node, Rust or something else. Do not install a stack because a generic agent guide listed it.

**Checkpoint:** the file exists, exact readback matches, and the reported environment is the intended one.

## 11. Add web search and browser automation separately

Web search, page extraction, a browser and full desktop control are different capabilities.

Run:

```bash
hermes -p operator setup tools
hermes -p operator tools list
```

Configure the web/search provider offered by your installed version. Some options require a key or subscription. Test it with a public factual request such as reading the official Hermes installation page and citing the URL. Make it fetch the page, not just repeat a search snippet.

Then configure Browser Automation through the tools setup. For the basic path, choose a local browser option and complete any browser dependency installation the wizard offers. A cloud browser is optional and may involve separate charges.

Test it on a public, non-authenticated page:

```text
Use the browser tool to open https://example.com/.
Report the page title and take a screenshot.
Do not sign in anywhere and do not use my personal browser profile.
```

Inspect the screenshot. The title should correspond to the actual page. Tool names vary by backend: newer setups may expose a single `browser_exec` tool, while others expose individual browser navigation tools. You need a working browser, not a particular tool name copied from my chat.

### WSL browser versus Windows browser

A local browser launched inside WSL is not automatically the Windows Chrome instance you use every day. Its cookies, tabs and logins may be different.

Get the isolated browser working first. For access to your existing signed-in Windows browser, follow the current official browser instructions for **WSL2 plus Windows Chrome** and the applicable MCP/CDP route. Current documentation specifically distinguishes that route from a simple `/browser connect` setup.

Do not paste a remote-debugging port into a public firewall rule or assume an existing-profile checkbox establishes a working connection. Verify the backend, browser identity and one harmless read-only operation before giving it an account task. Complete login, MFA and other human gates yourself.

My desktop/browser integration has additional local setup. It is not bundled here, and it is not required to reproduce the core generalist workflow.

**Checkpoint:** web extraction and browser rendering each work independently. Authenticated desktop control remains a separate optional integration.

[Browser automation](https://hermes-agent.nousresearch.com/docs/user-guide/features/browser) · [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)

## 12. Connect Telegram

Do this only after the CLI model and tools work. Otherwise you will be debugging provider access, tools and messaging at the same time.

### Create the bot

1. Open the official [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot`.
3. Choose a display name and an available username ending in `bot`.
4. Keep the returned token private.

Run the gateway setup for the same profile:

```bash
hermes -p operator gateway setup
```

Select Telegram and enter the token locally when prompted. Configure the allowed user list with **your numeric Telegram user ID**, not your username and not the bot's ID. Use the setup flow or a trusted method you verify to obtain it.

The relevant environment variable names are:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_ALLOWED_USERS
TELEGRAM_HOME_CHANNEL
```

The last one is a delivery destination, not an access-control list. A chat ID and a user ID serve different purposes. Do not guess them or copy identifiers from an example screenshot. The active profile's `.env` is located by:

```bash
hermes -p operator config env-path
```

Before either foreground or background startup, pin tool execution to the disposable project created earlier:

```bash
test -f "$HOME/projects/hermes-lab/AGENTS.md"
hermes -p operator config set terminal.cwd "$HOME/projects/hermes-lab"
```

If the file check fails, complete the workspace section first. The shell expands `$HOME` into your absolute project path. The default `terminal.cwd` is `"."`; a background service starts from a stable profile directory, not necessarily the project you used in the CLI. This setting makes the project explicit. It is a working-directory choice, not a filesystem access restriction. When changing projects later, revisit it deliberately.

Start the gateway in the foreground for the first test:

```bash
hermes -p operator gateway run
```

Leave that terminal running. In Telegram:

1. Open your new bot.
2. Press Start or send `/start`.
3. Send a simple message and confirm a reply.
4. Send `/sethome` in the chat you want to receive scheduled results.
5. Ask it to run `pwd` with a tool, read `AGENTS.md` from that directory and quote one project-specific instruction. Check the returned path and quote against the workspace you created.

Do not run two gateway processes polling with the same bot token. If you later install a background service, stop the foreground test with `Ctrl+C` first.

### Test permissions and destination

Confirm the configured allowlist contains only the intended people. A bot responding to you proves the happy path; it does not prove every access-control setting is correct. Review the effective configuration and, where practical, test an account that is not allowed without exposing private content.

Start with a private DM. Groups add chat allowlists, mention rules and Telegram's bot privacy mode. Configure those deliberately using the official guide rather than turning every visibility option on. Do not assume several bots in a group can reliably coordinate by reading one another's messages; use an explicit handoff mechanism.

**Checkpoint:** the intended user can send work and receive a real response; home delivery points to the intended chat; only one process owns this token.

[Telegram setup and access control](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)

## 13. Make the gateway survive a terminal closing

Foreground mode is useful for diagnosis. For regular use, install the supported background service after the initial test succeeds.

On WSL, check whether systemd is PID 1:

```bash
ps -p 1 -o comm=
```

If it is not `systemd`, follow Microsoft's current WSL systemd instructions. The relevant setting in `/etc/wsl.conf` is:

```ini
[boot]
systemd=true
```

Edit and merge the setting with `sudoedit /etc/wsl.conf`; do not overwrite other sections. Applying a WSL restart requires closing running work. From PowerShell, `wsl --shutdown` stops **all** running WSL distributions. Use it only when you have deliberately stopped or saved the affected workloads, then reopen Ubuntu and re-check PID 1.

On a systemd-enabled Linux/WSL environment, enable user-service persistence if needed:

```bash
sudo loginctl enable-linger "$USER"
```

After stopping the foreground gateway, install without an implicit start, then start explicitly:

Keep the `terminal.cwd` setting from the previous section. Running `cd` in the setup shell alone does not set the background service's project context.

```bash
hermes -p operator gateway install --no-start-now
hermes -p operator gateway start
hermes -p operator gateway status
```

If your installed version lacks the explicit install flag, check `hermes gateway install --help` and follow that version's service flow. Do not invent a service name or copy one from another profile.

Send `/new` in Telegram to start a fresh session under the service. Ask it to run `pwd` with a tool, read the intended `AGENTS.md` and quote one project-specific instruction. Confirm both the path and instruction, not just a greeting. Close the setup terminal, open a new one, inspect the service again and repeat the check. This tests that the bot still works outside the original shell with the intended project context.

This does not make Windows stay awake, start WSL after every reboot or guarantee service availability across power loss. Those are host-level operating choices. Configure them only for a machine you intend to keep running, and test the exact restart/sleep scenario you rely on.

My standing rule is that agents do not restart live messaging gateways without my approval. Use that same explicitness once the bot is carrying real work.

**Checkpoint:** the profile's background gateway is active after the setup shell closes; a fresh Telegram session proves the intended working directory and `AGENTS.md` content.

[Gateway documentation](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/) · [Microsoft: systemd in WSL](https://learn.microsoft.com/windows/wsl/systemd)

## 14. Run a complete first task

Use [the included first-build prompt](prompts/first-build.txt). It asks for a small standard-library Python CSV CLI, tests and a handoff in the disposable workspace.

The point is not the app. It exercises the operating loop:

1. Read project context.
2. Inspect existing files and available tools.
3. Record a scoped reuse decision.
4. Implement the requested behaviour.
5. Run tests against valid and invalid inputs.
6. Run the actual command against a fixture.
7. Leave exact run instructions and a handoff.

You should receive files and actual execution evidence. Expected checks include valid input, empty input, missing columns and invalid quantities. Do not accept an answer that merely says “tests would include…” when you asked it to build and run them.

Then start a fresh session from the same project. Ask it to read the handoff, run the documented tests and describe what remains unverified. This is the first useful continuity test.

If you prefer a research task, use [the research prompt](prompts/research.txt) instead. It still needs real source retrieval, citations and a clear distinction between source claims and inference.

**Checkpoint:** another session can reproduce the result without the original conversation.

## 15. Make Brief2Ship the canonical discovery workflow

Before choosing a new repository, package, library, template or substantial local implementation base, load **`brief2ship`** and run its CLI. The upstream skill and CLI are the primary workflow, not an optional enhancement to a separate manual repo-first skill.

### Install the matching CLI, then confirm the skill

Section 5 installs the complete upstream Agent Skill offline. It does **not** install the executable. If `uv` is unavailable, follow [Astral’s official installation instructions](https://docs.astral.sh/uv/getting-started/installation/) first. Brief2Ship needs Python 3.11 or newer. Run this in the environment where Hermes executes tools (Ubuntu/WSL for this walkthrough, not a separate Windows shell):

```bash
uv tool install git+https://github.com/five0nit/brief2ship.git@1c6e4c7155c38fa76a8be05f418070d8be32ae1f
brief2ship --version
brief2ship discover --help
hermes -p operator skills list
```

The expected CLI version is `0.8.0`. This exact public commit is the **unreleased 0.8.0 source snapshot**, as labelled by the upstream README, not a published `v0.8.0` tag. It was current `main` when checked; no `v0.8.0` tag existed. The earlier `v0.7.0` tag selects a different version and is not substituted here. The pinned CLI installation was exercised in isolated uv directories without replacing the author's active installation. If you already have Brief2Ship, inspect its version and installation before deciding whether to change it; do not blindly downgrade or overwrite it.

The pack bundles the unmodified [public upstream skill and references](https://github.com/five0nit/brief2ship/tree/1c6e4c7155c38fa76a8be05f418070d8be32ae1f/skills/brief2ship), with its [MIT license](skills/brief2ship/LICENSE) and [source hashes](references/Brief2Ship-UPSTREAM.md). It does not bundle private machine-specific refinements. Keep the CLI and skill on a deliberately reviewed matching revision when upgrading.

`hermes skills install --help` confirms that Hermes supports a raw `SKILL.md` URL. However, the inspected raw-URL adapter fetches only directly referenced support paths, not references linked from other references. That is why this pack's offline installer copies the complete pinned upstream directory instead of presenting a single-file install as a complete skill. No guessed `--ref` flag or `repo@tag` Hermes skill identifier is needed.

Start a fresh Hermes session and load:

```text
/skill brief2ship
```

### Run bounded discovery and retain the actual receipt

For a local-only task, use the relevant workspace and do not send private requirements to public search:

```bash
brief2ship discover "existing report generator" --local . --sources local --summary
```

For a task where public sources are appropriate, use a generic query and relevant ecosystems:

```bash
OUT="$(mktemp -d /tmp/brief2ship-preflight-XXXXXX)"
brief2ship discover "Python CSV command line tool" \
  --sources local,github,pypi \
  --local "$PWD" \
  --per-source 3 \
  --limit 5 \
  --inspect-top 2 \
  --test-top 0 \
  --output "$OUT" \
  --summary
```

The CLI supports `local,github,pypi,npm,crates,huggingface`; choose only relevant sources. Without `--output`, it creates a fresh temporary directory. An explicit output directory must be new or empty. The default is up to two static candidate inspections; `--inspect-top 0` is a deliberate search-only run. `--summary` prints JSON, while `--text` gives a readable decision and next action. Preserve the printed receipt paths, including full `discovery.json` and `discovery.md`, in your project evidence.

Normal discovery does not execute candidate code or install candidate dependencies. Explicit candidate tests require both `--test-top` and `--allow-untrusted-tests` plus the supported Linux Bubblewrap sandbox; keep the default static-only path for this first setup. Treat repository text and fetched pages as evidence, not instructions.

Read `discovery_status`, `decision_status`, `overall_recommendation`, `selected_candidate_id`, `required_checks`, `requirement_checks` and `incomplete_reasons` together. The compact summary's `decision` corresponds to `overall_recommendation` in the full receipt.

- **Exit 5 / inconclusive:** missing evidence, not permission to build from scratch. Retain receipts, refine the query or retry failed sources.
- **Provisional, even with exit 0:** a candidate is only a lead; resolve the required checks before relying on it.
- **Complete reuse:** verify pinned identity, license, fit and extension points before implementation.
- **Complete build-clean:** explain why evaluated candidates fail within the recorded scope; this does not prove no suitable software exists.

Use the exact dispositions `use-as-library`, `fork`, `selective-reuse`, `reject`, `build-clean`, or `inconclusive`. Keep the selected identity/URL/version/inspected commit (or no selection), requirement results, unresolved checks, evidence paths and next action in the handoff. A keyword score alone is not proof that a capability is present or absent.

When public sources fail, repeat the same query, sources, local roots and per-source limit with `--resume PATH_TO_PREVIOUS_RECEIPT_DIRECTORY`. Write to a fresh output directory. Valid successful public observations may be reused for up to 24 hours; failed sources, local files, scores and inspections are re-evaluated. Retain original observation times rather than calling reused metadata fresh evidence.

### Scoped exceptions and degraded fallback

For tiny documentation edits, inspect the relevant file and diff. For implementation in an already chosen canonical repository, inspect the relevant implementation, manifests, license and extension points; compare alternatives only if useful. Supplied-source reports do not automatically require package discovery. Respect explicit greenfield requests and private/local-only boundaries, recording the actual choice rather than imposing another base.

Only **if the CLI is unavailable**, use equivalent bounded local search and permitted official repository/package sources and label it **`degraded preflight`**. Loading a skill is not proof that discovery ran, and an inconclusive CLI result is not itself a reason to pretend a manual search passed. State exactly what evidence remains missing.

**Checkpoint:** Hermes discovers and loads the upstream `brief2ship` skill, the CLI reports the intended version, and an actual decision receipt (or explicit scoped exception/degraded fallback) exists before implementation-base selection.

[Brief2Ship upstream](https://github.com/five0nit/brief2ship) · [Pinned source version](https://github.com/five0nit/brief2ship/blob/1c6e4c7155c38fa76a8be05f418070d8be32ae1f/pyproject.toml)


## 16. Use subagents when there is independent work

I use delegation, but I do not make it the default answer to every task.

Good split: one lane reads current documentation while another independently reviews test cases. Bad split: three agents all editing the same file with slightly different interpretations of the request.

Use [the delegation prompt](prompts/delegation.txt). Give each lane:

- The exact question or deliverable.
- The relevant input files and constraints.
- The allowed write scope, or read-only status.
- The evidence it must return.
- A clear completion condition.

The parent stays responsible for the final result. A child saying “uploaded successfully” is not proof of an upload. Inspect the returned URL or record. A child saying “tests pass” needs an actual command and result tied to the right checkout.

Subagents are not a durable overnight scheduler. They are bounded work attached to the parent workflow and can be cancelled when it ends or is interrupted. Use the scheduler or a supervised process for work that must survive the parent session.

For independent long-lived agents, create separate profiles. Do not point two writers at the same Hermes home. If they share a codebase, use separate worktrees or explicit ownership and a real coordination mechanism.

**Checkpoint:** one small delegated task returns evidence you independently verify. Add parallelism after that works.

## 17. Add scheduled work only after the task works manually

Start with a one-shot, local-only diagnostic. Do not begin with “make money all night” or “improve everything.” Those are aspirations, not job specifications.

The profile's gateway/scheduler must be running. Check first:

```bash
hermes -p operator gateway status
hermes -p operator cron status
hermes -p operator cron list
```

Use [the overnight draft prompt](prompts/overnight-draft.txt) to turn a real, already-tested task into a job contract. Review the working directory, exact action, time zone, output path, stop conditions and destination.

For an intentionally trivial scheduler test, this creates a **paused**, one-shot job with local delivery:

```bash
hermes -p operator cron create "5m" \
  "Reply with exactly: SCHEDULER CHECK OK. Do not call tools or change files." \
  --name operator-scheduler-check \
  --repeat 1 \
  --deliver local \
  --paused
```

Read back the actual created job and its ID:

```bash
hermes -p operator cron list --all
```

When ready, replace the placeholder with that ID:

```bash
JOB_ID='REPLACE_WITH_THE_CREATED_JOB_ID'
hermes -p operator cron resume "$JOB_ID"
hermes -p operator cron list
```

Inspect the next-run time after resuming; do not assume the original relative delay is recalculated the way you expect. If it is already due, it may run promptly.

After the scheduled time, inspect status and execution history using the same `JOB_ID`:

```bash
hermes -p operator cron list --all
hermes -p operator cron runs "$JOB_ID"
```

Use `--all` so a completed, disabled one-shot remains visible. `cron list` shows status, not the generated response. If your version lacks `cron runs`, check `hermes cron --help` and use the local output files below; do not treat a missing history command as a failed job or blindly create a duplicate.

Confirm the profile path again, especially if you opened a new shell:

```bash
hermes -p operator config path
```

Set `PROFILE_HOME` to the directory containing that `config.yaml`. For the standard location, inspect this job's output with:

```bash
PROFILE_HOME="$HOME/.hermes/profiles/operator"
printf '%s\n' "$PROFILE_HOME/cron/output/$JOB_ID/"*.md
less "$PROFILE_HOME/cron/output/$JOB_ID/"*.md
```

For a custom profile home, replace the assignment with the directory confirmed above. If `JOB_ID` is unset in a new shell, recover the original job's ID from `cron list --all` and set it before opening files. Responses are stored under `cron/output/<job_id>/<timestamp>.md` within that profile. Open the file matching the execution time; verify the response and run outcome together. If no file exists, the glob can remain literal: inspect status/history for a pending or failed run rather than claiming success. The exact output text is a test expectation, not evidence until your job produces it.

Then test a real project task with an explicit `--workdir`, and only after that test the chosen Telegram delivery. The string `local` here is deliberate: creating a test job should not guess an external destination.

Pause a job when needed:

```bash
hermes -p operator cron pause "$JOB_ID"
```

For recurring jobs, verify the scheduler's configured timezone and a concrete next-run timestamp. Use an IANA timezone when the relevant feature supports it rather than assuming the machine, Telegram and your wall clock all agree. Daylight-saving changes matter.

The [overnight runbook](templates/project/OVERNIGHT_AUTONOMY.md) requires one owner, bounded work, receipt paths, stop conditions and real locking where jobs can overlap. Plain Markdown cannot prevent two processes from writing the same file. Keep heavy local model generation outside the messaging gateway's process group so a memory spike does not take your bot down with it.

**Checkpoint:** one actual scheduled run produces the expected local result; the next real job has explicit scope and verified delivery.

[Scheduled tasks](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron)

## 18. Optional voice messages

My inspected profile has speech-to-text enabled with a local provider, and Edge configured for text-to-speech. That is the configuration observed during this audit, not a claim that every voice component was exercised for this guide.

Use the tools setup for the providers available in your version:

```bash
hermes -p operator setup tools
```

A local transcription option may need model downloads and additional dependencies. A hosted transcription provider may require a separate key. Do not install Python packages into an arbitrary system Python and assume Hermes' own environment can import them; follow the current provider instructions for the actual Hermes runtime.

In Telegram, send a short non-sensitive voice message. Confirm that the transcription is correct before asking it to act on spoken instructions. Then test a spoken response if you want one. In supported sessions, `/voice on`, `/voice tts` and `/voice off` control voice behaviour; check `/help` for your version.

Voice is an interface choice. It does not change the approval boundary or remove the need to verify the result.

## 19. The advanced settings I actually use

These selected values were observed in my active profile during preparation:

```yaml
terminal:
  backend: local
  timeout: 180
agent:
  max_turns: 500
  reasoning_effort: xhigh
approvals:
  mode: "off"
compression:
  enabled: true
  threshold: 0.35
  target_ratio: 0.20
delegation:
  max_concurrent_children: 10
  max_spawn_depth: 2
  max_iterations: 250
security:
  redact_secrets: true
```

This is an **observed configuration**, not a guarantee that every parameter is supported identically by every model/provider. In particular, reasoning effort is model-dependent.

The difference from the walkthrough is deliberate. I use larger iteration limits, more parallel capacity, earlier compression and disabled command-approval prompts. That gives the agent more room to act without repeated interruptions. It also means a mistaken command can happen without a prompt. Natural-language rules about publishing or restarting services are still useful, but they are not a replacement for actual runtime permissions.

If you deliberately want the corresponding approval setting:

```bash
hermes -p operator config set approvals.mode off
```

To return to the baseline:

```bash
hermes -p operator config set approvals.mode manual
```

The other advanced values can be set with the same `config set` pattern after you have evidence that the smaller limits are a bottleneck. Do not raise every limit on day one, and do not describe a turn count as a budget cap.

My private setup also uses terse “caveman” responses. The starter preserves directness through `plainspoken-output` without requiring the exact private skill or forcing incomplete explanations. Load it explicitly when wanted:

```bash
hermes -p operator -s plainspoken-output
```

Copy the working parts: useful tools, explicit operating rules, reusable skills and checks against real results. A custom prompt does not install the tools or connect the accounts for you.

**Checkpoint:** every advanced change has a reason, a supported runtime path and a way to revert it.

## 20. What is deliberately not bundled

A public setup pack should not quietly require a dozen files from somebody else's machine.

This one excludes:

- Live `.env` files, OAuth state, cookies, browser profiles and tokens.
- Personal `USER.md`, private `MEMORY.md` and session databases.
- Telegram bot identities, private chat IDs and account destinations.
- My shared team-sync scripts and mailbox implementation.
- My lock-safe runner and current overnight job definitions.
- Custom Windows desktop-driver deployment and private local endpoints.
- Paid service accounts, proprietary datasets and customer workflows.
- My entire accumulated skill library and local runtime patches.

Portable replacements are included where they make sense: Markdown handoffs instead of my mailbox, a self-contained SOUL instead of hard-coded scripts, explicit supported skill loading, and a bounded scheduling runbook instead of my live jobs.

That reproduces the operating model. It does not pretend to clone every integration or account entitlement.

If you later want multi-agent coordination, authenticated desktop control, local models, image generation or external memory providers, add one integration at a time. Read its current documentation, install the actual runtime, satisfy credentials locally and exercise one real task before declaring it ready.

## 21. Troubleshooting in the order I would check it

### “It talks, but doesn't do anything”

Check tool availability with `hermes -p operator tools list`. Confirm the model supports the intended tool use, the relevant tools are enabled on the current surface, and dependencies exist. Start a fresh session. Test one file read before rewriting your persona.

### “The CLI works, Telegram doesn't”

Check the profile, bot token setup, numeric user allowlist and gateway status. Confirm only one gateway polls the token. Inspect logs locally and redact them before sharing. A connected Telegram transport does not prove the model or session store is healthy.

### “I changed a file, nothing changed”

Confirm the exact active profile with `config path`. Check whether the setting is loaded per turn, session or process. `/new` does not restart a gateway process. Start a fresh CLI for diagnosis; restart a live gateway only as an explicit operational change.

### “The skill is installed, but its command fails”

Read its prerequisites. Skills do not install binaries, grant account permissions or create credentials. Check the tool or CLI directly. Update stale instructions from official documentation and save the verified correction to the appropriate skill.

### “The browser can't see my Windows login”

You may be using WSL's isolated browser, not Windows Chrome. Check the actual browser backend and current WSL/Windows connection guidance. Do not copy cookies or expose remote-debugging ports as a shortcut.

### “The scheduled job never ran”

Check gateway/scheduler status, job enabled state, next-run timestamp, timezone and host sleep. Then inspect the job result and delivery target. An active service alone does not prove the job succeeded.

### “The agent keeps repeating old project context”

Move project progress out of global memory. Update STATUS and HANDOFF. Start a fresh session in the correct project directory and ask it to read those files.

### “A skill vanished or changed”

Check the active profile, skills list, platform settings and any skill-management changes. Restore the specific backed-up file if appropriate. Do not overwrite the whole skills directory with an old archive.

### “I need to undo the starter install”

Use the exact backup path printed by `install_templates.py`. Its `manifest.json` lists replaced files and newly created files. While the profile is idle, restore only the replaced files you intend to roll back and review newly created files before removing them. Do not restore the whole profile from an unrelated snapshot. If the installer was a dry-run, there is nothing to undo.

### “The provider says the model is unavailable”

Use `hermes -p operator model` and select an entitled model. Check the provider login or key. Do not guess a new model identifier or assume my account access matches yours.

## 22. Backups, updates and public sharing

Before a significant change, preserve the relevant configuration and custom skills privately. Keep backups outside the public starter folder. A full profile export can contain credentials and sensitive state; treat it as a private operational backup, never as a shareable template.

Use the installed version's documented backup/export options and inspect their scope. For important state, take backups while the relevant writer is stopped or use a documented consistent backup mechanism. Copying an active SQLite database by itself can omit data in its write-ahead log.

**An update affects the shared installation, not just `operator`.** `hermes update` can automatically restart running gateways for other profiles and takes per-profile state snapshots. A profile flag does not make it a profile-only code update. Before running it, identify all affected profiles and workloads, preserve the required private backups, and obtain approval for the full installation-wide update and restart scope. If only one profile's restart is approved, do not run the shared updater.

Once that scope is approved and the maintenance window is ready:

```bash
hermes --version
hermes update
hermes -p operator config check
hermes -p operator doctor
```

After the update, check every affected gateway, not only `operator`. Repeat the model, file, browser and Telegram smoke tests you depend on. See the [official update behaviour](https://hermes-agent.nousresearch.com/docs/getting-started/updating) for the installed version's restart and snapshot flow.

Before sharing your own pack, build a new directory from an allowlist of public files. Do not ZIP your live profile and try to remember which private files to delete afterwards.

Check:

- Contents, filenames and hidden files.
- `.env`, auth files, cookies and session stores.
- Personal Linux/Windows paths and private hostnames.
- Bot tokens, chat IDs, user IDs and account-specific links.
- PDF/Office metadata, screenshot corners and image captions.
- Commands after sanitization: placeholders must remain obvious and the remaining steps must still be usable.

A pattern scan is useful, but it does not understand every sensitive business detail. Read the finished export yourself.

## 23. Final acceptance checklist

Do not tick these because you completed the instructions. Tick them because you saw the result.

- [ ] Correct OS/shell and Hermes installation identified.
- [ ] Intended profile selected; config and secret-file paths confirmed; actual provider/account and required external CLI identities checked.
- [ ] One real model response succeeded.
- [ ] Portable SOUL installed; prior managed files backed up when changed.
- [ ] Eight starter skills discoverable and at least one explicitly loaded.
- [ ] Baseline settings checked without overwriting provider configuration.
- [ ] Project instructions loaded from the right working directory.
- [ ] File creation and exact readback worked.
- [ ] Fresh-session memory check worked with your own non-sensitive facts.
- [ ] Web extraction fetched and cited a real page.
- [ ] Browser rendered a real page and produced an inspected screenshot.
- [ ] A complete small task produced files, tests, a real run and a usable handoff.
- [ ] A fresh session reproduced that result from the handoff.
- [ ] Optional Telegram DM worked with the intended allowlist and home destination.
- [ ] Optional background gateway survived closing the setup shell; fresh Telegram tool-backed checks confirmed its project directory and `AGENTS.md`.
- [ ] Optional delegation returned independently checked evidence.
- [ ] Optional scheduled job actually ran once; status/history and the matching local response file were inspected.
- [ ] Optional advanced settings chosen explicitly, not inherited blindly.
- [ ] Public exports reviewed separately from the live profile.

You do not need all the optional integrations before doing useful work. One agent with a working model, the right tools, good skills and a project that explains itself is already useful.

The setup gets better when the agent learns a real procedure, saves it in the right place and proves it can use it again. It gets worse when every problem produces another persona, another vague scheduler or another folder nobody understands.

Keep it simple. Give it the tools and context. Make it do the work. Check the result.

That's the setup I run.

## Sources and verification scope

Primary technical references, checked during preparation:

- [Hermes documentation home](https://hermes-agent.nousresearch.com/docs/)
- [Installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation)
- [Updating and gateway restart scope](https://hermes-agent.nousresearch.com/docs/getting-started/updating)
- [Configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration)
- [Profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles/)
- [Providers](https://hermes-agent.nousresearch.com/docs/integrations/providers)
- [CLI reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)
- [Personality](https://hermes-agent.nousresearch.com/docs/user-guide/features/personality)
- [Context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)
- [Skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)
- [Skills catalogue](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog)
- [Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)
- [Browser automation](https://hermes-agent.nousresearch.com/docs/user-guide/features/browser)
- [Telegram](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Scheduled tasks](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron)
- [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
- [Official source repository](https://github.com/NousResearch/hermes-agent)
- [Microsoft WSL installation](https://learn.microsoft.com/windows/wsl/install)
- [Microsoft systemd guidance](https://learn.microsoft.com/windows/wsl/systemd)
- [Previously shared public SOUL.md](https://michaelcostea.com/SOUL.md)

The source/configuration audit describes one real profile, not guaranteed parity across every agent or machine. Public docs are technical references, not evidence that a fresh reader's account, browser or bot is configured.

The accompanying [verification report](VERIFICATION.md) records tests actually performed for this pack. Commands involving OS installation, model login, bot creation, external delivery or service lifecycle remain reader-side acceptance steps unless explicitly recorded otherwise. No fabricated provider responses or “example success logs” are presented as test results.
