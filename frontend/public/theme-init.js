// Theme bootstrap — runs before first paint (loaded synchronously in <head>).
// Lives as a real file, not an inline script, so the CSP (script-src 'self')
// allows it without hash maintenance.
(function () {
  try {
    var t = localStorage.getItem('link2pay-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.classList.add(t);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
