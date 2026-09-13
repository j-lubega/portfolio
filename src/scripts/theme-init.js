/* Inline theme bootstrap. Runs in <head> before first paint; keep it tiny and dependency-free.
   Mirrors resolveTheme() in theme.ts: manual choice > OS dark > time of day (dark 19:00 to 06:59). */
(function () {
  var root = document.documentElement;
  function resolve() {
    var manual = null;
    try {
      manual = localStorage.getItem('jl-theme');
    } catch {
      /* storage unavailable */
    }
    if (manual === 'light' || manual === 'dark') return manual;
    if (matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    var h = new Date().getHours();
    return h >= 19 || h < 7 ? 'dark' : 'light';
  }
  function apply() {
    var t = resolve();
    root.setAttribute('data-theme', t);
    var c = t === 'dark' ? '#0b1220' : '#f7f8fa';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].content = c;
  }
  apply();
  document.addEventListener('astro:after-swap', apply);
})();
