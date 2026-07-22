// ── Shared season / site configuration ────────────────────────────
// Both index.md and season.md import `OVERRIDE_YEAR` and `RIVER_MILE`
// from here.
//
// OVERRIDE_YEAR: by default (null) each page auto-detects the current
// season as the newest year present in its own water-temperature data.
// Set OVERRIDE_YEAR to a specific year (e.g. 2027) only if you need to
// pin the site to a particular season regardless of what's in the data.
//
// RIVER_MILE: the river mile the site displays and describes (hero
// text, the SVG export header, and the exported chart's filename).
//
// NOTE: this is a *display* value for index.md/season.md. The actual
// river mile baked into the computed water temperatures themselves is
// set in the RM15_water_temp data loader
export const OVERRIDE_YEAR = null;
export const RIVER_MILE = 15;