#!/usr/bin/env node
//
// Build script for timetoinbox.com (no dependencies).
//
// Reads page sources from src/pages/*.html and the stylesheet from src/site.css,
// then writes the static site into the repository root:
//
//   index.html, <slug>/index.html   pages with shared header, nav and footer
//   index.md, <slug>/index.md       Markdown copy of each page
//   404.html                        not found page
//   css/site.min.css                minified stylesheet
//   sitemap.xml, robots.txt         crawler files
//   llms.txt, llms-full.txt         files for LLM agents (llmstxt.org)
//   site.webmanifest                web app manifest
//
// Usage: node scripts/build.js
//
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ORIGIN = 'https://timetoinbox.com';
const SITE_NAME = 'TimeToInbox';
const REPO = 'https://github.com/forwardemail/timetoinbox.com';
const THEME_COLOR = '#1a365d';
const SUMMARY =
  'TimeToInbox explains time to inbox (TTI), the time from sending an email to its arrival in the recipient\'s inbox: what it measures, how to measure it yourself, what slows delivery down, and how Forward Email publishes its own TTI measurements and the public source code behind them.';

// ---------------------------------------------------------------------------
// Load pages
// ---------------------------------------------------------------------------

function loadPages() {
  const dir = path.join(SRC, 'pages');
  const pages = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const match = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
      if (!match) throw new Error(`${file}: missing <!--meta {...} --> block`);
      const meta = JSON.parse(match[1]);
      const body = raw.slice(match[0].length).trim();
      const slug = meta.slug || '';
      return {
        ...meta,
        file,
        slug,
        body,
        urlPath: slug ? `/${slug}/` : '/',
        url: slug ? `${ORIGIN}/${slug}/` : `${ORIGIN}/`,
        mdPath: slug ? `/${slug}.md` : '/index.md'
      };
    });
  pages.sort((a, b) => a.order - b.order);
  return pages;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '->')
    .replace(/&amp;/g, '&');
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function absUrl(href) {
  if (/^https?:\/\//.test(href) || href.startsWith('mailto:')) return href;
  if (href.startsWith('#')) return href;
  return ORIGIN + (href.startsWith('/') ? href : `/${href}`);
}

// Safe JSON for embedding in <script type="application/ld+json">
function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------------------
// HTML to Markdown (covers the small set of tags used in src/pages)
// ---------------------------------------------------------------------------

function inlineMd(html, base) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/g, '  \n')
      .replace(/<code>([\s\S]*?)<\/code>/g, (_, c) => '`' + c + '`')
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, '*$2*')
      .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => {
        const target = href.startsWith('#') && base ? base + href : absUrl(href);
        return `[${text.replace(/<[^>]+>/g, '').trim()}](${target})`;
      })
      .replace(/<img\s[^>]*alt="([^"]*)"[^>]*>/g, (_, alt) => (alt ? `(${alt})` : ''))
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]*\n[ \t]*/g, (m) => (m.includes('  \n') ? m : ' '))
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function htmlToMarkdown(html, base) {
  const blocks = [];
  const keep = (text) => {
    blocks.push(text);
    return `\n\n@@BLOCK${blocks.length - 1}@@\n\n`;
  };

  let s = html;

  // Remove things that have no Markdown value
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, '');
  s = s.replace(/<a\s[^>]*class="[^"]*\bbtn[^"]*"[^>]*>[\s\S]*?<\/a>/g, (m) => {
    const href = m.match(/href="([^"]+)"/)[1];
    const text = stripTags(m);
    return keep(`[${text}](${absUrl(href)})`);
  });

  // Code blocks
  s = s.replace(/<pre[^>]*><code(?:\s+class="language-([\w-]+)")?[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) =>
    keep('```' + (lang || '') + '\n' + decodeEntities(code.replace(/<[^>]+>/g, '')).replace(/\n$/, '') + '\n```')
  );

  // Tables
  s = s.replace(/<table[^>]*>([\s\S]*?)<\/table>/g, (_, inner) => {
    const caption = (inner.match(/<caption[^>]*>([\s\S]*?)<\/caption>/) || [])[1];
    const rows = [...inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => inlineMd(c[1], base).replace(/\|/g, '\\|'))
    );
    if (rows.length === 0) return '';
    const lines = [];
    if (caption) lines.push(`*${inlineMd(caption, base)}*`, '');
    lines.push(`| ${rows[0].join(' | ')} |`);
    lines.push(`| ${rows[0].map(() => '---').join(' | ')} |`);
    for (const row of rows.slice(1)) lines.push(`| ${row.join(' | ')} |`);
    return keep(lines.join('\n'));
  });

  // Lists (one level; list items may contain <h3> and <p>)
  s = s.replace(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    let n = 0;
    const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => {
      n += 1;
      const marker = tag === 'ol' ? `${n}.` : '-';
      const parts = [];
      const itemHtml = m[1];
      const heading = itemHtml.match(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/);
      let rest = itemHtml.replace(/<h[2-6][^>]*>[\s\S]*?<\/h[2-6]>/, '');
      if (heading) parts.push(`**${inlineMd(heading[1], base)}**`);
      rest = rest.replace(/<\/p>\s*<p[^>]*>/g, '\n\n').replace(/<\/?p[^>]*>/g, '');
      const restMd = rest
        .split(/\n\n/)
        .map((p) => inlineMd(p, base))
        .filter(Boolean)
        .join('\n\n   ');
      if (restMd) parts.push(restMd);
      return `${marker} ${parts.join(heading ? ': ' : '')}`;
    });
    return keep(items.join('\n'));
  });

  // Headings
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g, (_, level, text) => keep(`${'#'.repeat(Number(level))} ${inlineMd(text, base)}`));

  // Blockquotes
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (_, inner) =>
    keep(
      inner
        .replace(/<\/p>\s*<p[^>]*>/g, '\n\n')
        .replace(/<\/?p[^>]*>/g, '')
        .split(/\n\n/)
        .map((p) => `> ${inlineMd(p, base)}`)
        .join('\n>\n')
    )
  );

  // Figures: keep the caption
  s = s.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g, (_, c) => keep(`*${inlineMd(c, base)}*`));
  s = s.replace(/<img\s[^>]*>/g, '');

  // Paragraphs
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (_, text) => keep(inlineMd(text, base)));

  // Drop remaining structural tags and turn leftover text into paragraphs
  s = s.replace(/<\/?(div|section|article|aside|figure|nav|header|footer|span|dl|dt|dd)[^>]*>/g, '\n\n');
  const out = s
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^@@BLOCK(\d+)@@$/);
      return m ? blocks[Number(m[1])] : inlineMd(chunk, base);
    })
    .filter(Boolean);
  return out.join('\n\n').replace(/@@BLOCK(\d+)@@/g, (_, i) => blocks[Number(i)]) + '\n';
}

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------

