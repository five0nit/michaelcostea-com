---
name: verify-before-done
description: "Use before declaring completion. Test the requested result."
version: 1.0.0
---

# Verify before done

1. Convert the request into explicit acceptance checks.
2. Check the exact changed checkout/artifact, not a stale server or a different branch.
3. Run the real user flow. Include meaningful failure, empty and invalid-input cases where relevant.
4. Separate syntax/build/unit checks from browser or end-to-end checks.
5. For an external write, persist the returned handle immediately and read back the exact target. Do not repeat a create request after an ambiguous response without reconciling it.
6. For archives, extract a fresh copy and exercise the documented entry point there.
7. For documents, inspect the rendered format, links and copyable commands. A good Markdown source can still render badly.
8. Count and aggregate in code; compare collected results with the requested scope.
9. Report commands actually run, actual results and unrun checks. Never synthesize plausible tool output.

A successful API response, passing build or subagent statement is evidence of one step, not proof of the whole task.
