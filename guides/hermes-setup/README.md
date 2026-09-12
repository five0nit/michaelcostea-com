# Hermes generalist setup guide and starter pack

Read **GUIDE.md** or open **index.html** in a browser. The HTML works offline and uses no external fonts, scripts or images.

This pack contains a complete setup guide, portable operating templates, seven original lightweight skills plus the byte-exact pinned upstream Brief2Ship Agent Skill and all six references (eight skills total), prompts and a dry-run-first template installer. It does not contain Hermes itself, credentials, private agent memory, live gateway configuration, custom desktop drivers or the author's private automation scripts.

## Start here
1. Follow the guide through installation, provider login and creation of the `operator` profile.
2. From this extracted folder, preview the template installation:
   `python3 install_templates.py --profile-home "$HOME/.hermes/profiles/operator"`
3. Inspect the plan. Add `--apply` only when that is the profile you intend to modify. Existing managed files are backed up first.
4. Set configuration values using the guide's commands; the installer does not touch config, credentials, memory, gateways or project files.
5. Install the matching Brief2Ship CLI using section 15, then run the validation checkpoints. The bundled upstream skill is not the CLI executable.

`templates/SOUL.md` is the portable starter. `references/SOUL-published-reference.md` is the earlier public version and deliberately retains optional helper-tool references; do not install both as your active persona.

`templates/config-overlay.yaml` and `templates/advanced-settings-reference.yaml` are partial reference files, not replacement configurations. Personal-memory files are examples, never copies of private memory.

Authorised scope of this delivery: local guide and downloads only. No website or social publication performed.
