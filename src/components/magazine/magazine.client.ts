// Hender fra Nord — the only script on the magazine pages (~3 kB).
// Reveal on scroll, lazy ambient loops, click-to-play films, the language
// hint and the progressive product block. Everything works without it.

type Product = { slug: string; name: string; producer?: string; price_nok?: number; image_url?: string };

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const hasIO = 'IntersectionObserver' in window;

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('.mz-reveal');
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
    const button = wrap.querySelector<HTMLButtonElement>('.mz-film__play')!;
    button.addEventListener('click', () => {
      let src = wrap.dataset.src;
      if (wrap.dataset.type === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
        src = wrap.dataset.fallback;
      }
      if (!src) return;
      if (!video.getAttribute('src')) video.src = src;
      video.controls = true;
      wrap.classList.add('is-active');
      // Pause ambient loops so the film has the room to itself.
      document.querySelectorAll<HTMLVideoElement>('[data-loop] video').forEach((v) => v.pause());
      video.play().catch(() => {});
      video.focus();
    });
  });
}

function initLanguage() {
  const root = document.querySelector<HTMLElement>('[data-mz-lang]');
  if (!root) return;
  const pageLang = root.dataset.mzLang;
  document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((a) =>
    a.addEventListener('click', () => {
      try {
        localStorage.setItem('sj-lang', a.dataset.langSwitch!);
      } catch {}
    }),
  );
  // The storefront remembers no / en / jp. Japanese readers get English here.
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('sj-lang');
  } catch {}
  if (!stored) return;
  const preferred = stored === 'no' ? 'no' : 'en';
  if (preferred !== pageLang) document.querySelector<HTMLElement>('[data-lang-hint]')?.removeAttribute('hidden');
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
    .slice(0, 4);
  if (!picked.length) return;

  const grid = block.querySelector<HTMLElement>('[data-products-grid]')!;
  const template = block.querySelector<HTMLTemplateElement>('[data-product-template]')!;
  const lang = block.dataset.lang === 'en' ? 'en-GB' : 'nb-NO';
  const price = new Intl.NumberFormat(lang, { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });

  grid.replaceChildren(
    ...picked.map((p) => {
      const node = template.content.firstElementChild!.cloneNode(true) as HTMLAnchorElement;
      node.href = `/products/${encodeURIComponent(p.slug)}`;
      const img = node.querySelector('img')!;
      if (p.image_url) {
        img.src = p.image_url;
        img.alt = p.name;
      } else img.remove();
      node.querySelector('[data-name]')!.textContent = p.name;
      node.querySelector('[data-price]')!.textContent = typeof p.price_nok === 'number' ? price.format(p.price_nok) : '';
      return node;
    }),
  );
  grid.hidden = false;
  block.querySelector<HTMLElement>('[data-products-empty]')?.setAttribute('hidden', '');
}

export function initMagazine() {
  initReveal();
  initLoops();
  initFilms();
  initLanguage();
  initProducts();
}
