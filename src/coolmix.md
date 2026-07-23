---
title: Cool Mix Flows
toc: false
---

<link rel="stylesheet" href="./styles/App.css">

```js
import {OVERRIDE_YEAR, RIVER_MILE} from "./config.js";
```

```js
const toF = c => c * 9 / 5 + 32;
```

```js
const raw = await FileAttachment("./data/RM15_water_temp.csv").text();
const parsed = d3.csvParse(raw, d => ({
  date: d3.timeParse("%Y-%m-%d")(d.date),
  tmp: d.tmp === "" ? null : toF(+d.tmp),
  cfs: d.cfs === "" ? null : +d.cfs
}));
```

```js
// Hand-maintained lookup (data/cool_mix_flows.csv) — on/off-ramp dates
// are operational decisions, not measured data, so they live separately
// from the R data loader. Blank onRamp/offRamp = Cool Mix did not run.
const coolMixRaw = await FileAttachment("./data/cool_mix_flows.csv").text();

// Date format flexibility
function parseFlexDate(s) {
  if (!s) return null;
  return d3.timeParse("%Y-%m-%d")(s) ?? d3.timeParse("%m/%d/%Y")(s);
}

const coolMix = d3.csvParse(coolMixRaw, d => ({
  year: +d.year,
  onRamp: parseFlexDate(d.onRamp),
  offRamp: parseFlexDate(d.offRamp),
  targetRM: d.targetRM ? +d.targetRM : null,
  costUSD: d.costUSD ? +d.costUSD : null,
}));
```

```js
// Only the years Cool Mix actually ran
const coolMixYears = coolMix
  .filter(d => d.onRamp && d.offRamp)
  .sort((a, b) => a.year - b.year);
```

```js
const threshold = toF(15.5);
const doyOf = d => d3.utcDay.count(d3.utcYear(d), d);
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
```

```js
// Fixed color per Cool Mix year
const palette = ["#3987e5", "#e34948", "#1baf7a", "#9085e9"];
const yearColors = Object.fromEntries(coolMixYears.map((d, i) => [d.year, palette[i % palette.length]]));
```

```js
const tempByYear = coolMixYears.map(({year}) => ({
  year,
  rows: parsed
    .filter(d => d.date && d.date.getFullYear() === year && d.tmp !== null)
    .map(d => ({...d, doy: doyOf(d.date)}))
}));

const bandData = coolMixYears.map(d => ({
  year: d.year,
  x1: doyOf(d.onRamp),
  x2: doyOf(d.offRamp),
}));
```

```js
const currentYear = OVERRIDE_YEAR ?? d3.max(parsed.filter(d => d.date).map(d => d.date.getFullYear()));
const logo = await FileAttachment("assets/LOGO.png").url();

display(htl.html`
<header class="site-header">
  <img src="${logo}" alt="Grand Canyon Trust" class="site-logo">
  <nav class="site-nav">
    <a href="./">Overview</a>
    <a href="./season">${currentYear} Season</a>
    <a href="./cool-mix" aria-current="page">Cool Mix Flows</a>
  </nav>
</header>
`);
```

```js
display(htl.html`<div class="hero">
  <div class="hero-bg"></div>
  <p class="hero-eyebrow">Colorado River Mile ${RIVER_MILE} · Grand Canyon National Park</p>
  <h1 class="hero-title">Cool Mix Flows</h1>
  <p class="hero-sub">Placeholder edit blah blah</p>
</div>`);
```

