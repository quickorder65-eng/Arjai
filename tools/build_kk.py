#!/usr/bin/env python3
"""Сборка казахской версии сайта из русских страниц.

Русские страницы (index.html, repetitor.html, shkolam.html) — источник.
Переводы лежат в tools/kk.json: {"русский текст": "қазақша мәтін"}.

  python3 tools/build_kk.py check   — показать тексты без перевода
  python3 tools/build_kk.py build   — собрать kk/*.html (падает, если есть тексты без перевода)

После любой правки русских страниц: добавить новые строки в kk.json и запустить build.
"""
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "repetitor.html", "shkolam.html"]
DICT_PATH = ROOT / "tools" / "kk.json"
BASE = "https://quickorder65-eng.github.io/Arjai/"
CYR = re.compile(r"[А-Яа-яЁё]")
TEXT_ATTRS = {"alt", "aria-label", "title", "placeholder", "content"}
SKIP_DATA_TAGS = {"style"}


def load_dict():
    return json.loads(DICT_PATH.read_text(encoding="utf-8")) if DICT_PATH.exists() else {}


def needs(text):
    return bool(CYR.search(text))


class Translator(HTMLParser):
    def __init__(self, kk, missing):
        super().__init__(convert_charrefs=True)
        self.kk, self.missing = kk, missing
        self.out = []
        self.stack = []
        self.in_ldjson = False

    # --- помощники
    def tr(self, text):
        core = text.strip()
        if not core or not needs(core):
            return text
        if core in self.kk:
            lead = text[: len(text) - len(text.lstrip())]
            trail = text[len(text.rstrip()):]
            return lead + self.kk[core] + trail
        self.missing.add(core)
        return text

    def tr_json(self, obj):
        if isinstance(obj, dict):
            return {k: self.tr_json(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self.tr_json(v) for v in obj]
        if isinstance(obj, str):
            return self.tr(obj)
        return obj

    # --- разбор
    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        for name, val in attrs:
            if val and name in TEXT_ATTRS and needs(val):
                new = self.tr(val)
                if new != val:
                    raw = raw.replace('"' + html.escape(val, quote=True) + '"', '"' + html.escape(new, quote=True) + '"', 1)
                    raw = raw.replace('"' + val + '"', '"' + html.escape(new, quote=True) + '"', 1)
        self.out.append(raw)
        if tag == "script" and dict(attrs).get("type") == "application/ld+json":
            self.in_ldjson = True
        if tag not in ("meta", "link", "img", "br", "input", "source", "hr"):
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        self.out.append("</%s>" % tag)
        if tag == "script":
            self.in_ldjson = False
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_data(self, data):
        cur = self.stack[-1] if self.stack else ""
        if self.in_ldjson:
            obj = json.loads(data)
            self.out.append("\n" + json.dumps(self.tr_json(obj), ensure_ascii=False, indent=1) + "\n")
        elif cur in ("script",) or cur in SKIP_DATA_TAGS:
            self.out.append(data)
        else:
            self.out.append(html.escape(self.tr(data), quote=False))

    def handle_comment(self, data):
        self.out.append("<!--%s-->" % data)

    def handle_decl(self, decl):
        self.out.append("<!%s>" % decl)


def localize_paths(s, page):
    slug = "" if page == "index.html" else page
    s = s.replace('<html lang="ru"', '<html lang="kk"', 1)
    # ресурсы — на уровень выше
    s = re.sub(r'(href|src)="assets/', r'\1="../assets/', s)
    s = s.replace('srcset="assets/', 'srcset="../assets/')
    s = s.replace('url("assets/', 'url("../assets/')
    # канонический адрес и Open Graph
    s = s.replace('<link rel="canonical" href="%s%s">' % (BASE, slug), '<link rel="canonical" href="%skk/%s">' % (BASE, slug))
    s = s.replace('<meta property="og:url" content="%s%s">' % (BASE, slug), '<meta property="og:url" content="%skk/%s">' % (BASE, slug))
    s = s.replace('<meta property="og:locale" content="ru_RU">\n<meta property="og:locale:alternate" content="kk_KZ">',
                  '<meta property="og:locale" content="kk_KZ">\n<meta property="og:locale:alternate" content="ru_RU">')
    # адреса внутри schema.org для главной
    s = s.replace('"url": "%s"' % BASE, '"url": "%skk/"' % BASE)
    # переключатель языка
    target = slug or "index.html"
    s = s.replace('<a href="kk/%s" hreflang="kk" lang="kk">ҚАЗ</a><a href="%s" hreflang="ru" lang="ru" aria-current="true">РУС</a>' % (target, target),
                  '<a href="%s" hreflang="kk" lang="kk" aria-current="true">ҚАЗ</a><a href="../%s" hreflang="ru" lang="ru">РУС</a>' % (target, target))
    return s


def run(mode):
    kk = load_dict()
    missing = set()
    results = {}
    for page in PAGES:
        src = (ROOT / page).read_text(encoding="utf-8")
        t = Translator(kk, missing)
        t.feed(src)
        t.close()
        results[page] = localize_paths("".join(t.out), page)
    if missing:
        print("Нет перевода для %d строк:" % len(missing))
        for m in sorted(missing):
            print("  " + json.dumps(m, ensure_ascii=False))
        if mode == "build":
            sys.exit(1)
    if mode == "build":
        out = ROOT / "kk"
        out.mkdir(exist_ok=True)
        for page, text in results.items():
            (out / page).write_text(text, encoding="utf-8")
        print("Готово: kk/" + ", kk/".join(results))
    elif not missing:
        print("Все строки переведены.")


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "check")
