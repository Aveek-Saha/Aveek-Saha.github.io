# Aveek Saha — Portfolio

An Astro-powered static portfolio for [home.aveek.io](https://home.aveek.io). The existing project entries in `_posts/*.markdown` remain the single content source and are loaded by Astro at build time.

## Design concepts

Five complete homepage directions are included for comparison:

1. `/` — Ledger
2. `/designs/aperture/` — Aperture
3. `/designs/index/` — Index
4. `/designs/field-notes/` — Field notes
5. `/designs/signal/` — Signal

Each opens with an interactive ASCII particle field, uses a dark theme, supports reduced motion, and is statically generated for GitHub Pages. Every project also has a direct URL under `/projects/`.

## Local development

```sh
npm install
npm run dev
```

Use `npm run build` for type checking and a production build. The output is written to `dist/`.
