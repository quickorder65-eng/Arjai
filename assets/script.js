/* ArJai · ДоСи — поведение сайта. Без анимаций и сторонних библиотек. */
(function () {
  "use strict";

  /* ===== НАСТРОЙКИ =====
     Номер WhatsApp, на который уходят все заявки с сайта.
     ВНИМАНИЕ: какой из двух номеров основной для WhatsApp — ещё не подтверждено
     (8 707 653 62 50 или 8 701 953 70 75). Сейчас стоит первый. Меняется только здесь. */
  var WA_PHONE = "77076536250";

  var MESSAGES = {
    lesson: "Здравствуйте! Хочу записаться на занятие в ArJai.",
    diagnostic: "Здравствуйте! Хочу пройти диагностику.",
    dosi: "Здравствуйте! Хочу получить программу ДоСи для педагогов.",
    repetitor: "Здравствуйте! Интересует курс «Успешный репетитор ДоСи».",
    school: "Здравствуйте! Я представляю музыкальную школу. Хочу получить консультацию по внедрению ДоСи.",
    question: "Здравствуйте! У меня вопрос.",
    workshop: "Здравствуйте! Нужен ремонт или настройка инструмента.",
    studio: "Здравствуйте! Хочу записаться в студию звукозаписи."
  };

  function waLink(text) {
    return "https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(text);
  }

  /* Черновые пометки для согласования с заказчиком: видны только по адресу с ?draft=1 */
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get("draft") === "1") document.documentElement.classList.add("draft");
  } catch (e) { /* старые браузеры */ }

  /* Клавиатура ДО–СИ: клавиша подсвечивается и звучит нота (только по нажатию) */
  var NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
  var audioCtx = null;
  function playNote(freq) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var now = audioCtx.currentTime;
      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      gain.connect(audioCtx.destination);
      [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(function (h) {
        var o = audioCtx.createOscillator(); var g = audioCtx.createGain();
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

  /* Видео YouTube грузится только по нажатию — страница остаётся лёгкой */
  document.querySelectorAll(".video .play").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var frame = btn.closest(".frame");
      var id = btn.getAttribute("data-yt");
      var title = btn.getAttribute("aria-label") || "Видео";
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = title;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      frame.innerHTML = "";
      frame.appendChild(iframe);
    });
  });

  /* Кнопки с data-wa ведут в WhatsApp с готовым текстом */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var key = a.getAttribute("data-wa");
    var text = MESSAGES[key] || MESSAGES.question;
    a.setAttribute("href", waLink(text));
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
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Меню";
      });
    });
  }

  /* Окно «Записаться» с тремя ветками */
  var dialog = document.getElementById("enroll");
  document.querySelectorAll("[data-enroll]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      if (dialog && typeof dialog.showModal === "function") {
        e.preventDefault();
        dialog.showModal();
      }
    });
  });
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
      if (e.target.closest("[data-close]")) dialog.close();
      if (e.target.closest("a")) dialog.close();
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
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  /* Форма обратной связи → WhatsApp */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var topic = form.elements.topic.value;
      var msg = form.elements.message.value.trim();
      var err = form.querySelector(".error");
      if (!name) { err.textContent = "Напишите, как к вам обращаться."; form.elements.name.focus(); return; }
      err.textContent = "";
      var text = "Здравствуйте! Меня зовут " + name + ".\nТема: " + topic + "." +
        (phone ? "\nМой телефон: " + phone + "." : "") +
        (msg ? "\n" + msg : "");
      window.open(waLink(text), "_blank", "noopener");
    });
  }

  /* ===== Анкета на 5 шагов ===== */
  var quizRoot = document.getElementById("quiz-app");
  if (!quizRoot) return;

  var DIRECTIONS = [
    { id: "vocal", label: "Вокал", path: "learn" },
    { id: "piano", label: "Фортепиано или синтезатор", path: "learn" },
    { id: "guitar", label: "Гитара, бас-гитара или укулеле", path: "learn" },
    { id: "theory", label: "Теория музыки, сольфеджио, композиция", path: "learn" },
    { id: "conduct", label: "Дирижирование", path: "learn" },
    { id: "teacher", label: "Я преподаю: методика ДоСи", path: "teach", note: "для педагогов и репетиторов" },
    { id: "school", label: "ДоСи для музыкальной школы", path: "school", note: "для руководителей школ и студий" }
  ];

  var STEPS = {
    learn: [
      { key: "level", title: "Какой сейчас уровень?", options: ["Начинаю с нуля", "Занимался(ась) раньше, но бросил(а)", "Занимаюсь сейчас, хочу расти", "Уже выступаю, нужен следующий уровень"] },
      { key: "age", title: "Сколько лет ученику?", hint: "Учим с 3 до 73 лет.", options: ["3–6 лет", "7–12 лет", "13–17 лет", "18–35 лет", "36 лет и старше"] },
      { key: "format", title: "Какой формат удобнее?", options: ["Очно в Алматы", "Онлайн", "Пока не знаю"] },
      { key: "goal", title: "Какая главная цель?", options: ["Для себя, в удовольствие", "Выступать на сцене", "Конкурс или поступление", "Понять, есть ли способности"] }
    ],
    teach: [
      { key: "level", title: "Какой у вас опыт преподавания?", options: ["Только начинаю преподавать", "От 1 до 5 лет", "Больше 5 лет"] },
      { key: "age", title: "Кого вы учите?", options: ["В основном детей", "Подростков", "Взрослых", "Учеников всех возрастов"] },
      { key: "format", title: "Как удобнее учиться самому?", options: ["Онлайн", "Очно в Алматы", "Пока не знаю"] },
      { key: "goal", title: "Что важнее всего изменить?", options: ["Понятная система урока", "Ученики перестают уходить", "Больше учеников и дохода", "Уверенность в методике"] }
    ],
    school: [
      { key: "level", title: "Сколько педагогов в школе?", options: ["До 5", "От 5 до 15", "Больше 15"] },
      { key: "age", title: "Кто ваши ученики?", options: ["В основном дети", "Подростки", "Взрослые", "Все возрасты"] },
      { key: "format", title: "Где удобнее обучать педагогов?", options: ["Онлайн", "Очно в Алматы", "Смешанный формат"] },
      { key: "goal", title: "Какая задача главная?", options: ["Единый стандарт для педагогов", "Удержание учеников", "Видимый результат для родителей", "Контроль качества уроков"] }
    ]
  };

  var state = { step: 0, dir: null, answers: {} };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function header(stepNum) {
    var wrap = el("div");
    wrap.appendChild(el("div", { class: "quiz-top" }, [
      el("span", { text: "Шаг " + stepNum + " из 5" }),
      el("span", { text: "около минуты" })
    ]));
    var bar = el("div", { class: "quiz-bar", "aria-hidden": "true" });
    var fill = el("i");
    fill.style.width = (stepNum / 5 * 100) + "%";
    bar.appendChild(fill);
    wrap.appendChild(bar);
    return wrap;
  }

  function quizNav(showBack) {
    var row = el("div", { class: "quiz-nav" });
    var back = el("button", { type: "button", class: "text-btn", text: "← Назад" });
    back.hidden = !showBack;
    back.addEventListener("click", function () { state.step -= 1; render(true); });
    row.appendChild(back);
    return row;
  }

  function render(focus) {
    quizRoot.innerHTML = "";
    if (state.step === 0) {
      quizRoot.appendChild(header(1));
      quizRoot.appendChild(el("h3", { text: "Что вас интересует?", id: "quiz-q" }));
      var opts = el("div", { class: "options", role: "group", "aria-labelledby": "quiz-q" });
      DIRECTIONS.forEach(function (d) {
        var b = el("button", { type: "button", class: "option", "aria-pressed": state.dir === d ? "true" : "false" }, [
          document.createTextNode(d.label),
          d.note ? el("small", { text: d.note }) : null
        ]);
        b.addEventListener("click", function () {
          if (state.dir !== d) state.answers = {};
          state.dir = d; state.step = 1; render(true);
        });
        opts.appendChild(b);
      });
      quizRoot.appendChild(opts);
      quizRoot.appendChild(quizNav(false));
    } else if (state.step <= 4) {
      var s = STEPS[state.dir.path][state.step - 1];
      quizRoot.appendChild(header(state.step + 1));
      quizRoot.appendChild(el("h3", { text: s.title, id: "quiz-q" }));
      if (s.hint) quizRoot.appendChild(el("p", { class: "hint", text: s.hint }));
      var group = el("div", { class: "options", role: "group", "aria-labelledby": "quiz-q" });
      s.options.forEach(function (o) {
        var b = el("button", { type: "button", class: "option", "aria-pressed": state.answers[s.key] === o ? "true" : "false", text: o });
        b.addEventListener("click", function () {
          state.answers[s.key] = o; state.step += 1; render(true);
        });
        group.appendChild(b);
      });
      quizRoot.appendChild(group);
      quizRoot.appendChild(quizNav(true));
    } else {
      renderResult();
    }
    if (focus) {
      var q = quizRoot.querySelector("h3");
      if (q) { q.setAttribute("tabindex", "-1"); q.focus({ preventScroll: true }); }
      var top = quizRoot.getBoundingClientRect().top;
      if (top < 0) quizRoot.scrollIntoView({ block: "start" });
    }
  }

  function summaryText() {
    var a = state.answers;
    var parts = ["Направление — " + state.dir.label];
    var names = state.dir.path === "learn"
      ? ["Уровень", "Возраст ученика", "Формат", "Цель"]
      : state.dir.path === "teach"
        ? ["Опыт преподавания", "Ученики", "Формат", "Цель"]
        : ["Педагогов в школе", "Ученики", "Формат", "Задача"];
    ["level", "age", "format", "goal"].forEach(function (k, i) { parts.push(names[i] + " — " + a[k]); });
    return parts;
  }

  function renderResult() {
    var a = state.answers;
    var p = state.dir.path;
    var label, title, points = [], primary, secondary;

    if (p === "learn") {
      label = "Рекомендуем в ArJai";
      var stage = (a.goal === "Конкурс или поступление" || a.goal === "Выступать на сцене" || a.level === "Уже выступаю, нужен следующий уровень");
      title = "Диагностика, затем индивидуальные занятия: " + state.dir.label.toLowerCase();
      points.push("Начинаем с диагностики: определяем уровень, цель и подходящий формат.");
      if (a.level === "Занимался(ась) раньше, но бросил(а)") points.push("Диагностика покажет, с какого места продолжить, чтобы не начинать всё заново.");
      if (stage) points.push("Добавим подготовку к конкурсам и выступлениям — у студии 60+ живых концертов с учениками.");
      if (a.format === "Очно в Алматы") points.push("Очно: от 8 000 ₸ за 60 минут, абонемент 64 000 ₸ в месяц.");
      else if (a.format === "Онлайн") points.push("Онлайн: от 6 000 ₸ за 60 минут, абонемент 48 000 ₸ в месяц.");
      else points.push("Очно от 8 000 ₸, онлайн от 6 000 ₸ за 60 минут — формат выберем на диагностике.");
      primary = { text: "Пройти диагностику", msg: "Здравствуйте! Прошёл(ла) анкету на сайте и хочу пройти диагностику." };
      secondary = { text: "Сразу записаться на занятие", msg: "Здравствуйте! Прошёл(ла) анкету на сайте и хочу записаться на занятие." };
    } else if (p === "teach") {
      label = "Рекомендуем в ДоСи";
      var business = (a.goal === "Больше учеников и дохода");
      title = business ? "Курс «Успешный репетитор ДоСи»" : "Программа ДоСи для педагогов";
      points.push("Четыре модуля: диагностика ученика, система обучения, методика, профессиональный репетитор.");
      if (a.level === "Только начинаю преподавать") points.push("Подходит начинающим: даёт готовую логику урока от ДО до СИ.");
      else points.push("Для опытных педагогов — систематизация того, что уже работает, и рост ценности как специалиста.");
      if (business) points.push("Отдельный блок — бизнес-установка: как превратить знания в услугу, которая приводит учеников.");
      primary = { text: "Получить программу ДоСи", msg: "Здравствуйте! Прошёл(ла) анкету на сайте. Хочу получить программу ДоСи." };
      secondary = business ? { text: "Подробнее о курсе", href: "repetitor.html" } : { text: "Задать вопрос", msg: "Здравствуйте! У меня вопрос по программе ДоСи." };
    } else {
      label = "Рекомендуем для вашей школы";
      title = "Внедрение системы ДоСи в вашу школу";
      points.push("Путь: диагностика → обучение педагогов → внедрение → контроль → оценка результата.");
      points.push("Главная задача, которую вы отметили: " + a.goal.toLowerCase() + ".");
      primary = { text: "Получить консультацию по внедрению ДоСи", msg: "Здравствуйте! Я представляю музыкальную школу, прошёл(ла) анкету на сайте. Хочу консультацию по внедрению ДоСи." };
      secondary = { text: "Подробнее для школ", href: "shkolam.html" };
    }

    var summary = summaryText();
    var box = el("div", { class: "result" });
    box.appendChild(el("p", { class: "rec", text: label }));
    box.appendChild(el("h3", { text: title }));
    var ul = el("ul");
    points.forEach(function (t) { ul.appendChild(el("li", { text: t })); });
    box.appendChild(ul);
    box.appendChild(el("p", { class: "summary", text: "Ваши ответы: " + summary.join("; ") + ". Они придут вместе с сообщением — повторять не придётся." }));

    var row = el("div", { class: "btn-row" });
    var full = primary.msg + "\n" + summary.join("\n");
    row.appendChild(el("a", { class: "btn btn-red", href: waLink(full), target: "_blank", rel: "noopener", text: primary.text }));
    if (secondary.href) row.appendChild(el("a", { class: "btn btn-line", href: secondary.href, text: secondary.text }));
    else row.appendChild(el("a", { class: "btn btn-line", href: waLink(secondary.msg + "\n" + summary.join("\n")), target: "_blank", rel: "noopener", text: secondary.text }));
    box.appendChild(row);

    var again = el("div", { class: "quiz-nav" });
    var back = el("button", { type: "button", class: "text-btn", text: "← Назад" });
    back.addEventListener("click", function () { state.step = 4; render(true); });
    var restart = el("button", { type: "button", class: "text-btn", text: "Пройти заново" });
    restart.addEventListener("click", function () { state = { step: 0, dir: null, answers: {} }; render(true); });
    again.appendChild(back); again.appendChild(restart);
    box.appendChild(again);
    quizRoot.appendChild(box);
  }

  render(false);
})();
