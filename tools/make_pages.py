#!/usr/bin/env python3
"""Сборка русских страниц сайта из общих частей.

Шапка, подвал, анкета и <head> одинаковые на всех страницах и живут здесь.
Содержимое каждой страницы — в tools/pages/<страница>.html (только то, что внутри <main>).

  python3 tools/make_pages.py          — собрать index.html, zanyatiya.html, … в корне
  python3 tools/build_kk.py build      — затем собрать казахскую версию в kk/

Блок FAQ для поисковиков (schema.org FAQPage) строится сам из <details> на странице.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "pages"
BASE = "https://quickorder65-eng.github.io/Arjai/"
VER = "20261022b"

ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

ORG = {
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": BASE + "#org",
    "name": "Музыкальная студия ArJai",
    "alternateName": ["ArJai", "ДоСи", "Творческая мастерская Архаровых", "Студия Сауле Джайлауовой"],
    "description": "Музыкальная семейная студия ArJai в Алматы и авторская система обучения ДоСи. Уроки вокала, фортепиано и синтезатора, гитары, укулеле, теории музыки, сольфеджио и дирижирования для детей и взрослых от 3 до 73 лет, очно и онлайн. Мастерская по ремонту и настройке инструментов, студия звукозаписи. Обучение педагогов по системе ДоСи.",
    "url": BASE,
    "logo": BASE + "assets/apple-touch-icon.png",
    "image": [BASE + "assets/og-image.png", BASE + "assets/img/semya-arjai.jpg"],
    "foundingDate": "2014",
    "telephone": "+77076536250",
    "priceRange": "500–64 000 ₸",
    "address": {"@type": "PostalAddress", "addressLocality": "Алматы", "addressCountry": "KZ"},
    "areaServed": [{"@type": "City", "name": "Алматы"}, {"@type": "Country", "name": "Казахстан"}],
    "founder": [{"@id": BASE + "#saule"}, {"@type": "Person", "name": "Кайрат Архаров"}],
    "contactPoint": [
        {"@type": "ContactPoint", "telephone": "+77076536250", "contactType": "customer service", "availableLanguage": ["ru", "kk"]},
        {"@type": "ContactPoint", "telephone": "+77000283648", "contactType": "customer service", "availableLanguage": ["ru", "kk"]},
    ],
    "knowsAbout": ["вокал", "фортепиано", "синтезатор", "гитара", "бас-гитара", "укулеле", "сольфеджио", "гармония", "композиция", "теория музыки", "дирижирование", "методика преподавания музыки", "ремонт гитар", "настройка фортепиано", "звукозапись"],
    "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Уроки музыки и услуги студии", "itemListElement": [
        {"@type": "Offer", "name": "Индивидуальный урок музыки очно в Алматы, 60 минут", "price": "8000", "priceCurrency": "KZT"},
        {"@type": "Offer", "name": "Индивидуальный урок музыки онлайн, 60 минут", "price": "6000", "priceCurrency": "KZT"},
        {"@type": "Offer", "name": "Абонемент очно, 2+ занятия в неделю, месяц", "price": "64000", "priceCurrency": "KZT"},
        {"@type": "Offer", "name": "Абонемент онлайн, 2+ занятия в неделю, месяц", "price": "48000", "priceCurrency": "KZT"},
        {"@type": "Offer", "name": "Полная настройка и чистка фортепиано", "price": "35000", "priceCurrency": "KZT"},
        {"@type": "Offer", "name": "Полная смена струн на гитаре", "price": "3000", "priceCurrency": "KZT"},
    ]},
    "sameAs": ["https://t.me/DoSiok", "https://www.instagram.com/zhailausaule", "https://www.youtube.com/@arjai5068", "https://vk.com/d.sulya", "https://www.tiktok.com/@arjai640"],
}
SAULE = {
    "@type": "Person", "@id": BASE + "#saule", "name": "Сауле Джайлауова", "alternateName": "Dzhailauova Saule",
    "jobTitle": "Основатель студии ArJai, автор системы обучения ДоСи",
    "worksFor": {"@id": BASE + "#org"},
    "award": "Благодарственное письмо организаторов международного конкурса «Fiestalonia — Almaty» (Fiestalonia Milenio, Испания, и акимат Алматы), 2019",
}

# страница → (заголовок, описание, og-заголовок, крошки [(имя, путь)])
PAGES = {
    "index.html": dict(
        title="ArJai и ДоСи — уроки вокала, фортепиано и гитары в Алматы и онлайн",
        desc="Музыкальная семейная студия ArJai в Алматы и авторская система обучения ДоСи. Вокал, фортепиано, гитара, теория для детей и взрослых от 3 до 73 лет, очно и онлайн. Мастерская, звукозапись, обучение педагогов. Анкета — и диагностика бесплатно.",
        og="ArJai и ДоСи — музыкальная студия и система обучения",
        crumbs=None),
    "zanyatiya.html": dict(
        title="Уроки вокала, фортепиано и гитары для детей и взрослых — студия ArJai, Алматы",
        desc="Занятия в студии ArJai: вокал, фортепиано и синтезатор, гитара, укулеле, теория музыки, дирижирование. Для детей и родителей, для взрослых с нуля, подготовка к конкурсам и поступлению. Очно в Алматы и онлайн.",
        og="Занятия в ArJai: для детей, взрослых и подготовка к сцене",
        crumbs=[("Главная", ""), ("Занятия", "zanyatiya.html")]),
    "dosi.html": dict(
        title="ДоСи — авторская система обучения учеников и учителей Сауле Джайлауовой",
        desc="Система ДоСи: авторская программа, методика, структура и результат. Обучение педагогов музыкальных школ и студий, самозанятых репетиторов и внедрение для владельцев школ. Все пособия входят в обучение.",
        og="ДоСи — система обучения учеников и учителей",
        crumbs=[("Главная", ""), ("ДоСи", "dosi.html")]),
    "repetitor.html": dict(
        title="Успешный репетитор ДоСи — курс для самозанятых педагогов музыки",
        desc="Курс «Успешный репетитор ДоСи» для самозанятых педагогов и репетиторов музыки: система урока, методика, все пособия и путь к стабильному потоку учеников. Онлайн и в Алматы.",
        og="Успешный репетитор ДоСи — курс для педагогов",
        crumbs=[("Главная", ""), ("ДоСи", "dosi.html"), ("Успешный репетитор ДоСи", "repetitor.html")]),
    "shkolam.html": dict(
        title="ДоСи для владельцев музыкальных школ и студий — единый стандарт обучения",
        desc="Внедрение системы ДоСи в музыкальную школу или студию: единый стандарт качества для педагогов, видимый результат для родителей, контроль качества уроков. Алматы и онлайн.",
        og="ДоСи для владельцев школ и студий",
        crumbs=[("Главная", ""), ("ДоСи", "dosi.html"), ("Для владельцев", "shkolam.html")]),
    "masterskaya.html": dict(
        title="Мастерская ArJai — ремонт и настройка гитар, фортепиано и синтезаторов в Алматы",
        desc="Мастерская ArJai в Алматы: ремонт, настройка и обслуживание гитар, настройка и регулировка фортепиано, диагностика и ремонт синтезаторов. Цены: смена струн от 500 ₸, настройка фортепиано 35 000 ₸.",
        og="Мастерская ArJai: инструменты звучат — вы вдохновляете",
        crumbs=[("Главная", ""), ("Мастерская", "masterskaya.html")]),
    "zvukozapis.html": dict(
        title="Студия звукозаписи ArJai в Алматы — запись вокала и инструментов",
        desc="Студия звукозаписи ArJai в Алматы: запись вокала и инструментов для учеников студии и всех желающих. От 10 000 ₸ в час.",
        og="Студия звукозаписи ArJai",
        crumbs=[("Главная", ""), ("Звукозапись", "zvukozapis.html")]),
}


def ld(page, body):
    meta = PAGES[page]
    graph = []
    if page == "index.html":
        graph += [{"@type": "WebSite", "@id": BASE + "#website", "url": BASE, "name": "ArJai", "alternateName": ["Студия ArJai", "ДоСи"], "inLanguage": "ru"}, ORG, SAULE]
    if meta["crumbs"]:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + p} for i, (n, p) in enumerate(meta["crumbs"])]})
    faq = []
    for q, a in re.findall(r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", body, re.S):
        clean = lambda s: html.unescape(re.sub(r"\s+", " ", re.sub(r"<span class=\"draft-note\">.*?</span>|<[^>]+>", "", s))).strip()
        faq.append({"@type": "Question", "name": clean(q), "acceptedAnswer": {"@type": "Answer", "text": clean(a)}})
    if faq:
        graph.append({"@type": "FAQPage", "@id": BASE + ("" if page == "index.html" else page) + "#faq", "mainEntity": faq})
    if not graph:
        return ""
    return '<script type="application/ld+json">\n' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1) + "\n</script>\n"


def head(page, body):
    m = PAGES[page]
    slug = "" if page == "index.html" else page
    url = BASE + slug
    pre = ""
    if page == "index.html":
        pre = ('<link rel="preload" href="assets/fonts/onest-cyrillic-500-normal.woff2" as="font" type="font/woff2" crossorigin>\n'
               '<link rel="preload" href="assets/fonts/onest-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n')
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google" content="notranslate">
<title>{m['title']}</title>
<meta name="description" content="{m['desc']}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="ru" href="{url}">
<link rel="alternate" hreflang="kk" href="{BASE}kk/{slug}">
<link rel="alternate" hreflang="x-default" href="{url}">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:locale:alternate" content="kk_KZ">
<meta property="og:site_name" content="ArJai · ДоСи">
<meta property="og:title" content="{m['og']}">
<meta property="og:description" content="{m['desc']}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{BASE}assets/og-image.png">
<link rel="icon" href="assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="assets/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
{pre}<link rel="stylesheet" href="assets/styles.css?v={VER}">
{ld(page, body)}</head>
<body class="notranslate" translate="no">
<a class="skip" href="#main">Перейти к содержанию</a>
<div class="draft-bar" role="note">Режим согласования: жёлтым отмечены данные, которые нужно уточнить у заказчика.</div>
"""


