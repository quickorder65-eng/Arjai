/* ArJai · ДоСи — поведение сайта: анкета, WhatsApp-заявки, меню, клавиатура ДО–СИ, видео. */
(function () {
  "use strict";

  /* ===== НАСТРОЙКИ =====
     Номер WhatsApp для всех заявок. Какой номер основной — ещё не подтверждено
     (8 707 653 62 50 или 8 701 953 70 75), сейчас стоит первый. Меняется только здесь. */
  var WA_PHONE = "77076536250";

  var MESSAGES = {
    lesson: "Здравствуйте! Хочу записаться на занятие в ArJai.",
    diagnostic: "Здравствуйте! Хочу пройти диагностику.",
    dosi: "Здравствуйте! Хочу получить программу ДоСи для педагогов.",
    repetitor: "Здравствуйте! Интересует курс «Успешный репетитор ДоСи».",
    school: "Здравствуйте! Я представляю музыкальную школу. Хочу получить консультацию по внедрению ДоСи.",
    question: "Здравствуйте! У меня вопрос.",
    review: "Здравствуйте! Хочу оставить отзыв.",
    workshop: "Здравствуйте! Нужен ремонт или настройка инструмента.",
    studio: "Здравствуйте! Хочу записаться в студию звукозаписи."
  };

  var IMG = function (id, w) { return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + (w || 900) + "&q=75"; };
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

  function waLink(text) { return "https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(text); }

  /* Черновые пометки для согласования: только по адресу с ?draft=1 */
  try {
    if (new URLSearchParams(location.search).get("draft") === "1") document.documentElement.classList.add("draft");
  } catch (e) { /* старые браузеры */ }

  /* Ссылки data-wa ведут в WhatsApp с готовым текстом */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.setAttribute("href", waLink(MESSAGES[a.getAttribute("data-wa")] || MESSAGES.question));
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });

  /* Мобильное меню */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Закрыть" : "Меню";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Меню"; });
    });
  }

  /* Окно «Записаться» */
  var enroll = document.getElementById("enroll");
  document.querySelectorAll("[data-enroll]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      if (enroll && typeof enroll.showModal === "function") { e.preventDefault(); enroll.showModal(); }
    });
  });
  if (enroll) {
    enroll.addEventListener("click", function (e) {
      if (e.target === enroll || e.target.closest("[data-close]") || e.target.closest("a, [data-quiz]")) enroll.close();
    });
  }

  /* Вкладки отзывов */
  document.querySelectorAll("[role='tablist']").forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var next = e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length] : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length] : null;
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  /* Клавиатура ДО–СИ: звучит нота по нажатию */
  var NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
  var audioCtx = null;
  function playNote(freq) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var now = audioCtx.currentTime, gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      gain.connect(audioCtx.destination);
      [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(function (h) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = h[1]; o.frequency.value = freq * h[0]; g.gain.value = h[2];
        o.connect(g); g.connect(gain); o.start(now); o.stop(now + 1.7);
      });
    } catch (e) { /* без звука */ }
  }
  document.querySelectorAll(".key").forEach(function (key, i) {
    key.addEventListener("click", function () {
      playNote(NOTES[i]);
      key.classList.add("is-down");
      setTimeout(function () { key.classList.remove("is-down"); }, 180);
    });
  });

  /* Видео YouTube грузится только по нажатию */
  document.querySelectorAll(".video .play").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var frame = btn.closest(".frame");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + btn.getAttribute("data-yt") + "?autoplay=1&rel=0";
      iframe.title = btn.getAttribute("aria-label") || "Видео";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      frame.innerHTML = "";
      frame.appendChild(iframe);
    });
  });

  /* Форма в контактах → WhatsApp */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim(), err = form.querySelector(".error");
      if (!name) { err.textContent = "Напишите, как к вам обращаться."; form.elements.name.focus(); return; }
      err.textContent = "";
      var phone = form.elements.phone.value.trim(), msg = form.elements.message.value.trim();
      window.open(waLink("Здравствуйте! Меня зовут " + name + ".\nТема: " + form.elements.topic.value + "." + (phone ? "\nМой телефон: " + phone + "." : "") + (msg ? "\n" + msg : "")), "_blank", "noopener");
    });
  }

  /* =================== АНКЕТА =================== */
  var DIRECTIONS = [
    { id: "vocal", label: "Вокал", note: "дети и взрослые", img: "photo-1595422656857-ced3a4a0ce25", path: "learn" },
    { id: "piano", label: "Фортепиано", note: "и синтезатор", img: "photo-1452724931113-5ab6340ce080", path: "learn" },
    { id: "guitar", label: "Гитара", note: "бас-гитара, укулеле", img: "photo-1536594527669-2f555de54e95", path: "learn" },
    { id: "theory", label: "Теория музыки", note: "сольфеджио, композиция", img: "photo-1717699841805-e80424b1be43", path: "learn" },
    { id: "conduct", label: "Дирижирование", note: "индивидуально", img: "photo-1568057609581-8556cf900d3c", path: "learn" },
    { id: "teacher", label: "Я преподаю", note: "методика ДоСи для педагогов", img: "photo-1696522732406-065ef560da8c", path: "teach" },
    { id: "school", label: "У меня музыкальная школа", note: "внедрение ДоСи для всей команды", img: "photo-1684784176798-aae206e325e7", path: "school", wide: true }
  ];

  var STEPS = {
    learn: [
      { key: "level", title: "С какого уровня начинаем?", sub: "Подберём старт, чтобы было не скучно и не слишком сложно.", type: "cards", options: [
        { t: "С нуля", s: "Никогда не занимался(ась) музыкой" },
        { t: "Занимался(ась), но бросил(а)", s: "Хочу вернуться и не начинать заново" },
        { t: "Занимаюсь сейчас", s: "Хочу расти быстрее и увереннее" },
        { t: "Уже выступаю", s: "Нужен следующий уровень" } ] },
      { key: "age", title: "Сколько лет ученику?", sub: "Учим с 3 до 73 лет — программа строится под возраст.", type: "chips", options: [
        { t: "3–6", s: "лет" }, { t: "7–12", s: "лет" }, { t: "13–17", s: "лет" }, { t: "18–35", s: "лет" }, { t: "36+", s: "лет" } ] },
      { key: "format", title: "Как удобнее заниматься?", sub: "Онлайн занимаются даже из других стран.", type: "cards", options: [
        { t: "Очно в Алматы", s: "Занятия в студии" },
        { t: "Онлайн", s: "Из дома, из любого города" },
        { t: "Пока не знаю", s: "Подскажем на диагностике" } ] },
      { key: "goal", title: "Какая главная цель?", sub: "Последний вопрос — и рекомендация готова.", type: "cards", options: [
        { t: "Для себя, в удовольствие", s: "Петь и играть любимое" },
        { t: "Выйти на сцену", s: "Выступить на концерте студии" },
        { t: "Конкурс или поступление", s: "Серьёзная подготовка к цели" },
        { t: "Понять, есть ли способности", s: "Проверить слух и голос" } ] }
    ],
    teach: [
      { key: "level", title: "Какой у вас опыт преподавания?", sub: "ДоСи подходит и новичкам, и опытным педагогам.", type: "cards", options: [
        { t: "Только начинаю", s: "Первые ученики или их пока нет" },
        { t: "От 1 до 5 лет", s: "Есть практика, хочется системы" },
        { t: "Больше 5 лет", s: "Хочу систематизировать опыт" } ] },
      { key: "age", title: "Кого вы учите?", sub: "Методика адаптируется под возраст учеников.", type: "cards", options: [
        { t: "В основном детей", s: "" }, { t: "Подростков", s: "" }, { t: "Взрослых", s: "" }, { t: "Все возрасты", s: "" } ] },
      { key: "format", title: "Как удобнее учиться самому?", sub: "Программа проходит в группе или индивидуально.", type: "cards", options: [
        { t: "Онлайн", s: "Из любого города" }, { t: "Очно в Алматы", s: "В студии ArJai" }, { t: "Пока не знаю", s: "Обсудим вместе" } ] },
      { key: "goal", title: "Что важнее всего изменить?", sub: "Последний вопрос — и рекомендация готова.", type: "cards", options: [
        { t: "Понятная система урока", s: "Не придумывать каждый урок заново" },
        { t: "Ученики перестают уходить", s: "Удерживать интерес" },
        { t: "Больше учеников и дохода", s: "Расти как специалист" },
        { t: "Уверенность в методике", s: "Алгоритмы и инструменты" } ] }
    ],
    school: [
      { key: "level", title: "Сколько педагогов в школе?", sub: "От этого зависит формат внедрения.", type: "chips", options: [
        { t: "до 5", s: "педагогов" }, { t: "5–15", s: "педагогов" }, { t: "15+", s: "педагогов" } ] },
      { key: "age", title: "Кто ваши ученики?", sub: "", type: "cards", options: [
        { t: "В основном дети", s: "" }, { t: "Подростки", s: "" }, { t: "Взрослые", s: "" }, { t: "Все возрасты", s: "" } ] },
      { key: "format", title: "Где удобнее обучать педагогов?", sub: "", type: "cards", options: [
        { t: "Онлайн", s: "Вся команда из любой точки" }, { t: "Очно в Алматы", s: "Выезд или в студии" }, { t: "Смешанный формат", s: "Часть онлайн, часть очно" } ] },
      { key: "goal", title: "Какая задача главная?", sub: "Последний вопрос — и рекомендация готова.", type: "cards", options: [
        { t: "Единый стандарт для педагогов", s: "Все учат по одной логике" },
        { t: "Удержание учеников", s: "Меньше уходов" },
        { t: "Результат, видимый родителям", s: "Понятный прогресс" },
        { t: "Контроль качества уроков", s: "Прозрачность работы педагогов" } ] }
    ]
  };
  var NAMES = {
    learn: ["Уровень", "Возраст", "Формат", "Цель"],
    teach: ["Опыт", "Ученики", "Формат", "Цель"],
    school: ["Педагогов", "Ученики", "Формат", "Задача"]
  };

  var dlg = document.getElementById("quiz");
  if (!dlg) return;
  var body = dlg.querySelector(".qz-inner");
  var bodyScroll = dlg.querySelector(".qz-body");
  var segs = dlg.querySelectorAll(".qz-progress i");
  var backBtn = dlg.querySelector(".qz-back");
  var hint = dlg.querySelector(".kbd");
  var state = { step: 0, dir: null, answers: {} };
  var busy = false;

  function h(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function openQuiz(dirId) {
    state = { step: 0, dir: null, answers: {} };
    if (dirId) {
      var d = DIRECTIONS.filter(function (x) { return x.id === dirId; })[0];
      if (d) { state.dir = d; state.step = 1; }
    }
    render();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.style.overflow = "hidden";
  }
  dlg.addEventListener("close", function () { document.documentElement.style.overflow = ""; });
  dlg.querySelector(".qz-close").addEventListener("click", function () { dlg.close(); });
  backBtn.addEventListener("click", function () {
    if (state.step > 0) { state.step -= 1; render(); }
  });

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-quiz]");
    if (!t) return;
    e.preventDefault();
    openQuiz(t.getAttribute("data-quiz") || null);
  });

  function progress() {
    var filled = state.step >= 5 ? 5 : state.step + 1;
    segs.forEach(function (s, i) { s.classList.toggle("done", i < filled); });
  }

  function choose(btn, apply) {
    if (busy) return;
    busy = true;
    btn.classList.add("sel");
    setTimeout(function () { apply(); busy = false; render(); }, 260);
  }

  function render() {
    progress();
    backBtn.hidden = state.step === 0;
    if (hint) hint.hidden = state.step >= 5;
    body.innerHTML = "";
    var wrap = h("div", "qz-step");
    if (state.step === 0) {
      wrap.appendChild(h("p", "qz-count", "Вопрос 1 из 5"));
      wrap.appendChild(h("h2", null, "Что вас интересует?"));
      wrap.appendChild(h("p", "qz-sub", "Выберите направление — дальше 4 коротких вопроса."));
      var grid = h("div", "qz-grid photos");
      DIRECTIONS.forEach(function (d, i) {
        var b = h("button", "qz-opt" + (d.wide ? " wide" : "") + (state.dir === d ? " sel" : ""));
        b.type = "button";
        b.innerHTML = '<img src="' + IMG(d.img, 700) + '" alt="" loading="lazy"><span class="key-hint"><span>' + (i + 1) + '</span></span><span class="lbl"><b>' + esc(d.label) + '</b><small>' + esc(d.note) + "</small></span>";
        b.addEventListener("click", function () {
          choose(b, function () { if (state.dir !== d) state.answers = {}; state.dir = d; state.step = 1; });
        });
        grid.appendChild(b);
      });
      wrap.appendChild(grid);
    } else if (state.step <= 4) {
      var s = STEPS[state.dir.path][state.step - 1];
      wrap.appendChild(h("p", "qz-count", "Вопрос " + (state.step + 1) + " из 5 · " + esc(state.dir.label)));
      wrap.appendChild(h("h2", null, esc(s.title)));
      if (s.sub) wrap.appendChild(h("p", "qz-sub", esc(s.sub)));
      else wrap.appendChild(h("div", null, "")).style.height = "24px";
      var g = h("div", "qz-grid " + s.type);
      s.options.forEach(function (o, i) {
        var b = h("button", "qz-opt" + (state.answers[s.key] === o.t ? " sel" : ""));
        b.type = "button";
        b.innerHTML = '<span class="key-hint"><span>' + (i + 1) + "</span></span><b>" + esc(o.t) + "</b>" + (o.s ? "<small>" + esc(o.s) + "</small>" : "");
        b.addEventListener("click", function () { choose(b, function () { state.answers[s.key] = o.t; state.step += 1; }); });
        g.appendChild(b);
      });
      wrap.appendChild(g);
    } else {
      wrap.appendChild(result());
    }
    body.appendChild(wrap);
    bodyScroll.scrollTop = 0;
    var first = wrap.querySelector(".qz-opt");
    if (first && window.matchMedia("(hover: hover)").matches) first.focus({ preventScroll: true });
  }

  function summary() {
    var keys = ["level", "age", "format", "goal"], names = NAMES[state.dir.path];
    return ["Направление — " + state.dir.label].concat(keys.map(function (k, i) {
      var v = state.answers[k];
      if (k === "age" && state.dir.path === "learn") v += " лет";
      if (k === "level" && state.dir.path === "school") v += " педагогов";
      return names[i] + " — " + v;
    }));
  }

  function result() {
    var a = state.answers, p = state.dir.path, title, points = [], cta, ctaMsg, alt;
    if (p === "learn") {
      var stage = a.goal === "Конкурс или поступление" || a.goal === "Выйти на сцену" || a.level === "Уже выступаю";
      title = state.dir.label + ": начнём с диагностики";
      points.push("Диагностика: определяем уровень, цель и подходящий формат.");
      if (a.level === "Занимался(ась), но бросил(а)") points.push("Покажем, с какого места продолжить, чтобы не начинать всё заново.");
      if (a.level === "С нуля") points.push("Начинаем с нуля — слух и голос развиваются на занятиях.");
      if (stage) points.push("Добавим подготовку к сцене — у студии больше 60 концертов с учениками.");
      if (a.format === "Очно в Алматы") points.push("Очно: от 8 000 ₸ за 60 минут или абонемент 64 000 ₸ в месяц.");
      else if (a.format === "Онлайн") points.push("Онлайн: от 6 000 ₸ за 60 минут или абонемент 48 000 ₸ в месяц.");
      else points.push("Очно от 8 000 ₸, онлайн от 6 000 ₸ за 60 минут — формат выберем вместе.");
      cta = "Записаться на диагностику"; ctaMsg = "Хочу пройти диагностику.";
      alt = { text: "Сразу записаться на занятие", msg: "Хочу записаться на занятие." };
    } else if (p === "teach") {
      var biz = a.goal === "Больше учеников и дохода";
      title = biz ? "Вам подойдёт курс «Успешный репетитор ДоСи»" : "Вам подойдёт программа ДоСи для педагогов";
      points.push("Четыре модуля: диагностика ученика, система обучения, методика, профессиональный репетитор.");
      points.push(a.level === "Только начинаю" ? "Готовая логика урока от ДО до СИ — с первых учеников." : "Систематизируете опыт и вырастете в ценности как специалист.");
      if (biz) points.push("Отдельный блок — как превратить знания в услугу, которая приводит учеников.");
      points.push("Формат: " + (a.format === "Пока не знаю" ? "онлайн или очно — подберём вместе." : a.format.toLowerCase() + ", в группе или индивидуально."));
      cta = "Получить программу ДоСи"; ctaMsg = "Хочу получить программу ДоСи.";
      alt = biz ? { text: "Подробнее о курсе", href: "repetitor.html" } : { text: "Задать вопрос", msg: "У меня вопрос по программе ДоСи." };
    } else {
      title = "Внедрение ДоСи в вашу школу";
      points.push("Путь: диагностика школы → обучение педагогов → внедрение → контроль → оценка результата.");
      points.push("Ваша главная задача: " + a.goal.toLowerCase() + " — с неё и начнём.");
      points.push("Формат и стоимость рассчитаем на консультации под " + a.level + " педагогов.");
      cta = "Получить консультацию"; ctaMsg = "Я представляю музыкальную школу, хочу консультацию по внедрению ДоСи.";
      alt = { text: "Подробнее для школ", href: "shkolam.html" };
    }
    var sum = summary();
    var box = h("div", "qz-result");
    box.innerHTML =
      '<div class="pic"><img src="' + IMG(state.dir.img, 1000) + '" alt=""><span class="stamp"><i>✓</i>Анкета пройдена</span></div>' +
      '<div><p class="qz-count">Ваша рекомендация</p><h2>' + esc(title) + '</h2>' +
      '<ul class="qz-points">' + points.map(function (t) { return "<li>" + ICON_CHECK + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul>" +
      '<div class="qz-answers">' + sum.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
      '<div class="qz-name"><label for="qz-name">Как к вам обращаться? (можно не заполнять)</label><input id="qz-name" type="text" autocomplete="name" placeholder="Например, Айгерим"></div>' +
      '<button type="button" class="quiz-cta qz-send">' + esc(cta) + ' в WhatsApp<span class="arrow">' + ICON_ARROW + "</span></button>" +
      '<div class="qz-alt"></div></div>';
    var input = box.querySelector("#qz-name");
    function compose(msg) {
      var name = input.value.trim();
      return "Здравствуйте!" + (name ? " Меня зовут " + name + "." : "") + " " + msg + "\nПрошёл(ла) анкету на сайте:\n" + sum.join("\n");
    }
    box.querySelector(".qz-send").addEventListener("click", function () { window.open(waLink(compose(ctaMsg)), "_blank", "noopener"); });
    var altBox = box.querySelector(".qz-alt");
    var altEl = h(alt.href ? "a" : "button", null, esc(alt.text));
    if (alt.href) altEl.href = alt.href; else { altEl.type = "button"; altEl.addEventListener("click", function () { window.open(waLink(compose(alt.msg)), "_blank", "noopener"); }); }
    altBox.appendChild(altEl);
    var again = h("button", null, "Пройти заново"); again.type = "button";
    again.addEventListener("click", function () { state = { step: 0, dir: null, answers: {} }; render(); });
    altBox.appendChild(again);
    return box;
  }

  /* Цифры на клавиатуре выбирают вариант */
  dlg.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT") return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      var opts = body.querySelectorAll(".qz-opt");
      if (opts[n - 1]) { e.preventDefault(); opts[n - 1].click(); }
    }
    if (e.key === "Backspace" && state.step > 0) { e.preventDefault(); backBtn.click(); }
  });

  /* Плавающая кнопка на телефоне: прячется на первом экране и в контактах */
  var floatBtn = document.querySelector(".float-cta");
  if (floatBtn && "IntersectionObserver" in window) {
    var hidden = { hero: true, contacts: false };
    var upd = function () { floatBtn.classList.toggle("hide", hidden.hero || hidden.contacts); };
    var hero = document.querySelector(".hero, .page-hero");
    var contacts = document.getElementById("kontakty");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target === hero) hidden.hero = en.isIntersecting;
        if (en.target === contacts) hidden.contacts = en.isIntersecting;
      });
      upd();
    }, { threshold: 0.15 });
    if (hero) io.observe(hero); else hidden.hero = false;
    if (contacts) io.observe(contacts);
    upd();
  }

  /* Открыть анкету сразу по ссылке …#quiz */
  if (location.hash.indexOf("#quiz") === 0) openQuiz(location.hash.split("-")[1] || null);
})();
