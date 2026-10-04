/* Visitor measurement for public pages not already carrying the site's GA4 tag. */
(function () {
  'use strict';
  var measurementId = 'G-C0YHGXH33P';
  // Do not count localhost previews, embedded copies, or duplicate script loads.
  if (!/^(www\.)?michaelcostea\.com$/.test(window.location.hostname) ||
      window.self !== window.top || window.__mcVisitorAnalyticsLoaded) return;
  window.__mcVisitorAnalyticsLoaded = true;
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // Exclude URL query/hash contents; no form fields or personal identifiers added.
  var referrer = '';
  try {
    if (document.referrer) {
      var source = new URL(document.referrer);
      referrer = source.origin + source.pathname;
    }
  } catch (_) { /* An invalid referrer is omitted, not forwarded. */ }
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: referrer
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
}());
