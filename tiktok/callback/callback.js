(() => {
  "use strict";

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
    status.textContent = "No TikTok authorization response was supplied. Start connection from the local Social Engine.";
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