const ORG = {
  '@type': 'Organization',
  '@id': 'https://forwardemail.net/#organization',
  name: 'Forward Email',
  url: 'https://forwardemail.net',
  logo: 'https://forwardemail.net/img/logo-square-180x180.png',
  sameAs: [
    'https://github.com/forwardemail',
    'https://x.com/fwdemail',
    'https://www.youtube.com/forwardemail',
    'https://www.reddit.com/r/forwardemail/'
  ],
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@forwardemail.net', url: 'https://forwardemail.net/en/faq' },
    { '@type': 'ContactPoint', contactType: 'security', email: 'security@forwardemail.net', url: 'https://forwardemail.net/en/security' }
  ]
};

const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${ORIGIN}/#website`,
  url: `${ORIGIN}/`,
  name: SITE_NAME,
  alternateName: 'Time to Inbox',
  description: SUMMARY,
  inLanguage: 'en',
  publisher: { '@id': ORG['@id'] }
};

function extractFaq(body) {
  return [
    ...body.matchAll(/<h([2-6]) class="faq-q"[^>]*>([\s\S]*?)<\/h\1>\s*<div class="faq-a">([\s\S]*?)<\/div>/g)
  ].map((m) => ({ q: stripTags(m[2]), a: stripTags(m[3]) }));
}

