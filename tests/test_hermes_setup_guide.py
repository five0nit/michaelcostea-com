"""Standalone Hermes guide regression. No third-party dependencies."""
import json
from pathlib import Path
import re
import unittest
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'guides/hermes-setup/index.html'

class Tags(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class HermesWebsiteTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(PAGE.is_file(), 'Missing website-ready Hermes guide')
        self.text = PAGE.read_text()
        self.tags = Tags(self.text).tags

    def test_canonical_metadata(self):
        expected = 'https://michaelcostea.com/guides/hermes-setup/'
        self.assertIn(('link', {'rel': 'canonical', 'href': expected}), self.tags)
        self.assertIn(('meta', {'property': 'og:url', 'content': expected}), self.tags)
        self.assertIn('Michael Costea', self.text)
        for src in re.findall(r'<script type="application/ld\+json">(.*?)</script>', self.text, re.S):
            data = json.loads(src)
            self.assertEqual(data['@type'], 'TechArticle')
            self.assertEqual(data['url'], expected)

    def test_all_chapters(self):
        headings = re.findall(r'<h2[^>]*>(.*?)</h2>', self.text, re.S)
        numbers = [int(re.match(r'(\d+)\.', h).group(1)) for h in headings if re.match(r'\d+\.', h)]
        self.assertEqual(numbers, list(range(1, 24)))
        self.assertEqual(len(re.findall(r'<h1\b', self.text)), 1)

    def test_brief2ship_canonical_not_optional(self):
        self.assertIn('brief2ship discover', self.text)
        self.assertIn('Brief2Ship', self.text)
        self.assertNotIn('Optional: Brief2Ship', self.text)
        self.assertNotIn('skills/repo-first-build/', self.text)
        self.assertFalse((PAGE.parent / 'skills/repo-first-build').exists())

    def test_local_links_and_unique_anchors(self):
        ids = [a['id'] for _, a in self.tags if 'id' in a]
        self.assertEqual(len(ids), len(set(ids)))
        for tag, attrs in self.tags:
            if tag != 'a' or 'href' not in attrs:
                continue
            href = attrs['href']
            parsed = urlsplit(href)
            if parsed.scheme or parsed.netloc:
                continue
            if not parsed.path:
                self.assertIn(unquote(parsed.fragment), ids, href)
            elif not parsed.path.startswith('/'):
                self.assertTrue((PAGE.parent / unquote(parsed.path)).is_file(), href)

    def test_navigation_and_accessibility(self):
        self.assertIn('Skip to guide', self.text)
        self.assertIn('id="chapter-filter"', self.text)
        self.assertIn('id="chapter-navigation"', self.text)
        self.assertIn('aria-live="polite"', self.text)
        self.assertIn('prefers-reduced-motion', self.text)
        self.assertIn('Copy command', self.text)
        self.assertIn('Print guide', self.text)

    def test_no_remote_runtime_dependencies(self):
        for tag, attrs in self.tags:
            if tag == 'script':
                self.assertNotIn('src', attrs)
            if tag == 'link':
                self.assertNotEqual(attrs.get('rel'), 'stylesheet')
        self.assertNotIn('googletagmanager.com', self.text)

    def test_public_privacy(self):
        for pattern in [r'/home/fiv30nit', r'/mnt/c/Users/coste', r'costea\.michael@gmail\.com', r'1378707550', r'generalist1', r'\b\d{8,12}:[A-Za-z0-9_-]{32,}', r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----']:
            self.assertIsNone(re.search(pattern, self.text), pattern)

    def test_prior_review_corrections_preserved(self):
        for marker in ['terminal.cwd', 'root OAuth', 'cron runs', 'installation-wide update']:
            self.assertIn(marker, self.text)

    def test_code_blocks_preserve_exact_source(self):
        from html import unescape
        markdown = (PAGE.parent/'GUIDE.md').read_text()
        expected = re.findall(r'^```[^\n]*\n(.*?)^```', markdown, re.M|re.S)
        rendered = [unescape(code) for code in re.findall(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>', self.text, re.S)]
        self.assertGreater(len(expected), 30)
        self.assertEqual(rendered, expected)

    def test_theme_matches_current_michaelos(self):
        # Offline HTML mirrors the live site tokens without its desktop layout CSS.
        site = (ROOT/'styles.css').read_text() + (ROOT/'assets/css/nous-michael-live.css').read_text()
        for token in ['nm-paper', 'nm-paper-2', 'nm-ink', 'nm-blue', 'nm-title', 'nm-yellow', 'window-gray', 'mid-shadow']:
            expected = re.findall(r'--' + token + r'\s*:\s*([^;}]+)', site)[-1].strip()
            actual = re.findall(r'--' + token + r'\s*:\s*([^;}]+)', self.text)
            self.assertTrue(actual, token)
            self.assertEqual(actual[0].strip(), expected, token)
        for marker in ['"Work Sans",Tahoma,sans-serif', '"Space Grotesk","IBM Plex Mono","Courier New",monospace', 'linear-gradient(90deg,var(--nm-blue),var(--nm-title))', 'border-top:2px solid #fff', 'border-right:2px solid var(--mid-shadow)', 'background:#000', 'border-radius:0']:
            self.assertIn(marker, self.text)

    def test_downloads_present(self):
        for name in ['hermes-starter-pack.zip', 'GUIDE.md', 'templates/SOUL.md', 'VERIFICATION.md']:
            self.assertTrue((PAGE.parent / name).is_file(), name)
        self.assertIn('download="hermes-starter-pack.zip"', self.text)

if __name__ == '__main__':
    unittest.main()
