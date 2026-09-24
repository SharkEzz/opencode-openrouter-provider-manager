import React from 'react';

export const ICON_BASE = 'https://unpkg.com/lucide-static@latest/icons/';

const cache = new Map();

function normalise(svg) {
  return svg.replace(/\s(width|height)="[^"]*"/g, '').replace('<svg', '<svg width="100%" height="100%" focusable="false"');
}

/** Lucide glyph, inlined so it inherits `currentColor` and stays crisp at any size. */
export function Icon({ name, size = 14, color = 'currentColor', title, style }) {
  const url = ICON_BASE + name + '.svg';
  const [svg, setSvg] = React.useState(() => (cache.has(name) ? cache.get(name) : null));

  React.useEffect(() => {
    if (cache.has(name)) { setSvg(cache.get(name)); return undefined; }
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => { const s = normalise(t); cache.set(name, s); if (live) setSvg(s); })
      .catch(() => { cache.set(name, ''); if (live) setSvg(''); });
    return () => { live = false; };
  }, [name, url]);

  const box = {
    display: 'inline-grid',
    placeItems: 'center',
    flex: '0 0 auto',
    width: size + 'px',
    height: size + 'px',
    color,
    ...style
  };

  // fetch blocked or glyph missing -> fall back to a CSS mask of the same file
  if (svg === '') {
    return (
      <span
        role={title ? 'img' : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        style={{
          ...box,
          background: 'currentColor',
          WebkitMaskImage: 'url(' + url + ')',
          maskImage: 'url(' + url + ')',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain'
        }}
      />
    );
  }

  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={box}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