def header(page):
    home = "" if page == "index.html" else "index.html"
    target = page
    return f"""
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="{home or '#top'}" aria-label="ArJai и ДоСи — на главную">
      <span class="brand-item"><img class="arjai-logo" src="assets/img/arjai-logo.png" alt="ArJai" width="74" height="48"><span class="brand-cap">студия, где учатся</span></span>
      <span class="brand-item brand-dosi"><img class="dosi-mark" src="assets/img/dosi-znak.png" alt="" width="40" height="40"><img class="dosi-word" src="assets/img/dosi-slovo.png" alt="ДоСи" width="73" height="22"><span class="brand-cap">система обучения</span></span>
    </a>
    <nav class="nav" id="nav" aria-label="Основное меню">
      <a href="{home}#arjai">ArJai</a>
      <a href="zanyatiya.html">Занятия</a>
      <a href="dosi.html">ДоСи</a>
      <a href="{home}#rezultaty">Результаты</a>
      <a href="{home}#saule">О Сауле</a>
      <a href="{home}#otzyvy">Отзывы</a>
      <a href="#kontakty">Контакты</a>
    </nav>
    <nav class="lang-switch" aria-label="Язык сайта"><a href="kk/{target}" hreflang="kk" lang="kk">ҚАЗ</a><a href="{target}" hreflang="ru" lang="ru" aria-current="true">РУС</a></nav>
    <button class="menu-toggle" type="button" aria-controls="nav" aria-expanded="false">Меню</button>
    <a class="btn btn-red header-cta" href="{home}#anketa" data-quiz>Записаться</a>
  </div>
</header>
"""


