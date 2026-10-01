# Amplify Digital website

Static site for https://www.amplify-digital.eu. No dependencies, no client-side JavaScript.

## Develop

```sh
npm run build   # src/pages + public -> dist
npm run dev     # build and serve on http://localhost:8788
```

- `build.mjs` holds the shared layout and the company details (`site` object). Change address, phone or VAT number there and every page follows.
- `src/pages/*.html` are the page bodies. Each starts with a JSON comment containing `title` and `description`.
- `public/` is copied as is (CSS, images, `_headers`).
- `sitemap.xml` and `robots.txt` are generated during the build.

## Cloudflare Pages

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
