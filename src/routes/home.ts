import { Router } from "express";

export const homeRouter = Router();

// Professional landing page for the URL shortener — a portfolio-ready showcase
// with a working shortener, feature highlights, and the engineering stack.
// Self-contained (no external assets) so it renders anywhere, light or dark.
const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Shortly — URL Shortener by Shubhanjali</title>
  <meta name="description" content="A fast, production-grade URL shortener built with Node.js, TypeScript, Postgres, Redis, Docker and AWS." />
  <style>
    /* Light (default) */
    :root {
      color-scheme: light;
      --bg: #ffffff; --surface: #f7f8fc; --card: #ffffff;
      --text: #14142b; --muted: #6b7280; --border: #e6e8f0;
      --accent: #6366f1; --accent-2: #8b5cf6; --accent-hover: #4f46e5;
      --accent-soft: rgba(99,102,241,.10); --ok: #16a34a;
      --shadow: 0 1px 2px rgba(20,20,43,.04), 0 12px 32px rgba(20,20,43,.06);
    }
    /* Dark values (shared by manual toggle + OS preference) */
    :root[data-theme="dark"] {
      color-scheme: dark;
      --bg: #0b0e14; --surface: #0f131b; --card: #151a23;
      --text: #e6edf3; --muted: #8b949e; --border: #262c38;
      --accent: #818cf8; --accent-2: #a78bfa; --accent-hover: #6366f1;
      --accent-soft: rgba(129,140,248,.14); --ok: #4ade80;
      --shadow: 0 1px 2px rgba(0,0,0,.5), 0 12px 32px rgba(0,0,0,.35);
    }
    /* Follow the OS only when the user hasn't picked a theme manually */
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme]) {
        color-scheme: dark;
        --bg: #0b0e14; --surface: #0f131b; --card: #151a23;
        --text: #e6edf3; --muted: #8b949e; --border: #262c38;
        --accent: #818cf8; --accent-2: #a78bfa; --accent-hover: #6366f1;
        --accent-soft: rgba(129,140,248,.14); --ok: #4ade80;
        --shadow: 0 1px 2px rgba(0,0,0,.5), 0 12px 32px rgba(0,0,0,.35);
      }
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0; color: var(--text); background: var(--bg);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6; -webkit-font-smoothing: antialiased;
    }
    a { color: var(--accent); text-decoration: none; }
    .wrap { max-width: 960px; margin: 0 auto; padding: 0 1.25rem; }

    /* Nav */
    nav { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 1.1rem 0; }
    .brand { display: flex; align-items: center; gap: .55rem; font-weight: 700; font-size: 1.15rem; letter-spacing: -.02em; }
    .brand .logo { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
      background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff; font-size: 1rem; }
    .nav-links { display: flex; gap: 1.4rem; font-size: .92rem; justify-self: center; align-items: center; }
    .nav-links > a, .nav-item > a { color: var(--muted); cursor: pointer; }
    .nav-links > a:hover, .nav-item > a:hover { color: var(--text); }
    .nav-item { position: relative; }
    .nav-item > a { display: inline-flex; align-items: center; gap: .25rem; }
    .nav-item .caret { font-size: .7rem; transition: transform .18s; }
    .nav-item:hover .caret { transform: rotate(180deg); }

    /* Hover mega-menu */
    .mega { position: absolute; top: 100%; left: 50%; padding-top: 14px; z-index: 60;
      opacity: 0; visibility: hidden; transform: translateX(-50%) translateY(-6px);
      transition: opacity .18s ease, transform .18s ease; }
    .nav-item:hover .mega { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
    .mega-inner { background: var(--card); border: 1px solid var(--border); border-radius: 16px;
      box-shadow: var(--shadow); padding: 1rem; width: min(720px, 92vw); }
    .mega-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .25rem; }
    .mega-card { display: flex; gap: .8rem; align-items: flex-start; padding: .75rem .85rem;
      border-radius: 12px; text-decoration: none; transition: background .12s; }
    .mega-card:hover { background: var(--accent-soft); }
    .mega-ic { flex: 0 0 auto; width: 38px; height: 38px; border-radius: 10px; display: grid;
      place-items: center; background: var(--accent-soft); font-size: 1.1rem; }
    .mega-card b { display: block; color: var(--text); font-size: .95rem; }
    .mega-card p { margin: .15rem 0 0; color: var(--muted); font-size: .83rem; line-height: 1.45; }
    .theme-btn { justify-self: end; background: var(--card); border: 1px solid var(--border); color: var(--text);
      width: 38px; height: 38px; border-radius: 10px; cursor: pointer; font-size: 1.05rem; line-height: 1;
      display: grid; place-items: center; transition: border-color .15s, transform .12s; }
    .theme-btn:hover { border-color: var(--accent); }
    .theme-btn:active { transform: scale(.92); }
    @media (max-width: 560px) { .nav-links { display: none; } }

    /* Hero */
    .hero { text-align: center; padding: 3.5rem 0 2rem; }
    .pill { display: inline-block; font-size: .8rem; font-weight: 600; color: var(--accent);
      background: var(--accent-soft); padding: .3rem .8rem; border-radius: 999px; margin-bottom: 1.2rem; }
    h1 { font-size: clamp(1.7rem, 4.8vw, 2.6rem); line-height: 1.12; letter-spacing: -.03em; margin: 0 0 .9rem; white-space: nowrap; }
    h1 .grad { background: linear-gradient(135deg, var(--accent), var(--accent-2));
      -webkit-background-clip: text; background-clip: text; color: transparent; }
    .lede { color: var(--muted); font-size: 1rem; margin: 0 auto 2rem; white-space: nowrap; }
    /* Allow the hero text to wrap on smaller screens so it never overflows */
    @media (max-width: 760px) {
      h1 { white-space: normal; }
      .lede { white-space: normal; max-width: 32rem; }
    }

    /* Shortener card */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px;
      box-shadow: var(--shadow); padding: 1.5rem; }
    .shortener { max-width: 620px; margin: 0 auto; text-align: left; }
    .field { margin-bottom: 1rem; }
    .field:last-of-type { margin-bottom: 1.25rem; }
    label { display: block; font-weight: 600; font-size: .9rem; margin-bottom: .4rem; }
    label .hint { font-weight: 400; color: var(--muted); font-size: .82rem; }
    input { width: 100%; padding: .7rem .85rem; font-size: 1rem; color: var(--text);
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px; transition: border-color .15s, box-shadow .15s; }
    input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
      padding: .75rem 1.5rem; font-size: 1rem; font-weight: 600; border: 0; border-radius: 10px;
      background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff; cursor: pointer;
      width: 100%; transition: transform .12s, opacity .15s; }
    .btn:hover { opacity: .93; }
    .btn:active { transform: translateY(1px); }
    .btn:disabled { opacity: .6; cursor: default; }

    /* Result */
    #out { margin-top: 1.1rem; display: none; }
    #out.show { display: block; }
    .result { display: flex; gap: .5rem; align-items: stretch; flex-wrap: wrap; }
    .result input { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: .95rem; flex: 1 1 14rem; }
    .result .btn-sm { flex: 0 0 auto; width: auto; padding: .6rem 1rem; font-size: .9rem; border-radius: 10px; cursor: pointer;
      border: 1px solid var(--border); background: var(--surface); color: var(--text); font-weight: 600; }
    .result .btn-sm:hover { border-color: var(--accent); color: var(--accent); }
    .result .open { display: inline-flex; align-items: center; }
    .err { color: #ef4444; font-size: .92rem; padding: .6rem 0; }
    .qr-wrap { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .qr { flex: 0 0 auto; width: 120px; height: 120px; border-radius: 10px; background: #fff; padding: 6px; border: 1px solid var(--border); }
    .qr-side { display: flex; flex-direction: column; gap: .6rem; align-items: flex-start; }
    .qr-hint { margin: 0; color: var(--muted); font-size: .9rem; }

    /* Sections */
    section { padding: 3rem 0; }
    .section-title { text-align: center; font-size: 1.7rem; letter-spacing: -.02em; margin: 0 0 .4rem; }
    .section-sub { text-align: center; color: var(--muted); margin: 0 0 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .feature { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 1.3rem; }
    .feature .ic { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
      background: var(--accent-soft); font-size: 1.2rem; margin-bottom: .8rem; }
    .feature h3 { margin: 0 0 .35rem; font-size: 1.05rem; }
    .feature p { margin: 0; color: var(--muted); font-size: .92rem; }

    /* Tech stack */
    .stack { display: flex; flex-wrap: wrap; gap: .6rem; justify-content: center; max-width: 640px; margin: 0 auto; }
    .chip { font-size: .88rem; font-weight: 600; padding: .5rem 1rem; border-radius: 999px;
      background: var(--card); border: 1px solid var(--border); color: var(--text); }
    .chip span { color: var(--accent); }

    /* Flow */
    .flow { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: .5rem; color: var(--muted); font-size: .95rem; }
    .flow b { color: var(--text); }
    .flow .arrow { color: var(--accent); font-weight: 700; }

    /* Architecture diagram */
    .arch { padding: 1.75rem 1.5rem; }
    .arch svg { width: 100%; height: auto; display: block; }
    .arch .box { fill: var(--surface); stroke: var(--border); stroke-width: 1.5; }
    .arch .box-accent { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1.5; }
    .arch .lbl { fill: var(--text); font: 600 15px system-ui, sans-serif; }
    .arch .sub { fill: var(--muted); font: 400 11.5px system-ui, sans-serif; }
    .arch .edge { stroke: var(--accent); stroke-width: 2; fill: none; }
    .arch .edge-lbl { fill: var(--muted); font: 600 11px system-ui, sans-serif; }
    .arch .arrowhead { fill: var(--accent); }
    .arch-legend { margin-top: 1.4rem; display: grid; gap: .7rem; font-size: .93rem; color: var(--muted); }
    .arch-legend b { color: var(--text); }
    .arch-legend .step { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 6px;
      font-size: .78rem; font-weight: 700; color: #fff; margin-right: .55rem; vertical-align: middle; }
    .arch-legend .w { background: var(--accent-2); }
    .arch-legend .r { background: var(--accent); }

    /* API */
    .api { max-width: 620px; margin: 1.5rem auto 0; }
    .api code { display: block; font-family: ui-monospace, Menlo, monospace; font-size: .88rem;
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: .6rem .8rem; margin-bottom: .5rem; }
    .api .m { color: var(--accent); font-weight: 700; }

    /* Footer */
    footer { border-top: 1px solid var(--border); padding: 2rem 0 3rem; text-align: center; color: var(--muted); font-size: .92rem; }
    footer a { font-weight: 600; }
    footer .made { margin-bottom: .4rem; }
  </style>
  <script>
    // Apply the saved theme before first paint so there's no flash of the wrong theme.
    (function () { var t = localStorage.getItem('theme'); if (t) document.documentElement.setAttribute('data-theme', t); })();
  </script>
</head>
<body>
  <div class="wrap">
    <nav>
      <div class="brand"><span class="logo">S</span> Shortly</div>
      <div class="nav-links">
        <div class="nav-item">
          <a href="#features">Features <span class="caret">&#9662;</span></a>
          <div class="mega">
            <div class="mega-inner">
              <div class="mega-grid">
                <a class="mega-card" href="#features"><span class="mega-ic">⚡</span><div><b>Fast redirects</b><p>Redis-cached hot path for sub-100ms redirects.</p></div></a>
                <a class="mega-card" href="#features"><span class="mega-ic">✏️</span><div><b>Custom aliases</b><p>Branded short codes with guaranteed uniqueness.</p></div></a>
                <a class="mega-card" href="#features"><span class="mega-ic">⏳</span><div><b>Link expiry</b><p>TTL links that return 410 once expired.</p></div></a>
                <a class="mega-card" href="#features"><span class="mega-ic">🛡️</span><div><b>Rate limiting</b><p>Per-IP fixed-window limits to block abuse.</p></div></a>
                <a class="mega-card" href="#features"><span class="mega-ic">🔒</span><div><b>Unguessable codes</b><p>Random Base62 codes — not enumerable.</p></div></a>
                <a class="mega-card" href="#features"><span class="mega-ic">☁️</span><div><b>Cloud-native</b><p>Docker image on AWS EC2, served over HTTPS.</p></div></a>
                <a class="mega-card" href="#features"><span class="mega-ic">🔳</span><div><b>QR codes</b><p>A scannable, downloadable QR for every short link.</p></div></a>
              </div>
            </div>
          </div>
        </div>
        <a href="#how">How it works</a>
        <a href="#stack">Tech</a>
        <a href="#api">API</a>
      </div>
      <button id="themeToggle" class="theme-btn" type="button" aria-label="Toggle light or dark theme" title="Toggle theme">🌙</button>
    </nav>

    <header class="hero">
      <span class="pill">Production-grade &middot; Node.js &middot; AWS</span>
      <h1>Shorten links, <span class="grad">serve them fast.</span></h1>
      <p class="lede">Custom aliases, link expiry, Redis caching, QR codes &amp; rate limiting — deployed on AWS.</p>

      <div class="card shortener">
        <form id="f">
          <div class="field">
            <label for="url">Long URL <span class="hint">— must start with http:// or https://</span></label>
            <input id="url" type="url" placeholder="https://example.com/a/very/long/path?ref=123" required />
          </div>
          <div class="field">
            <label for="alias">Custom alias <span class="hint">— optional, 3–10 chars (a–z, 0–9, - _)</span></label>
            <input id="alias" type="text" placeholder="my-brand" pattern="[A-Za-z0-9_-]{3,10}" />
          </div>
          <button class="btn" type="submit" id="submitBtn">Shorten URL</button>
        </form>
        <div id="out"></div>
      </div>
    </header>

    <section id="features">
      <h2 class="section-title">Built for the real world</h2>
      <p class="section-sub">The features you'd expect from a service that runs at scale.</p>
      <div class="grid">
        <div class="feature"><div class="ic">⚡</div><h3>Fast redirects</h3><p>Hot lookups served from a Redis cache, falling back to Postgres — sub-100ms redirects.</p></div>
        <div class="feature"><div class="ic">✏️</div><h3>Custom aliases</h3><p>Claim branded short codes like <em>/my-brand</em>, with database-guaranteed uniqueness.</p></div>
        <div class="feature"><div class="ic">⏳</div><h3>Link expiry</h3><p>Set a TTL on any link; expired links return <em>410 Gone</em> instead of redirecting.</p></div>
        <div class="feature"><div class="ic">🛡️</div><h3>Rate limiting</h3><p>Per-IP fixed-window limits (Redis-backed) stop bots from flooding the create endpoint.</p></div>
        <div class="feature"><div class="ic">🔒</div><h3>Unguessable codes</h3><p>Random Base62 codes — not sequential — so links can't be enumerated.</p></div>
        <div class="feature"><div class="ic">☁️</div><h3>Cloud-native</h3><p>Containerized with Docker, image in AWS ECR, running 24/7 on EC2 over HTTPS.</p></div>
        <div class="feature"><div class="ic">🔳</div><h3>QR codes</h3><p>Every short link comes with a scannable QR code you can download and share.</p></div>
      </div>
    </section>

    <section id="how">
      <h2 class="section-title">How it works</h2>
      <p class="section-sub">A read-optimized design — every redirect checks the cache before the database.</p>
      <div class="card arch">
        <svg viewBox="0 0 780 330" role="img" aria-label="System architecture diagram">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" class="arrowhead" />
            </marker>
          </defs>

          <!-- top row -->
          <rect class="box" x="26" y="46" width="150" height="70" rx="12" />
          <text class="lbl" x="101" y="78" text-anchor="middle">Browser</text>
          <text class="sub" x="101" y="97" text-anchor="middle">user / API client</text>

          <rect class="box" x="250" y="46" width="150" height="70" rx="12" />
          <text class="lbl" x="325" y="78" text-anchor="middle">Cloudflare</text>
          <text class="sub" x="325" y="97" text-anchor="middle">TLS / HTTPS</text>

          <rect class="box box-accent" x="474" y="40" width="200" height="82" rx="12" />
          <text class="lbl" x="574" y="72" text-anchor="middle">Express API</text>
          <text class="sub" x="574" y="92" text-anchor="middle">Docker on AWS EC2</text>

          <!-- bottom row -->
          <rect class="box" x="384" y="238" width="160" height="70" rx="12" />
          <text class="lbl" x="464" y="270" text-anchor="middle">Redis</text>
          <text class="sub" x="464" y="289" text-anchor="middle">cache &middot; hot path</text>

          <rect class="box" x="600" y="238" width="164" height="70" rx="12" />
          <text class="lbl" x="682" y="270" text-anchor="middle">PostgreSQL</text>
          <text class="sub" x="682" y="289" text-anchor="middle">code &rarr; URL store</text>

          <!-- edges -->
          <line class="edge" x1="176" y1="81" x2="246" y2="81" marker-end="url(#arrow)" />
          <text class="edge-lbl" x="211" y="72" text-anchor="middle">HTTPS</text>
          <line class="edge" x1="400" y1="81" x2="470" y2="81" marker-end="url(#arrow)" />

          <path class="edge" d="M528,122 C500,175 472,200 466,234" marker-end="url(#arrow)" />
          <text class="edge-lbl" x="420" y="185" text-anchor="middle">cache</text>

          <path class="edge" d="M624,122 C662,175 678,200 682,234" marker-end="url(#arrow)" />
          <text class="edge-lbl" x="726" y="185" text-anchor="middle">database</text>
        </svg>

        <div class="arch-legend">
          <div><span class="step w">S</span><b>Shorten</b> — validate the URL, generate a random Base62 code, and store the mapping in PostgreSQL (a unique constraint guarantees no collisions).</div>
          <div><span class="step r">R</span><b>Redirect</b> — check Redis first; on a cache miss, load from PostgreSQL, populate the cache, then redirect to the long URL.</div>
        </div>
      </div>
    </section>

    <section id="stack" style="background:var(--surface); border-radius:20px;">
      <h2 class="section-title">Under the hood</h2>
      <p class="section-sub">Designed from a system-design spec, then built and shipped.</p>
      <div class="stack">
        <div class="chip"><span>■</span> TypeScript</div>
        <div class="chip"><span>■</span> Node.js</div>
        <div class="chip"><span>■</span> Express</div>
        <div class="chip"><span>■</span> PostgreSQL</div>
        <div class="chip"><span>■</span> Redis</div>
        <div class="chip"><span>■</span> Prisma</div>
        <div class="chip"><span>■</span> Zod</div>
        <div class="chip"><span>■</span> Docker</div>
        <div class="chip"><span>■</span> Kubernetes</div>
        <div class="chip"><span>■</span> AWS (ECR / EC2)</div>
        <div class="chip"><span>■</span> Vitest</div>
      </div>
      <div class="flow" style="margin-top:2rem;">
        <b>Browser</b> <span class="arrow">&rarr;</span> <b>Express API</b> <span class="arrow">&rarr;</span> <b>Redis cache</b> <span class="arrow">&rarr;</span> <b>PostgreSQL</b>
      </div>
    </section>

    <section id="api">
      <h2 class="section-title">Clean REST API</h2>
      <p class="section-sub">Everything the UI does is available programmatically.</p>
      <div class="api">
        <code><span class="m">POST</span> /api/v1/urls &nbsp; — create a short URL (JSON body)</code>
        <code><span class="m">GET</span> &nbsp;/{short_code} &nbsp; — redirect to the original URL</code>
        <code><span class="m">GET</span> &nbsp;/health &nbsp; — service health check</code>
      </div>
    </section>
  </div>

  <footer>
    <div class="wrap">
      <p class="made">Designed &amp; built by <strong>Shubhanjali</strong></p>
      <p>
        <a href="mailto:shubhanjali32@gmail.com">Email</a> &nbsp;&middot;&nbsp;
        <!-- TODO: replace with your real GitHub/LinkedIn URLs -->
        <a href="https://github.com/" target="_blank" rel="noopener">GitHub</a> &nbsp;&middot;&nbsp;
        <a href="https://linkedin.com/" target="_blank" rel="noopener">LinkedIn</a>
      </p>
    </div>
  </footer>

  <script>
    // Theme toggle — remembers the choice, otherwise follows the OS preference.
    (function () {
      var root = document.documentElement;
      var btn = document.getElementById('themeToggle');
      function current() {
        return root.getAttribute('data-theme') ||
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
      function updateIcon() { btn.textContent = current() === 'dark' ? '☀️' : '🌙'; }
      updateIcon();
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateIcon();
      });
    })();

    var f = document.getElementById('f');
    var out = document.getElementById('out');
    var submitBtn = document.getElementById('submitBtn');

    function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    window.copyLink = function(url, btn) {
      navigator.clipboard.writeText(url).then(function () {
        var prev = btn.textContent; btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = prev; }, 1500);
      });
    };

    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      out.className = 'show';
      out.innerHTML = '<p style="color:var(--muted)">Shortening…</p>';
      submitBtn.disabled = true;
      var body = { long_url: document.getElementById('url').value };
      var alias = document.getElementById('alias').value.trim();
      if (alias) body.custom_alias = alias;
      try {
        var res = await fetch('/api/v1/urls', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        });
        var data = await res.json();
        if (res.ok) {
          var u = esc(data.short_url);
          var qr = '/api/v1/urls/' + encodeURIComponent(data.short_code) + '/qr';
          out.innerHTML =
            '<div class="result">' +
              '<input readonly value="' + u + '" onclick="this.select()" />' +
              '<button class="btn-sm" onclick="copyLink(\\'' + u + '\\', this)">Copy</button>' +
              '<a class="btn-sm open" href="' + u + '" target="_blank" rel="noopener">Open &#8599;</a>' +
            '</div>' +
            '<div class="qr-wrap">' +
              '<img class="qr" src="' + qr + '" alt="QR code for the short link" width="150" height="150" />' +
              '<div class="qr-side">' +
                '<p class="qr-hint">Scan with a phone camera to open this link.</p>' +
                '<a class="btn-sm" href="' + qr + '" download="qr-' + esc(data.short_code) + '.png">Download PNG</a>' +
              '</div>' +
            '</div>';
        } else {
          var msg = 'Error ' + res.status + ': ' + (data.error || 'request failed');
          if (Array.isArray(data.details) && data.details.length) msg += ' — ' + data.details.join('; ');
          out.innerHTML = '<p class="err">' + esc(msg) + '</p>';
        }
      } catch (err) {
        out.innerHTML = '<p class="err">Request failed: ' + esc(err) + '</p>';
      } finally {
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`;

homeRouter.get("/", (_req, res) => {
  res.type("html").send(PAGE);
});
