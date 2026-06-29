#!/usr/bin/env node
// Fetches GitHub + GitLab contribution calendars and merges them into a single
// year-long heatmap dataset written to _data/contributions.json.
//
// GitHub: GitHub GraphQL when GITHUB_TOKEN is set (CI), otherwise the keyless,
//         CORS-enabled jogruber API (local dev). GitLab: public calendar.json.
//
// Run: node scripts/build-contributions.mjs  (no key needed locally)

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GH_USER = process.env.GH_USER || 'NickBourque';
const GL_USER = process.env.GL_USER || 'nickabourque';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', '_data', 'contributions.json');

const WEEKS = 53;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Treat every date as a UTC calendar day keyed by YYYY-MM-DD.
const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

async function fetchGithub(user) {
  if (TOKEN) {
    const query = `query($login:String!){ user(login:$login){ contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }`;
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'contributions-builder',
      },
      body: JSON.stringify({ query, variables: { login: user } }),
    });
    if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GitHub GraphQL: ${JSON.stringify(json.errors)}`);
    const map = {};
    for (const week of json.data.user.contributionsCollection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) map[day.date] = day.contributionCount;
    }
    return map;
  }
  // Keyless fallback for local runs.
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`, {
    headers: { 'User-Agent': 'contributions-builder' },
  });
  if (!res.ok) throw new Error(`jogruber API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const map = {};
  for (const c of json.contributions || []) map[c.date] = c.count;
  return map;
}

async function fetchGitlab(user) {
  const res = await fetch(`https://gitlab.com/users/${user}/calendar.json`, {
    headers: { 'User-Agent': 'contributions-builder', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GitLab calendar ${res.status}: ${await res.text()}`);
  return await res.json(); // already { "YYYY-MM-DD": count }
}

function bucket(total, max) {
  if (total <= 0) return 0;
  if (max <= 0) return 1;
  return Math.min(4, Math.max(1, Math.ceil((total / max) * 4)));
}

function build(ghMap, glMap) {
  const today = new Date(isoDay(new Date()) + 'T00:00:00Z');
  const dow = today.getUTCDay(); // 0 = Sunday
  const lastSaturday = addDays(today, 6 - dow);
  const firstSunday = addDays(lastSaturday, -(WEEKS * 7 - 1));
  const todayKey = isoDay(today);

  let totalGh = 0;
  let totalGl = 0;
  let max = 0;
  const weeks = [];
  let prevMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    let weekGh = 0;
    let weekGl = 0;
    let monthLabel = '';
    let weekStart = '';
    for (let i = 0; i < 7; i++) {
      const date = addDays(firstSunday, w * 7 + i);
      const key = isoDay(date);
      if (i === 0) {
        weekStart = key;
        const m = date.getUTCMonth();
        if (m !== prevMonth) {
          // Skip the leading partial month so its label doesn't collide with the next.
          if (w > 0) monthLabel = SHORT_MONTHS[m];
          prevMonth = m;
        }
      }
      if (key > todayKey) continue; // future days contribute nothing
      weekGh += ghMap[key] || 0;
      weekGl += glMap[key] || 0;
    }
    const total = weekGh + weekGl;
    totalGh += weekGh;
    totalGl += weekGl;
    if (total > max) max = total;
    weeks.push({ weekStart, monthLabel, gh: weekGh, gl: weekGl, total });
  }

  // Levels need the final (weekly) max, so assign in a second pass.
  for (const week of weeks) {
    week.level = bucket(week.total, max);
  }

  return {
    generated: todayKey,
    totals: { github: totalGh, gitlab: totalGl, combined: totalGh + totalGl },
    max,
    weeks,
  };
}

async function main() {
  const [ghMap, glMap] = await Promise.all([
    fetchGithub(GH_USER).catch((e) => {
      console.error(`GitHub fetch failed: ${e.message}`);
      return {};
    }),
    fetchGitlab(GL_USER).catch((e) => {
      console.error(`GitLab fetch failed: ${e.message}`);
      return {};
    }),
  ]);

  const data = build(ghMap, glMap);
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(
    `Wrote ${OUT} — GitHub ${data.totals.github}, GitLab ${data.totals.gitlab}, combined ${data.totals.combined} (max/day ${data.max}).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