function extractSteps(body) {
  const list = body.match(/<ol class="steps"[^>]*>([\s\S]*?)<\/ol>/);
  if (!list) return [];
  return [...list[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => {
    const name = stripTags((m[1].match(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/) || [])[1] || '');
    const text = stripTags(m[1].replace(/<h[2-6][^>]*>[\s\S]*?<\/h[2-6]>/, ''));
    return { name, text };
  });
}

function structuredData(page, pages) {
  const graph = [ORG, WEBSITE];
  const pageType = page.schemaType || 'WebPage';
  const webPage = {
    '@type': pageType,
    '@id': `${page.url}#webpage`,
    url: page.url,
    name: stripTags(page.h1),
    headline: stripTags(page.h1),
    description: stripTags(page.lead),
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE['@id'] },
    publisher: { '@id': ORG['@id'] },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${ORIGIN}/og-image.png`,
      width: 1200,
      height: 630
    }
  };
  if (page.about) webPage.about = page.about;
  if (page.slug) webPage.breadcrumb = { '@id': `${page.url}#breadcrumb` };

  if (pageType === 'FAQPage') {
    webPage.mainEntity = extractFaq(page.body).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }));
  }

  graph.push(webPage);

  if (page.slug) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${page.url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: page.nav, item: page.url }
      ]
    });
  }

  if (page.howto) {
    const steps = extractSteps(page.body);
    graph.push({
      '@type': 'HowTo',
      '@id': `${page.url}#howto`,
      name: page.howto.name,
      description: page.howto.description,
      tool: (page.howto.tools || []).map((name) => ({ '@type': 'HowToTool', name })),
      step: steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.name,
        text: step.text,
        url: `${page.url}#step-${i + 1}`
      }))
    });
  }

  if (pages && !page.slug) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${ORIGIN}/#guides`,
      name: 'Time to inbox guides',
      itemListElement: pages
        .filter((p) => p.slug)
        .map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: p.url, name: p.h1 }))
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const GITHUB_ICON =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

function header(pages, current) {
  const links = pages
    .filter((p) => p.slug && !p.hideNav)
    .map((p) => {
      const active = current && p.slug === current.slug;
      return `<li><a href="${p.urlPath}"${active ? ' aria-current="page"' : ''}>${escapeHtml(p.nav)}</a></li>`;
    })
    .join('\n          ');
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container header-content">
      <a class="logo" href="/"${current && !current.slug ? ' aria-current="page"' : ''}><img src="/icon.svg" alt="" width="44" height="44" fetchpriority="high"><span>TimeToInbox</span></a>
      <nav aria-label="Main">
        <ul class="nav-links">
          ${links}
          <li><a class="btn btn-primary nav-cta" href="https://forwardemail.net">Try Forward Email</a></li>
        </ul>
      </nav>
    </div>
  </header>`;
}

function footer(pages, current) {
  const guideLinks = pages
    .filter((p) => p.slug && p.footer !== 'about')
    .map((p) => `<li><a href="${p.urlPath}">${escapeHtml(p.nav)}</a></li>`)
    .join('\n            ');
  const editPath = current ? `src/pages/${current.file}` : 'src/pages';
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-about">
          <p class="footer-title">TimeToInbox</p>
          <p>A free guide to time to inbox (TTI) and email delivery speed from the <a href="https://forwardemail.net">Forward Email</a> team.</p>
          <p><a href="/about/">About this site</a> &middot; <a href="/privacy/">Privacy policy</a></p>
          <p>Contact: <a href="https://github.com/forwardemail/timetoinbox.com/issues">GitHub issues</a> &middot; <a href="mailto:support@forwardemail.net">support@forwardemail.net</a></p>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <p class="footer-title">Guides</p>
            <ul>
            ${guideLinks}
            </ul>
          </div>
          <div class="link-group">
            <p class="footer-title">Forward Email</p>
            <ul>
              <li><a href="https://forwardemail.net">Forward Email home</a></li>
              <li><a href="https://forwardemail.net/tti">Live TTI measurements</a></li>
              <li><a href="https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js">TTI monitor source code</a></li>
              <li><a href="https://forwardemail.net/faq">Forward Email FAQ</a></li>
              <li><a href="https://forwardemail.net/private-business-email">Plans and pricing</a></li>
              <li><a href="https://github.com/forwardemail">Forward Email on GitHub</a></li>
              <li><a href="https://x.com/fwdemail">Forward Email on X</a></li>
              <li><a href="https://www.youtube.com/forwardemail">Forward Email on YouTube</a></li>
            </ul>
          </div>
          <div class="link-group">
            <p class="footer-title">Related sites</p>
            <ul>
              <li><a href="https://alumniemail.com">AlumniEmail.com</a></li>
              <li><a href="https://serverauditing.com">ServerAuditing.com</a></li>
              <li><a href="https://sshmonitor.com">SSHMonitor.com</a></li>
              <li><a href="https://sslmonitor.com">SSLMonitor.com</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>TimeToInbox is run by the Forward Email team. Source code on <a href="${REPO}">GitHub</a>.</p>
        <a class="edit-link" href="${REPO}/blob/main/${editPath}">${GITHUB_ICON}<span>Edit this page on GitHub</span></a>
      </div>
    </div>
  </footer>`;
}