def contacts():
    return f"""
<!-- ===== Заявка и контакты ===== -->
<section class="section dark" id="kontakty">
  <div class="wrap contacts">
    <div>
      <span class="tag">Запишитесь в ArJai</span>
      <h2>Оставить заявку</h2>
      <p class="lead" style="margin:18px 0 26px">Пройдите анкету — ответы сразу придут нам в WhatsApp, и мы пригласим вас на бесплатную диагностику.</p>
      <button class="quiz-cta" type="button" data-quiz><span class="qc-text">Пройти анкету<small>около минуты · диагностика бесплатно</small></span><span class="arrow">{ICON_ARROW}</span></button>
      <div class="phones">
        <a href="tel:+77076536250">+7 707 653 62 50</a><small>Телефон и WhatsApp <span class="draft-note">какой номер основной для WhatsApp</span></small>
        <a href="tel:+77000283648">+7 700 028 36 48</a><small>Телефон</small>
      </div>
      <p class="muted" style="margin-bottom:20px">Алматы — очно, весь мир — онлайн. <span class="draft-note">адрес студии, 2ГИС и e-mail</span></p>
      <div class="socials" aria-label="Соцсети">
        <a href="https://t.me/DoSiok" target="_blank" rel="noopener">Telegram</a>
        <a href="https://www.instagram.com/zhailausaule" target="_blank" rel="noopener">Instagram</a>
        <a href="https://www.youtube.com/@arjai5068" target="_blank" rel="noopener">YouTube</a>
        <a href="https://www.tiktok.com/@arjai640" target="_blank" rel="noopener">TikTok</a>
        <a href="https://vk.com/d.sulya" target="_blank" rel="noopener">VK</a>
      </div>
    </div>
    <form class="form" id="contact-form" novalidate>
      <h3>Или напишите нам</h3>
      <p>Откроется WhatsApp с готовым сообщением — останется нажать «Отправить».</p>
      <div class="field"><label for="f-name">Как к вам обращаться</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
      <div class="field"><label for="f-phone">Телефон, если удобнее звонок</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+7"></div>
      <div class="field"><label for="f-topic">Что вас интересует</label>
        <select id="f-topic" name="topic">
          <option>Записаться на занятие</option>
          <option>Пройти бесплатную диагностику</option>
          <option>Подготовка к конкурсу или поступлению</option>
          <option>Получить программу ДоСи</option>
          <option>ДоСи для школы или студии</option>
          <option>Мастерская: ремонт инструмента</option>
          <option>Студия звукозаписи</option>
          <option>Другое</option>
        </select>
      </div>
      <div class="field"><label for="f-msg">Комментарий</label><textarea id="f-msg" name="message" placeholder="Например: ребёнку 8 лет, хотим вокал онлайн"></textarea></div>
      <button class="btn btn-red" type="submit">Отправить в WhatsApp</button>
      <p class="error" role="alert"></p>
      <p class="fine">Сайт ничего не хранит — сообщение уходит напрямую в WhatsApp.</p>
    </form>
  </div>
</section>
"""


