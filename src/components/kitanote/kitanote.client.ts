// 北の手 · Kita no Te — the only script on the magazine pages (~4 kB).
// Reveal on scroll, lazy ambient loops, click-to-play films, the language
// hint, the channel block (LINE + latest episodes) and the progressive
// product block. Everything works without it.

type Product = { slug: string; name: string; name_jp?: string; name_en?: string; producer?: string; price_nok?: number; image_url?: string };
type Episode = { slug: string; title_jp?: string; title_en?: string; title_no?: string; producer_name?: string; thumbnail_url?: string };

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const hasIO = 'IntersectionObserver' in window;

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('.kt-reveal');
  if (!hasIO || reduceMotion.matches) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
  );
  items.forEach((el) => io.observe(el));
}

function initLoops() {
  const loops = [...document.querySelectorAll<HTMLElement>('[data-loop]')];
  if (!loops.length || !hasIO || reduceMotion.matches || saveData) return;

  let userPaused = false;
  const visible = new Set<HTMLElement>();
  const toggles = loops
    .map((l) => l.querySelector<HTMLButtonElement>('[data-motion-toggle]'))
    .filter((b): b is HTMLButtonElement => Boolean(b));

  const videoOf = (wrap: HTMLElement) => wrap.querySelector('video')!;

  const start = (wrap: HTMLElement) => {
    const video = videoOf(wrap);
    if (!video.dataset.loaded) {
      video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => (s.src = s.dataset.src!));
      video.dataset.loaded = '1';
      video.muted = true;
      video.addEventListener('playing', () => wrap.classList.add('is-playing'), { once: true });
      video.load();
    }
    video.play().catch(() => {});
  };

  const syncToggles = () => {
    for (const b of toggles) {
      b.setAttribute('aria-pressed', String(userPaused));
      b.textContent = (userPaused ? b.dataset.labelPlay : b.dataset.labelPause) ?? '';
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const wrap = e.target as HTMLElement;
        if (e.isIntersecting) {
          visible.add(wrap);
          if (!userPaused) start(wrap);
        } else {
          visible.delete(wrap);
          videoOf(wrap).pause();
        }
      }
    },
    { rootMargin: '200px 0px' },
  );

  loops.forEach((wrap) => io.observe(wrap));
  toggles.forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => {
      userPaused = !userPaused;
      syncToggles();
      if (userPaused) loops.forEach((w) => videoOf(w).pause());
      else visible.forEach(start);
    });
  });

  // Respect a change of heart mid-visit.
  reduceMotion.addEventListener?.('change', (e) => {
    if (!e.matches) return;
    loops.forEach((w) => videoOf(w).pause());
    toggles.forEach((b) => (b.hidden = true));
  });
}

function initFilms() {
  document.querySelectorAll<HTMLElement>('[data-film]').forEach((wrap) => {
    const video = wrap.querySelector('video')!;
    const button = wrap.querySelector<HTMLButtonElement>('.kt-film__play')!;
    button.addEventListener('click', () => {
      let src = wrap.dataset.src;
      if (wrap.dataset.type === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
        src = wrap.dataset.fallback;
      }
      if (!src) return;
      if (!video.getAttribute('src')) video.src = src;
      video.controls = true;
      // Captions on in the page language. Chosen here rather than with
      // `default` so not even the .vtt loads before the reader presses play.
      for (const track of Array.from(video.textTracks)) {
        track.mode = track.language === wrap.dataset.captions ? 'showing' : 'disabled';
      }
      wrap.classList.add('is-active');
      // Pause ambient loops so the film has the room to itself.
      document.querySelectorAll<HTMLVideoElement>('[data-loop] video').forEach((v) => v.pause());
      video.play().catch(() => {});
      video.focus();
    });
  });
}

function initLanguage() {
  const root = document.querySelector<HTMLElement>('[data-kt-lang]');
  if (!root) return;
  // The storefront's sj-lang values: jp / en / no.
  const pageLang = ({ ja: 'jp', en: 'en', no: 'no' } as Record<string, string>)[root.dataset.ktLang ?? ''];
  document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((a) =>
    a.addEventListener('click', () => {
      try {
        localStorage.setItem('sj-lang', a.dataset.langSwitch!);
      } catch {}
    }),
  );
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('sj-lang');
  } catch {}
  if (!stored || stored === pageLang) return;
  const link = document.querySelector<HTMLElement>(`[data-hint-for="${stored}"]`);
  if (!link) return;
  link.hidden = false;
  link.parentElement?.removeAttribute('hidden');
}

