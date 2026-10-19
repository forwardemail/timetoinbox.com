# TimeToInbox

Source for [timetoinbox.com](https://timetoinbox.com), a free guide to time to inbox (TTI) from the [Forward Email](https://forwardemail.net) team. Time to inbox is the time between sending an email and its arrival in the recipient's inbox.

The site explains what TTI measures, how to measure it yourself, what slows email delivery down, and how Forward Email measures and publishes its own TTI ([live results](https://forwardemail.net/tti), [monitor source code](https://github.com/forwardemail/forwardemail.net/blob/master/jobs/tti.js)).

## Pages

| URL | Source file |
| --- | --- |
| `/` | `src/pages/index.html` |
| `/what-is-time-to-inbox/` | `src/pages/what-is-time-to-inbox.html` |
| `/how-to-measure-time-to-inbox/` | `src/pages/how-to-measure-time-to-inbox.html` |
| `/what-affects-email-delivery-speed/` | `src/pages/what-affects-email-delivery-speed.html` |
| `/forward-email-time-to-inbox/` | `src/pages/forward-email-time-to-inbox.html` |
| `/faq/` | `src/pages/faq.html` |
| `/about/` | `src/pages/about.html` |
| `/privacy/` | `src/pages/privacy.html` |

## How it works

The site is static HTML and one stylesheet. It has no JavaScript, cookies, analytics or third-party requests. GitHub Pages serves the files straight from the root of the `main` branch, so every generated file is committed.

`scripts/build.js` is a small Node.js script with no dependencies. It reads `src/pages/*.html` and `src/site.css` and writes:

- `index.html` and `<slug>/index.html` for each page, with the shared header, navigation, footer, meta tags, Open Graph tags and JSON-LD structured data
- `index.md` and `<slug>.md`, a Markdown copy of each page (linked from each page with `rel="alternate"`)
- `404.html`
- `css/site.min.css` (minified from `src/site.css`)
- `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt` and `site.webmanifest`

Files that are not generated: `.well-known/security.txt`, `CNAME`, `.nojekyll` (lets GitHub Pages serve `.well-known`), the icons, `og-image.png` and `images/`.

## Editing a page

1. Edit the page in `src/pages/`. Each file starts with a `<!--meta {...} -->` block (title, description, navigation label, structured data options) followed by the page body HTML.
2. Run the build (Node.js 18 or later):

   ```sh
   node scripts/build.js
   ```

3. Commit the source change and the regenerated files together.

To add a page, create `src/pages/<slug>.html` with a meta block and an `order` value. The build adds it to the navigation, footer, sitemap, `llms.txt` and `llms-full.txt`.

Content conventions used by the build:

- `<div class="faq-item"><h2 class="faq-q">Question</h2><div class="faq-a">...</div></div>` becomes FAQPage structured data (`"schemaType": "FAQPage"`).
- `<ol class="steps">` with an `<h3>` per `<li>` becomes HowTo structured data when the meta block has a `howto` object.
- Every fact or number should link to a primary source, and live TTI values should link to [forwardemail.net/tti](https://forwardemail.net/tti) instead of being copied.

## Images

`og-image.png` (1200x630) is a screenshot of `src/og-image.html`, and the PNG icons are screenshots of `src/icon.html` (which shows `icon.svg`). To regenerate them, open those files in a browser at the target size, for example with headless Chrome:

```sh
chrome --headless=new --screenshot=og-image.png --window-size=1200,630 src/og-image.html
```

Some Chrome versions subtract the window frame from `--window-size`; check the output size.

## Preview locally

```sh
npx http-server . -p 8080
```

Then open <http://localhost:8080/>.

## Contributing

Open an [issue](https://github.com/forwardemail/timetoinbox.com/issues) or a pull request. Security reports: see [`.well-known/security.txt`](.well-known/security.txt).