def footer(page):
    home = "" if page == "index.html" else "index.html"
    return f"""
<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <img class="arjai-logo" src="assets/img/arjai-logo.png" alt="ArJai" width="74" height="48">
      <span>© 2014–2026, Алматы. Преподаём с 90-х.</span>
    </div>
    <div class="footer-links">
      <a href="{home or '#top'}">Главная</a>
      <a href="zanyatiya.html">Занятия</a>
      <a href="dosi.html">Система ДоСи</a>
      <a href="repetitor.html">Успешный репетитор ДоСи</a>
      <a href="shkolam.html">ДоСи для владельцев</a>
      <a href="masterskaya.html">Мастерская</a>
      <a href="zvukozapis.html">Звукозапись</a>
    </div>
    <p class="credits">ДоСи — авторская система обучения Сауле Джайлауовой. Часть фотографий инструментов — <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>, видео — YouTube-канал студии. Звук рояля — Salamander Grand Piano (Alexander Holm, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>).</p>
  </div>
</footer>

<button class="float-cta hide" type="button" data-quiz>Анкета — диагностика бесплатно<span class="arrow">{ICON_ARROW}</span></button>

<dialog class="quiz-dlg" id="quiz" aria-label="Анкета">
  <div class="qz">
    <div class="qz-top">
      <img class="arjai-logo" src="assets/img/arjai-logo.png" alt="ArJai" width="74" height="48">
      <div class="qz-progress" aria-hidden="true"></div>
      <button class="close-btn qz-close" type="button" aria-label="Закрыть анкету">×</button>
    </div>
    <div class="qz-body"><div class="qz-inner"></div></div>
    <div class="qz-foot">
      <button class="qz-back" type="button" hidden><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Назад</button>
      <span class="kbd">Можно отвечать цифрами на клавиатуре</span>
    </div>
  </div>
</dialog>

<script src="assets/script.js?v={VER}"></script>
</body>
</html>
"""


def crumbs_html(page):
    c = PAGES[page]["crumbs"]
    if not c:
        return ""
    parts = []
    for i, (n, p) in enumerate(c):
        if i == len(c) - 1:
            parts.append(n)
        else:
            parts.append('<a href="%s">%s</a>' % (p or "index.html", n))
    return '<p class="crumbs">' + " / ".join(parts) + "</p>"


def build():
    for page in PAGES:
        body = (SRC / page).read_text(encoding="utf-8")
        body = body.replace("{{CRUMBS}}", crumbs_html(page)).replace("{{ARROW}}", ICON_ARROW)
        out = head(page, body) + header(page) + '\n<main id="main">\n' + body.rstrip() + "\n" + contacts() + "\n</main>\n" + footer(page)
        (ROOT / page).write_text(out, encoding="utf-8")
        print("собрано:", page)


if __name__ == "__main__":
    build()