/** LINE button (/api/config → line_url) and latest episodes (/api/stories). */
async function initChannel() {
  const block = document.querySelector<HTMLElement>('[data-channel]');
  if (!block) return;

  fetch('/api/config', { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((c) => {
      const url = typeof c?.line_url === 'string' ? c.line_url : '';
      if (!/^https:\/\//.test(url)) return;
      const a = block.querySelector<HTMLAnchorElement>('[data-line]');
      if (!a) return;
      a.href = url;
      a.hidden = false;
    })
    .catch(() => {});

  try {
    const res = await fetch('/api/stories', { headers: { accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    const episodes: Episode[] = (Array.isArray(data.episodes) ? data.episodes : []).filter((e: Episode) => e?.slug).slice(0, 3);
    if (!episodes.length) return;
    const grid = block.querySelector<HTMLElement>('[data-latest-grid]')!;
    const lang = grid.dataset.lang;
    grid.replaceChildren(
      ...episodes.map((e) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/stories/${encodeURIComponent(e.slug)}`;
        a.className = 'group block';
        const frame = document.createElement('span');
        frame.className = 'kt-media kt-zoom block aspect-video';
        if (e.thumbnail_url) {
          const img = document.createElement('img');
          img.src = e.thumbnail_url;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          frame.append(img);
        }
        const maker = document.createElement('span');
        maker.className = 'kt-label kt-label--sm kt-stone mt-4 block';
        maker.textContent = e.producer_name || '';
        const title = document.createElement('span');
        title.className = 'kt-jp mt-2 block text-[1.0625rem]';
        title.lang = 'ja';
        title.textContent = e.title_jp || e.title_en || e.title_no || '';
        a.append(frame, maker, title);
        const second = lang === 'en' ? e.title_en : lang === 'no' ? e.title_no : '';
        if (second) {
          const s = document.createElement('span');
          s.className = 'kt-latin kt-second mt-1 block text-[0.9375rem]';
          s.textContent = second;
          a.append(s);
        }
        li.append(a);
        return li;
      }),
    );
    block.querySelector<HTMLElement>('[data-latest]')!.hidden = false;
  } catch {}
}

async function initProducts() {
  const block = document.querySelector<HTMLElement>('[data-products]');
  if (!block) return;
  const match = (block.dataset.match || '').trim().toLowerCase();
  const slugs: string[] = JSON.parse(block.dataset.slugs || '[]');
  if (!match && !slugs.length) return;

  let products: Product[] = [];
  try {
    const res = await fetch('/api/products', { headers: { accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    products = Array.isArray(data.products) ? data.products : [];
  } catch {
    return;
  }

  const picked = products
    .filter((p) => p?.slug && (slugs.includes(p.slug) || (match && (p.producer || '').toLowerCase().includes(match))))
    .slice(0, 3);
  if (!picked.length) return;

  const grid = block.querySelector<HTMLElement>('[data-products-grid]')!;
  const template = block.querySelector<HTMLTemplateElement>('[data-product-template]')!;
  const pageLang = block.dataset.lang;
  const locale = pageLang === 'ja' ? 'ja-JP' : pageLang === 'en' ? 'en-GB' : 'nb-NO';
  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });
  const nameOf = (p: Product) => (pageLang === 'ja' ? p.name_jp : pageLang === 'en' ? p.name_en : '') || p.name;

  grid.replaceChildren(
    ...picked.map((p) => {
      const node = template.content.firstElementChild!.cloneNode(true) as HTMLAnchorElement;
      node.href = `/products/${encodeURIComponent(p.slug)}`;
      const img = node.querySelector('img')!;
      if (p.image_url) {
        img.src = p.image_url;
        img.alt = nameOf(p);
      } else img.remove();
      const name = node.querySelector<HTMLElement>('[data-name]')!;
      name.textContent = nameOf(p);
      if (pageLang === 'ja' && p.name_jp) name.lang = 'ja';
      node.querySelector('[data-price]')!.textContent = typeof p.price_nok === 'number' ? price.format(p.price_nok) : '';
      return node;
    }),
  );
  grid.hidden = false;
  block.querySelector<HTMLElement>('[data-products-empty]')?.setAttribute('hidden', '');
}

export function initKitanote() {
  initReveal();
  initLoops();
  initFilms();
  initLanguage();
  initChannel();
  initProducts();
}