function head(page, opts) {
  const title = page.slug ? `${page.title}` : page.title;
  const jsonLd = opts.jsonLd ? `\n  <script type="application/ld+json">\n${jsonForScript(opts.jsonLd)}\n  </script>` : '';
  const canonical = opts.noindex ? '' : `\n  <link rel="canonical" href="${page.url}">`;
  const robots = opts.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const md = opts.noindex ? '' : `\n  <link rel="alternate" type="text/markdown" href="${page.mdPath}" title="${escapeHtml(page.h1)} (Markdown)">`;
  const ogUrl = opts.noindex ? `${ORIGIN}/404.html` : page.url;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="${robots}">${canonical}
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="${THEME_COLOR}">
  <meta name="color-scheme" content="light">
  <meta name="author" content="Forward Email">
  <link rel="stylesheet" href="/css/site.min.css">
  <link rel="icon" href="/favicon.ico" sizes="48x48 32x32 16x16">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">${md}
  <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">
  <link rel="author" href="/about/">
  <meta property="og:type" content="${page.slug ? 'article' : 'website'}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(page.ogTitle || page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:image" content="${ORIGIN}/og-image.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="TimeToInbox: how long email takes to reach the inbox, and how to measure it">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.ogTitle || page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${ORIGIN}/og-image.png">
  <meta name="twitter:image:alt" content="TimeToInbox: how long email takes to reach the inbox, and how to measure it">${jsonLd}
</head>`;
}

function breadcrumbHtml(page) {
  if (!page.slug) return '';
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><span aria-current="page">${escapeHtml(page.nav)}</span></li></ol></nav>`;
}

function renderPage(page, pages, opts = {}) {
  const hero = `<section class="hero${page.slug ? ' hero-inner' : ''}">
      <div class="container hero-content">
        ${breadcrumbHtml(page)}
        <h1>${page.h1}</h1>
        <p class="lead">${page.lead}</p>${page.heroCtas ? `\n        <div class="cta-buttons">${page.heroCtas}</div>` : ''}
      </div>
    </section>`;
  return `${head(page, { jsonLd: opts.noindex ? null : structuredData(page, pages), noindex: opts.noindex })}
<body>
  ${header(pages, opts.noindex ? null : page)}
  <main id="main">
    ${hero}
${page.body
  .split('\n')
  .map((line) => (line ? `    ${line}` : line))
  .join('\n')}
  </main>
  ${footer(pages, opts.noindex ? null : page)}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Markdown, llms.txt, sitemap, robots, manifest
// ---------------------------------------------------------------------------

function pageMarkdown(page) {
  return `# ${stripTags(page.h1)}\n\n> ${stripTags(page.lead)}\n\nSource: ${page.url}\n\n${htmlToMarkdown(page.body, page.url)}`;
}

function llmsTxt(pages) {
  const guides = pages
    .filter((p) => p.llms === 'guide' || !p.slug)
    .map((p) => `- [${stripTags(p.h1)}](${ORIGIN}${p.mdPath}): ${p.llmsDesc}`)
    .join('\n');
  const optional = pages
    .filter((p) => p.llms === 'optional')
    .map((p) => `- [${stripTags(p.h1)}](${ORIGIN}${p.mdPath}): ${p.llmsDesc}`)
    .join('\n');
  return `# ${SITE_NAME}

> ${SUMMARY}

TimeToInbox is a free, static reference site run by the Forward Email team. Each page below has a Markdown copy (linked here) next to its HTML version. The full text of every page is in [llms-full.txt](${ORIGIN}/llms-full.txt).

## Guides

${guides}

## Forward Email sources

- [Forward Email live TTI page](https://forwardemail.net/tti): current direct and forwarding delivery times to test inboxes at major mailbox providers, plus a 24-hour chart.
- [TTI monitor source code (jobs/tti.js)](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js): the job that sends the test messages and records how long they take to arrive.
- [IMAP polling helper (helpers/get-message.js)](https://github.com/forwardemail/forwardemail.net/blob/master/helpers/get-message.js): how the monitor detects that a test message has arrived.
- [Forward Email FAQ: greylisting](https://forwardemail.net/faq#do-you-have-a-greylist): how Forward Email delays mail from new senders.

## Optional

${optional}
- [Source code for this site](${REPO}): static HTML generated by a small Node.js script.
`;
}

