#!/usr/bin/env node
// Sjekker e-post-DNS for et domene (standard: scandijapandi.no) via dns.google.
// Ingen avhengigheter, Node 18+. Se docs/EMAIL.md.
// Bruk: node scripts/check-mail-dns.mjs [domene]
// Exit 1 hvis rot-MX mangler (eller DNS-oppslag feiler).

const domain = (process.argv[2] || "scandijapandi.no").trim().toLowerCase();

const TYPES = { MX: 15, TXT: 16 };

async function lookup(name, type) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name} ${type}`);
  const json = await res.json();
  return (json.Answer || [])
    .filter((a) => a.type === TYPES[type])
    .map((a) => (type === "TXT" ? a.data.replace(/"\s*"/g, "").replace(/^"|"$/g, "") : a.data));
}

const checks = [
  { label: "Rot MX", name: domain, type: "MX", required: true },
  { label: "Rot SPF (TXT)", name: domain, type: "TXT", match: (v) => v.startsWith("v=spf1") },
  { label: "DMARC (_dmarc)", name: `_dmarc.${domain}`, type: "TXT", match: (v) => v.startsWith("v=DMARC1") },
  { label: "DKIM (resend._domainkey)", name: `resend._domainkey.${domain}`, type: "TXT", match: (v) => v.includes("p=") },
  { label: "send.* MX", name: `send.${domain}`, type: "MX" },
  { label: "send.* SPF (TXT)", name: `send.${domain}`, type: "TXT", match: (v) => v.startsWith("v=spf1") },
];

let rootMxMissing = false;
let failed = false;
const rows = [];

for (const c of checks) {
  try {
    const values = (await lookup(c.name, c.type)).filter(c.match || (() => true));
    const ok = values.length > 0;
    if (c.required && !ok) rootMxMissing = true;
    rows.push([ok ? "OK" : "MISSING", c.label, c.name, ok ? values.join(" | ") : "-"]);
    if (c.label === "Rot SPF (TXT)" && values.length > 1) {
      rows.push(["WARN", "Flere SPF-records", c.name, "bare én SPF-record er tillatt"]);
    }
  } catch (err) {
    failed = true;
    rows.push(["ERROR", c.label, c.name, err.message]);
  }
}

// ImprovMX-videresending (valgt løsning, se docs/EMAIL.md)
try {
  const mx = await lookup(domain, "MX");
  const hosts = mx.map((v) => v.split(/\s+/).pop().replace(/\.$/, "").toLowerCase());
  const mxOk = ["mx1.improvmx.com", "mx2.improvmx.com"].every((h) => hosts.includes(h));
  rows.push([mxOk ? "OK" : "MISSING", "ImprovMX MX", domain, mxOk ? "mx1 + mx2.improvmx.com" : "forventer mx1/mx2.improvmx.com"]);
  const txt = (await lookup(domain, "TXT")).filter((v) => v.startsWith("v=spf1"));
  const spfOk = txt.some((v) => v.includes("include:spf.improvmx.com"));
  rows.push([spfOk ? "OK" : "MISSING", "ImprovMX SPF", domain, spfOk ? "include:spf.improvmx.com" : "forventer include:spf.improvmx.com"]);
} catch (err) {
  failed = true;
  rows.push(["ERROR", "ImprovMX", domain, err.message]);
}

const w = (i) => Math.max(...rows.map((r) => r[i].length));
console.log(`Mail-DNS for ${domain} (via dns.google)\n`);
for (const r of rows) {
  console.log(`${r[0].padEnd(7)} ${r[1].padEnd(w(1))}  ${r[2].padEnd(w(2))}  ${r[3]}`);
}

if (rootMxMissing) {
  console.log(`\nRot-MX mangler: e-post til @${domain} kan ikke leveres. Se docs/EMAIL.md.`);
}
process.exit(rootMxMissing || failed ? 1 : 0);
