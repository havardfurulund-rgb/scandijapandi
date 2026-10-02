# E-post for scandijapandi.no

> **REGEL:** `@scandijapandi.no`-adressene (hello@, makers@, privacy@, ordre@) skal
> **aldri** byttes til et annet domene (Havard, 02.10.2026). Virker de ikke, er det
> e-postoppsettet (DNS + mottakstjeneste) som må fikses, ikke adressene.
> (Byttet i #85 ble revertert i #86.) Se issue #87.

## Utgående e-post (fungerer)

| Del | Detaljer |
|---|---|
| Tjeneste | [Resend](https://resend.com), HTTP-API, se `netlify/lib/email.mts` (`sendEmail`, kaster aldri) |
| Nøkkel | `RESEND_API_KEY` (Netlify env) |
| Avsender | `EMAIL_FROM` = `ordre@scandijapandi.no` (fallback i kode: `onboarding@resend.dev`; `admin-send-newsletter` har fallback `ordre@scandijapandi.no`) |
| DKIM | TXT `resend._domainkey.scandijapandi.no` (verifisert) |
| Return-path | `send.scandijapandi.no`: MX `10 feedback-smtp.eu-west-1.amazonses.com` + TXT `v=spf1 include:amazonses.com ~all` (region eu-west-1) |
| Interne varsler | Netlify Forms (fast innboks satt i Netlify UI) |
| `SHOP_EMAIL` | Reply-to og intern mottaker. Verdien ligger kun i Netlify env. |

### Hvem sender hva

| Funksjon | Sender |
|---|---|
| `stripe-webhook` | butikkvarsel til `SHOP_EMAIL`, kundekvittering (no/en/ja, reply-to `SHOP_EMAIL`), produsentvarsel til produktets `producer_email` |
| `producer-weekly-report`, `admin-send-producer-report` | ukentlig rapport til produsenter (reply-to `SHOP_EMAIL`) |
| `admin-weekly-report` | adminrapport til `SHOP_EMAIL` |
| `maker-release` | avtalekopi til produsent og til `SHOP_EMAIL` |
| `circle-welcome` | velkomstmelding til Private Circle |
| `admin-send-press` | pressemelding (reply-to `SHOP_EMAIL`) |
| `admin-send-newsletter` | nyhetsbrev |
| `admin-test-email` | testmelding fra admin |

Svar fra kunder og produsenter går til `ordre@`/`hello@`/`SHOP_EMAIL`, og det er
her mottak mangler.

## Innkommende e-post (mangler)

Adresser i bruk på siden/i koden:

| Adresse | Antall | Brukes til |
|---|---|---|
| `hello@scandijapandi.no` | 24 | terms, shipping, order-confirmed, /kitanote, admin-maler, ukentlige rapporter, release-feil |
| `privacy@scandijapandi.no` | 4 | /privacy |
| `makers@scandijapandi.no` | 1 | /makers |
| `ordre@scandijapandi.no` | 2 | Resend-avsender, svar går hit |

### Dagens status (DNS-funn 02.10.2026)

- Registrar: Domeneshop. DNS hostes hos Netlify DNS (NS1, `dns1–4.p04.nsone.net`);
  navnetjenerne ble flyttet 21.04.2026.
- Rot `scandijapandi.no`: **ingen MX**, ingen SPF, ingen `_dmarc`. Ingen server tar
  imot post, så avsendere får bounce.
- Mulig årsak: en videresending hos Domeneshop sluttet å virke da NS ble flyttet
  uten at MX ble lagt inn i Netlify DNS (kan bare bekreftes i Domeneshop-kundeområdet).

### Alternativer (Havard velger; ingen leverandør er valgt i koden)

Records legges i Netlify DNS på roten (`@`).

| | Tjeneste | DNS | Ellers |
|---|---|---|---|
| A | Domeneshop e-post/videresending | `MX @ 10 mx.domeneshop.no`<br>`TXT @ "v=spf1 include:_spf.domeneshop.no ~all"` | Opprett videresendinger i Domeneshop-kundeområdet. Krever e-post-/webhotellprodukt. |
| B | Resend Receiving | `MX @ 10 inbound-smtp.eu-west-1.amazonaws.com` (eksakt verdi: Resend → Domains → scandijapandi.no → Receiving) | Slå på Receiving og lag `email.received`-webhook; krever en funksjon i repoet som videresender. Ingen egen innboks. |
| C | ImprovMX (gratis videresending) | `MX @ 10 mx1.improvmx.com`<br>`MX @ 20 mx2.improvmx.com`<br>`TXT @ "v=spf1 include:spf.improvmx.com ~all"` | Konto på improvmx.com, aliaser til ønsket innboks. |
| D | Google Workspace (innbokser, betalt) | `MX @ 1 smtp.google.com`<br>`TXT @ "v=spf1 include:_spf.google.com ~all"` + DKIM fra Admin Console | Workspace-konto og brukere/aliaser. |

For alle: legg til DMARC når mottak virker:

```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:hello@scandijapandi.no"
```

**Merk:**
- Det kan bare finnes **én** SPF-record (`v=spf1`) på roten. Bruker du flere
  tjenester, slå dem sammen til én record.
- Resend-recordene på `send.scandijapandi.no` og `resend._domainkey` skal stå **urørt**.

## Hvor records legges til

- UI: app.netlify.com → Domains → scandijapandi.no → DNS records → Add new record.
- CLI/API: `NETLIFY_AUTH_TOKEN` (Personal Access Token), f.eks.
  `netlify api createDnsRecord` mot DNS-sonen. Sjekk eksisterende records først
  med `netlify api getDnsRecords`.
- Tilgang: Netlify-teamet som eier siden; Domeneshop (konto hf@akatombo.no) for
  alt. A; Resend-dashboard for alt. B.

## Verifisering

1. Kjør sjekkscriptet (ingen avhengigheter, Node 18+):

   ```
   npm run check:mail-dns            # scandijapandi.no
   node scripts/check-mail-dns.mjs example.no   # annet domene
   ```

   Det viser OK/MISSING for MX, SPF, `_dmarc`, `resend._domainkey` og `send.*`,
   og avslutter med kode 1 hvis rot-MX mangler.
2. `dig +short MX scandijapandi.no` skal gi leverandørens MX (DNS kan bruke
   litt tid på å spre seg).
3. Send en test fra en ekstern adresse til hello@, makers@, privacy@ og ordre@,
   og bekreft at de kommer fram uten bounce.
4. Send en test fra admin (`admin-test-email`) og sjekk at utgående fortsatt
   leveres og består SPF/DKIM/DMARC.
