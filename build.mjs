// Zero-dependency static site build: src/pages + public -> dist
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const site = {
  url: 'https://www.amplify-digital.eu',
  name: 'Amplify Digital',
  legalName: 'Amplify Digital BV',
  street: 'Beelbroekstraat 99',
  postalCode: '9040',
  city: 'Gent',
  country: 'Belgium',
  companyNumber: '1036.190.226',
  vat: 'BE 1036.190.226',
  register: 'RLE Ghent, division Ghent',
  email: 'hello@amplify-digital.eu',
  phone: '+32 498 88 44 37',
  phoneHref: '+32498884437',
};

const year = new Date().getFullYear();
const today = new Date().toISOString().slice(0, 10);

const layout = (page) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
${page.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${site.url}${page.path}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${site.url}${page.path}">
<meta property="og:image" content="${site.url}/img/og.png">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0c07">
<link rel="icon" href="/img/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/img/icon-256.png">
<link rel="stylesheet" href="/css/style.css">
${page.path === '/' ? `<script type="application/ld+json">${JSON.stringify(orgSchema)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="logo" href="/" aria-label="${site.name} home"><img src="/img/logo-dark.svg" alt="${site.name}" width="110" height="26"></a>
    <nav aria-label="Main">
      <a href="/#services">Services</a>
      <a href="/#approach">Approach</a>
      <a class="btn btn-small" href="/contact">Contact</a>
    </nav>
  </div>
</header>
<main id="main">
${page.body}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <img src="/img/logo-light.svg" alt="${site.name}" width="110" height="26">
      <address>
        ${site.legalName}<br>
        ${site.street}<br>
        ${site.postalCode} ${site.city}, ${site.country}
      </address>
    </div>
    <div>
      <h2>Contact</h2>
      <p><a href="mailto:${site.email}">${site.email}</a><br>
      <a href="tel:${site.phoneHref}">${site.phone}</a></p>
    </div>
    <div>
      <h2>Company</h2>
      <p>Company no. ${site.companyNumber}<br>
      VAT ${site.vat}<br>
      ${site.register}</p>
    </div>
    <div>
      <h2>Legal</h2>
      <p><a href="/privacy">Privacy Policy</a><br>
      <a href="/terms">Terms of Use</a><br>
      <a href="/cookies">Cookie Policy</a></p>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>&copy; ${year} ${site.legalName}. All rights reserved.</p>
  </div>
</footer>
</body>
</html>
`;

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  logo: `${site.url}/img/icon-256.png`,
  email: site.email,
  telephone: site.phoneHref,
  vatID: site.vat.replace(/[ .]/g, ''),
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.street,
    postalCode: site.postalCode,
    addressLocality: site.city,
    addressCountry: 'BE',
  },
};

// Pages start with a JSON comment: <!--{"title": "...", "description": "..."}-->
function parse(file, source) {
  const match = source.match(/^<!--(\{[\s\S]*?\})-->\n?/);
  if (!match) throw new Error(`${file}: missing front matter comment`);
  const slug = file.replace(/\.html$/, '');
  const body = source
    .slice(match[0].length)
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in site)) throw new Error(`${file}: unknown placeholder ${key}`);
      return site[key];
    });
  return { ...JSON.parse(match[1]), body, path: slug === 'index' ? '/' : `/${slug}` };
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });

const pages = [];
for (const file of (await readdir('src/pages')).filter((f) => f.endsWith('.html'))) {
  const page = parse(file, await readFile(join('src/pages', file), 'utf8'));
  await writeFile(join('dist', file), layout(page));
  pages.push(page);
}

const urls = pages
  .filter((p) => !p.noindex)
  .map((p) => `  <url><loc>${site.url}${p.path}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n');
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages to dist/`);