<p class="last-updated">
[Intro placeholder — Jen's blurb here.] Cool Mix flows release cold water from deep in Lake Powell
through Glen Canyon Dam's bypass tubes, cooling the river below 15.5°C (59.9°F) — too cold for invasive
smallmouth bass to spawn. The shaded band in each line below marks the actual dates Cool Mix was active
that year.
</p>

```js
const chartPlot = resize((width) => Plot.plot({
  width,
  height: 480,
  marginLeft: 60,
  marginBottom: 45,
  style: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: "16px",
    background: "transparent",
  },
  x: {
    domain: [0, 365],
    ticks: monthStarts,
    tickFormat: doy => {
      const i = monthStarts.indexOf(doy);
      return i >= 0 ? monthNames[i] : null;
    },
    label: null,
  },
  y: {
    label: "Water temperature (°F)",
    domain: [toF(7), toF(22)],
  },
  marks: [
    // Cool Mix window, one band per year, colored to match that year's line
    ...bandData.map(d => Plot.rectY([d], {
      x1: "x1", x2: "x2", y1: toF(7), y2: toF(22),
      fill: yearColors[d.year], fillOpacity: 0.10,
    })),
    Plot.ruleY([threshold], {
      stroke: "#B03823", strokeDasharray: "4 2", strokeWidth: 1.2,
    }),
    Plot.text([{}], {
      x: 364, y: threshold, text: () => `${threshold.toFixed(1)}°F threshold`,
      dy: -8, textAnchor: "end", fontSize: 13, fontWeight: 500, fill: "#B03823",
    }),
    ...tempByYear.map(({year, rows}) => Plot.line(rows, {
      x: "doy", y: "tmp",
      stroke: yearColors[year], strokeWidth: 2.5,
    })),
    Plot.tip(
      tempByYear.flatMap(({year, rows}) => rows.map(d => ({...d, year}))),
      Plot.pointerX({
        x: "doy", y: "tmp",
        title: d => `${d.year} — ${d.date.toLocaleDateString("en-US", {month: "short", day: "numeric"})}\n${d.tmp.toFixed(1)}°F`,
      })
    ),
  ],
}));
display(htl.html`<div class="chart-card">${chartPlot}</div>`);
```

```js
const legendEl = htl.html`<div class="legend">
  <div class="legend-items">
    ${coolMixYears.map(d => htl.html`<div class="legend-item">
      <svg width="32" height="12">
        <line x1="0" y1="6" x2="32" y2="6" stroke="${yearColors[d.year]}" stroke-width="2.5" />
      </svg>
      <span>${d.year} (Cool Mix active ${d.onRamp.toLocaleDateString("en-US", {month: "short", day: "numeric"})}–${d.offRamp.toLocaleDateString("en-US", {month: "short", day: "numeric"})})</span>
    </div>`)}
    <div class="legend-item">
      <svg width="32" height="12">
        <line x1="0" y1="6" x2="32" y2="6" stroke="#B03823" stroke-width="1.5" stroke-dasharray="4,2"/>
      </svg>
      <span>${threshold.toFixed(1)}°F Threshold</span>
    </div>
  </div>
</div>`;
display(legendEl);
```

```js
// ── Compact reference table ────────────────────────────────────────
display(htl.html`<div class="section-card section-card--table">
  <div class="section-card-header">
    <h2 class="section-card-title">Cool Mix Reference</h2>
  </div>
  <div class="recent-table-scroll">
  <table class="recent-table">
    <thead>
      <tr><th>Year</th><th>On-Ramp</th><th>Off-Ramp</th><th>Duration</th><th>Target RM</th><th>Cost</th></tr>
    </thead>
    <tbody>
      ${coolMixYears.slice().reverse().map(d => htl.html`<tr>
        <td>${d.year}</td>
        <td>${d.onRamp.toLocaleDateString("en-US", {month: "short", day: "numeric"})}</td>
        <td>${d.offRamp.toLocaleDateString("en-US", {month: "short", day: "numeric"})}</td>
        <td>${d3.timeDay.count(d.onRamp, d.offRamp)} days</td>
        <td>${d.targetRM}</td>
        <td>${d.costUSD ? d3.format("$,.2s")(d.costUSD) : "—"}</td>
      </tr>`)}
    </tbody>
  </table>
  </div>
</div>`);
```

```js
display(htl.html`
  <footer class="site-footer">
    <p class="site-footer-citation">
      Observations from
        <a href="https://waterdata.usgs.gov/monitoring-location/USGS-09380000" target="_blank" rel="noopener noreferrer">USGS Gage 09380000</a>
        · Temperature estimates based on
        <a href="https://doi.org/10.1002/eap.2279" target="_blank" rel="noopener noreferrer">Dibble et al. (2020)</a>
        thermal model · PLACEHOLDER DATA CITATION FOR COOLMIX FLOWS.
    </p>
    <p class="site-footer-credit">
      Graphs may be used for non-commercial purposes provided that they are not altered or edited and are appropriately credited to the Grand Canyon Trust.
    </p>
  </footer>
`);
```