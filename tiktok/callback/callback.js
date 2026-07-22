(() => {
  "use strict";

  const API_BASE = "https://us-central1-idontknowhowtoai.cloudfunctions.net/signalPostApi";
  const status = document.getElementById("status");
  const relay = document.getElementById("relay");
  const source = new URLSearchParams(window.location.search);
  const allowed = ["code", "state", "error", "error_description"];
  const forwarded = new URLSearchParams();

  for (const key of allowed) {
    const value = source.get(key);
    if (value) forwarded.set(key, value);
  }

  const hasResult = forwarded.has("code") || forwarded.has("error");
  if (!hasResult) {
    status.textContent = "No TikTok authorization response was supplied. Start connection from SignalPost or the local Social Engine.";
    return;
  }

  const state = forwarded.get("state") || "";
  window.history.replaceState(null, "", window.location.pathname);

  if (state.startsWith('sp_')) {
    const returnToApp = (params) => window.location.replace(`/signalpost/#${params.toString()}`);
    if (forwarded.has("error")) {
      status.textContent = "TikTok declined or could not complete authorization. Returning to SignalPost…";
      const result = new URLSearchParams({ error: forwarded.get("error_description") || forwarded.get("error") || "authorization_failed" });
      window.setTimeout(() => returnToApp(result), 450);
      return;
    }

    status.textContent = "Authorization received. Creating your secure SignalPost session…";
    fetch(`${API_BASE}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: forwarded.get("code"), state }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.exchange_code) throw new Error(payload.message || "SignalPost could not complete authorization");
        status.textContent = "TikTok authorized. Returning a one-time connection response to SignalPost…";
        returnToApp(new URLSearchParams({ exchange_code: payload.exchange_code }));
      })
      .catch((error) => {
        status.textContent = "SignalPost could not complete the connection. Returning with the error…";
        window.setTimeout(() => returnToApp(new URLSearchParams({ error: error.message || "connection_failed" })), 650);
      });
    return;
  }

  const localUrl = `http://127.0.0.1:8767/callback?${forwarded.toString()}`;
  const goLocal = () => window.location.replace(localUrl);
  status.textContent = forwarded.has("error")
    ? "TikTok returned an authorization error. Returning the result to the local Social Engine…"
    : "Authorization received. Returning securely to the local Social Engine…";
  relay.hidden = false;
  relay.addEventListener("click", goLocal);
  window.setTimeout(goLocal, 500);
})();