function llmsFullTxt(pages) {
  return `# ${SITE_NAME}: full text\n\n> ${SUMMARY}\n\n${pages
    .map((p) => pageMarkdown(p).replace(/^# /, '## ').replace(/\n(#{2,5}) /g, '\n#$1 '))
    .join('\n---\n\n')}`;
}

function sitemap(pages) {
  const urls = pages
    .map((p) => `  <url>\n    <loc>${p.url}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${p.slug ? '0.8' : '1.0'}</priority>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bingbot',
  'DuckAssistBot',
  'meta-externalagent'
];

function robotsTxt() {
  return `# robots.txt for timetoinbox.com
# All crawlers, including AI and answer-engine crawlers, may index this site.

User-agent: *
Allow: /

${AI_BOTS.map((bot) => `User-agent: ${bot}`).join('\n')}
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;
}

function manifest() {
  return (
    JSON.stringify(
      {
        name: 'TimeToInbox',
        short_name: 'TimeToInbox',
        description: 'Time to inbox (TTI): what it is, how to measure it, and what affects email delivery speed.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: THEME_COLOR,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      null,
      2
    ) + '\n'
  );
}

// ---------------------------------------------------------------------------
// CSS minifier (comments, whitespace)
// ---------------------------------------------------------------------------

function minifyCss(css) {
  return (
    css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>])\s*/g, '$1')
      .replace(/;}/g, '}')
      // restore the space needed in media queries like "and (max-width"
      .replace(/\band\(/g, 'and (')
      .trim() + '\n'
  );
}

// ---------------------------------------------------------------------------
// Write everything
// ---------------------------------------------------------------------------

// Cloudflare sits in front of GitHub Pages, and its Email Address Obfuscation
// rewrites addresses in served HTML into links that need a decoder script,
// which the CSP blocks. Wrap every address and mailto: link in the page body
// in the <!--email_off--> markers Cloudflare documents, so readers and
// crawlers see the real address. Cloudflare does not rewrite the <head>.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

function protectEmails(html) {
  const end = html.indexOf('</head>');
  const head = end === -1 ? '' : html.slice(0, end + 7);
  const body = end === -1 ? html : html.slice(end + 7);
  const token =
    /<!--email_off-->[\s\S]*?<!--\/email_off-->|<!--[\s\S]*?-->|<(script|style|textarea)\b[\s\S]*?<\/\1>|<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>|<[^>]+>|[^<]+/gi;
  return (
    head +
    body.replace(token, (t) => {
      if (t.startsWith('<!--') || /^<(script|style|textarea)\b/i.test(t)) return t;
      if (/^<a\b/i.test(t)) return `<!--email_off-->${t}<!--/email_off-->`;
      if (t.startsWith('<')) return t;
      return t.replace(EMAIL_RE, (e) => `<!--email_off-->${e}<!--/email_off-->`);
    })
  );
}

function write(rel, content) {
  if (rel.endsWith('.html')) content = protectEmails(content);
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function build() {
  const pages = loadPages();

  for (const page of pages) {
    const dir = page.slug ? `${page.slug}/` : '';
    write(`${dir}index.html`, renderPage(page, pages));
    write(page.slug ? `${page.slug}.md` : 'index.md', pageMarkdown(page));
  }

  const notFound = {
    slug: '',
    file: '404.html',
    title: 'Page Not Found: Time to Inbox Guides | TimeToInbox',
    description: 'This page does not exist on TimeToInbox. Use the links below to find guides on time to inbox (TTI) and email delivery speed.',
    h1: 'Page not found',
    nav: 'Not found',
    lead: 'The page you asked for does not exist. It may have moved when the site was reorganized into separate guides.',
    url: `${ORIGIN}/404.html`,
    mdPath: '/index.md',
    body: `<section class="section">
  <div class="container narrow">
    <h2>Try one of these pages</h2>
    <ul class="link-list">
${pages.map((p) => `      <li><a href="${p.urlPath}">${p.h1}</a></li>`).join('\n')}
    </ul>
  </div>
</section>`
  };
  write('404.html', renderPage(notFound, pages, { noindex: true }));

  write('sitemap.xml', sitemap(pages));
  write('robots.txt', robotsTxt());
  write('llms.txt', llmsTxt(pages));
  write('llms-full.txt', llmsFullTxt(pages));
  write('site.webmanifest', manifest());
  write('css/site.min.css', minifyCss(fs.readFileSync(path.join(SRC, 'site.css'), 'utf8')));

  console.log(`Built ${pages.length} pages: ${pages.map((p) => p.urlPath).join(' ')}`);
}

build();
