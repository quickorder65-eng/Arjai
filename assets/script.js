/* ArJai · ДоСи — поведение сайта: анкета, WhatsApp-заявки, меню, клавиатура ДО–СИ, видео. */
(function () {
  "use strict";

  /* ===== НАСТРОЙКИ =====
     Номер WhatsApp для всех заявок. Какой номер основной — ещё не подтверждено
     (8 707 653 62 50 или 8 700 028 36 48), сейчас стоит первый. Меняется только здесь. */
  var WA_PHONE = "77076536250";

  /* Язык страницы: русская версия в корне, казахская — в папке kk/ */
  var LANG = (document.documentElement.lang || "ru").slice(0, 2) === "kk" ? "kk" : "ru";

  var MESSAGES = {
    ru: {
      lesson: "Здравствуйте! Хочу записаться на занятие в ArJai.",
      diagnostic: "Здравствуйте! Хочу пройти диагностику.",
      dosi: "Здравствуйте! Хочу получить программу ДоСи для педагогов.",
      repetitor: "Здравствуйте! Интересует курс «Успешный репетитор ДоСи».",
      school: "Здравствуйте! Я представляю музыкальную школу. Хочу получить консультацию по внедрению ДоСи.",
      question: "Здравствуйте! У меня вопрос.",
      review: "Здравствуйте! Хочу оставить отзыв.",
      workshop: "Здравствуйте! Нужен ремонт или настройка инструмента.",
      studio: "Здравствуйте! Хочу записаться в студию звукозаписи."
    },
    kk: {
      lesson: "Сәлеметсіз бе! ArJai-да сабаққа жазылғым келеді.",
      diagnostic: "Сәлеметсіз бе! Диагностикадан өткім келеді.",
      dosi: "Сәлеметсіз бе! Педагогтерге арналған ДоСи бағдарламасын алғым келеді.",
      repetitor: "Сәлеметсіз бе! «Табысты репетитор ДоСи» курсы қызықтырады.",
      school: "Сәлеметсіз бе! Мен музыка мектебінің өкілімін. ДоСи-ді енгізу бойынша кеңес алғым келеді.",
      question: "Сәлеметсіз бе! Менің сұрағым бар.",
      review: "Сәлеметсіз бе! Пікір қалдырғым келеді.",
      workshop: "Сәлеметсіз бе! Аспапты жөндеу немесе баптау керек.",
      studio: "Сәлеметсіз бе! Дыбыс жазу студиясына жазылғым келеді."
    }
  }[LANG];

  var UI = {
    ru: { menu: "Меню", close: "Закрыть", video: "Видео", nameErr: "Напишите, как к вам обращаться.", hello: "Здравствуйте!", myName: "Меня зовут ", topic: "Тема: ", phone: "Мой телефон: " },
    kk: { menu: "Мәзір", close: "Жабу", video: "Бейне", nameErr: "Сізге қалай жүгінуге болатынын жазыңыз.", hello: "Сәлеметсіз бе!", myName: "Менің атым ", topic: "Тақырып: ", phone: "Телефоным: " }
  }[LANG];

  var IMG = function (id, w) { return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + (w || 900) + "&q=75"; };
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

  function waLink(text) { return "https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(text); }

  /* Черновые пометки для согласования: только по адресу с ?draft=1 */
  try {
    if (new URLSearchParams(location.search).get("draft") === "1") document.documentElement.classList.add("draft");
  } catch (e) { /* старые браузеры */ }

  /* ===== Язык: выбор при первом входе и переключатель в шапке =====
     Выбор запоминается в браузере. Ссылки на другую версию берутся из переключателя .lang-switch. */
  var LANG_KEY = "arjai-lang";
  function getLang() { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  function setLang(v) { try { localStorage.setItem(LANG_KEY, v); } catch (e) { /* без памяти */ } }
  function langHref(code) {
    var a = document.querySelector('.lang-switch a[hreflang="' + code + '"]');
    return a ? a.getAttribute("href") : null;
  }
  document.querySelectorAll(".lang-switch a").forEach(function (a) {
    a.addEventListener("click", function () { setLang(a.getAttribute("hreflang")); });
  });
  (function askLanguage() {
    var params = new URLSearchParams(location.search);
    var force = params.get("lang") === "ask";
    if (!force && (getLang() || navigator.webdriver || location.hash.indexOf("#quiz") === 0)) return;
    if (!document.querySelector(".lang-switch")) return;
    var prefersKk = (navigator.languages || [navigator.language || ""]).some(function (l) { return /^kk/i.test(l); });
    var d = document.createElement("dialog");
    d.className = "lang-dlg";
    d.setAttribute("aria-labelledby", "lang-title");
    d.innerHTML =
      '<div class="lang-inner">' +
      '<span class="logo"><span class="ar">Ar</span><span class="jai">Jai</span></span>' +
      '<h2 id="lang-title">Тілді таңдаңыз<br>Выберите язык</h2>' +
      '<p>Сайт қазақ және орыс тілдерінде · Сайт на казахском и русском</p>' +
      '<div class="lang-choices">' +
      '<button type="button" data-lang="kk" lang="kk"' + (prefersKk ? ' class="suggest"' : "") + '>Қазақша <span>KZ</span></button>' +
      '<button type="button" data-lang="ru" lang="ru"' + (!prefersKk ? ' class="suggest"' : "") + '>Русский <span>RU</span></button>' +
      "</div></div>";
    document.body.appendChild(d);
    d.addEventListener("cancel", function (e) { e.preventDefault(); });
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lang]");
      if (!b) return;
      var code = b.getAttribute("data-lang");
      setLang(code);
      if (code === LANG) { d.close(); d.remove(); return; }
      var href = langHref(code);
      if (href) location.href = href + location.hash; else { d.close(); d.remove(); }
    });
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  })();

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
      toggle.textContent = open ? UI.close : UI.menu;
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = UI.menu; });
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
      iframe.title = btn.getAttribute("aria-label") || UI.video;
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
      if (!name) { err.textContent = UI.nameErr; form.elements.name.focus(); return; }
      err.textContent = "";
      var phone = form.elements.phone.value.trim(), msg = form.elements.message.value.trim();
      window.open(waLink(UI.hello + " " + UI.myName + name + ".\n" + UI.topic + form.elements.topic.value + "." + (phone ? "\n" + UI.phone + phone + "." : "") + (msg ? "\n" + msg : "")), "_blank", "noopener");
    });
  }

  /* =================== АНКЕТА ===================
     Тексты на двух языках. У вариантов есть код (k) — по нему строится рекомендация. */
  var Q = {
    ru: {
      count: function (n) { return "Вопрос " + n + " из 5"; },
      q1: "Что вас интересует?", q1sub: "Выберите направление — дальше 4 коротких вопроса.",
      dir: "Направление", age: " лет", teachers: " педагогов",
      done: "Анкета пройдена", rec: "Ваша рекомендация",
      nameLabel: "Как к вам обращаться? (можно не заполнять)", namePh: "Например, Айгерим",
      sendSuffix: " в WhatsApp", again: "Пройти заново", sent: "Прошёл(ла) анкету на сайте:",
      dirs: { vocal: ["Вокал", "дети и взрослые"], piano: ["Фортепиано", "и синтезатор"], guitar: ["Гитара", "бас-гитара, укулеле"], theory: ["Теория музыки", "сольфеджио, композиция"], conduct: ["Дирижирование", "индивидуально"], teacher: ["Я преподаю", "методика ДоСи для педагогов"], school: ["У меня музыкальная школа", "внедрение ДоСи для всей команды"] },
      names: { learn: ["Уровень", "Возраст", "Формат", "Цель"], teach: ["Опыт", "Ученики", "Формат", "Цель"], school: ["Педагогов", "Ученики", "Формат", "Задача"] },
      steps: {
        learn: [
          ["С какого уровня начинаем?", "Подберём старт, чтобы было не скучно и не слишком сложно.", [["zero", "С нуля", "Никогда не занимался(ась) музыкой"], ["back", "Занимался(ась), но бросил(а)", "Хочу вернуться и не начинать заново"], ["now", "Занимаюсь сейчас", "Хочу расти быстрее и увереннее"], ["stage", "Уже выступаю", "Нужен следующий уровень"]]],
          ["Сколько лет ученику?", "Учим с 3 до 73 лет — программа строится под возраст.", [["a1", "3–6", "лет"], ["a2", "7–12", "лет"], ["a3", "13–17", "лет"], ["a4", "18–35", "лет"], ["a5", "36+", "лет"]]],
          ["Как удобнее заниматься?", "Онлайн занимаются даже из других стран.", [["off", "Очно в Алматы", "Занятия в студии"], ["on", "Онлайн", "Из дома, из любого города"], ["unk", "Пока не знаю", "Подскажем на диагностике"]]],
          ["Какая главная цель?", "Последний вопрос — и рекомендация готова.", [["fun", "Для себя, в удовольствие", "Петь и играть любимое"], ["stage", "Выйти на сцену", "Выступить на концерте студии"], ["contest", "Конкурс или поступление", "Серьёзная подготовка к цели"], ["test", "Понять, есть ли способности", "Проверить слух и голос"]]]
        ],
        teach: [
          ["Какой у вас опыт преподавания?", "ДоСи подходит и новичкам, и опытным педагогам.", [["new", "Только начинаю", "Первые ученики или их пока нет"], ["mid", "От 1 до 5 лет", "Есть практика, хочется системы"], ["pro", "Больше 5 лет", "Хочу систематизировать опыт"]]],
          ["Кого вы учите?", "Методика адаптируется под возраст учеников.", [["kids", "В основном детей", ""], ["teens", "Подростков", ""], ["adults", "Взрослых", ""], ["all", "Все возрасты", ""]]],
          ["Как удобнее учиться самому?", "Программа проходит в группе или индивидуально.", [["on", "Онлайн", "Из любого города"], ["off", "Очно в Алматы", "В студии ArJai"], ["unk", "Пока не знаю", "Обсудим вместе"]]],
          ["Что важнее всего изменить?", "Последний вопрос — и рекомендация готова.", [["system", "Понятная система урока", "Не придумывать каждый урок заново"], ["keep", "Ученики перестают уходить", "Удерживать интерес"], ["biz", "Больше учеников и дохода", "Расти как специалист"], ["sure", "Уверенность в методике", "Алгоритмы и инструменты"]]]
        ],
        school: [
          ["Сколько педагогов в школе?", "От этого зависит формат внедрения.", [["s1", "до 5", "педагогов"], ["s2", "5–15", "педагогов"], ["s3", "15+", "педагогов"]]],
          ["Кто ваши ученики?", "", [["kids", "В основном дети", ""], ["teens", "Подростки", ""], ["adults", "Взрослые", ""], ["all", "Все возрасты", ""]]],
          ["Где удобнее обучать педагогов?", "", [["on", "Онлайн", "Вся команда из любой точки"], ["off", "Очно в Алматы", "Выезд или в студии"], ["mix", "Смешанный формат", "Часть онлайн, часть очно"]]],
          ["Какая задача главная?", "Последний вопрос — и рекомендация готова.", [["std", "Единый стандарт для педагогов", "Все учат по одной логике"], ["keep", "Удержание учеников", "Меньше уходов"], ["parents", "Результат, видимый родителям", "Понятный прогресс"], ["qa", "Контроль качества уроков", "Прозрачность работы педагогов"]]]
        ]
      },
      learn: {
        title: function (d) { return d + ": начнём с диагностики"; },
        diag: "Диагностика: определяем уровень, цель и подходящий формат.",
        back: "Покажем, с какого места продолжить, чтобы не начинать всё заново.",
        zero: "Начинаем с нуля — слух и голос развиваются на занятиях.",
        stage: "Добавим подготовку к сцене — у студии больше 60 концертов с учениками.",
        off: "Очно: от 8 000 ₸ за 60 минут или абонемент 64 000 ₸ в месяц.",
        on: "Онлайн: от 6 000 ₸ за 60 минут или абонемент 48 000 ₸ в месяц.",
        unk: "Очно от 8 000 ₸, онлайн от 6 000 ₸ за 60 минут — формат выберем вместе.",
        cta: "Записаться на диагностику", msg: "Хочу пройти диагностику.",
        alt: "Сразу записаться на занятие", altMsg: "Хочу записаться на занятие."
      },
      teach: {
        titleBiz: "Вам подойдёт курс «Успешный репетитор ДоСи»", title: "Вам подойдёт программа ДоСи для педагогов",
        modules: "Четыре модуля: диагностика ученика, система обучения, методика, профессиональный репетитор.",
        materials: "Все наглядные и репертуарные материалы входят в стоимость.",
        newbie: "Готовая логика урока от ДО до СИ — с первых учеников.",
        pro: "Систематизируете опыт и вырастете в ценности как специалист.",
        biz: "Отдельный блок — как превратить знания в услугу, которая приводит учеников.",
        fmt: { on: "Формат: онлайн, в группе или индивидуально.", off: "Формат: очно в Алматы, в группе или индивидуально.", unk: "Формат: онлайн или очно — подберём вместе." },
        cta: "Получить программу ДоСи", msg: "Хочу получить программу ДоСи.",
        more: "Подробнее о курсе", ask: "Задать вопрос", askMsg: "У меня вопрос по программе ДоСи."
      },
      school: {
        title: "Внедрение ДоСи в вашу школу",
        path: "Путь: диагностика школы → обучение педагогов → внедрение → контроль → оценка результата.",
        goal: function (g) { return "Ваша главная задача — «" + g + "». С неё и начнём."; },
        size: function (n) { return "Формат и стоимость рассчитаем на консультации под размер школы (" + n + " педагогов)."; },
        cta: "Получить консультацию", msg: "Я представляю музыкальную школу, хочу консультацию по внедрению ДоСи.",
        more: "Подробнее для школ"
      }
    },
    kk: {
      count: function (n) { return "Сұрақ " + n + " / 5"; },
      q1: "Сізді не қызықтырады?", q1sub: "Бағытты таңдаңыз — одан кейін 4 қысқа сұрақ.",
      dir: "Бағыт", age: " жас", teachers: " педагог",
      done: "Анкета толтырылды", rec: "Сізге ұсыныс",
      nameLabel: "Сізге қалай жүгінейік? (міндетті емес)", namePh: "Мысалы, Айгерім",
      sendSuffix: " — WhatsApp", again: "Қайта өту", sent: "Сайттағы анкетаны толтырдым:",
      dirs: { vocal: ["Вокал", "балалар мен ересектер"], piano: ["Фортепиано", "және синтезатор"], guitar: ["Гитара", "бас-гитара, укулеле"], theory: ["Музыка теориясы", "сольфеджио, композиция"], conduct: ["Дирижерлік", "жеке сабақ"], teacher: ["Мен сабақ беремін", "педагогтерге арналған ДоСи әдістемесі"], school: ["Менің музыка мектебім бар", "бүкіл командаға ДоСи-ді енгізу"] },
      names: { learn: ["Деңгей", "Жасы", "Формат", "Мақсат"], teach: ["Тәжірибе", "Оқушылар", "Формат", "Мақсат"], school: ["Педагогтер", "Оқушылар", "Формат", "Міндет"] },
      steps: {
        learn: [
          ["Қай деңгейден бастаймыз?", "Іш пыспайтын, бірақ тым қиын да емес бастауды таңдаймыз.", [["zero", "Нөлден", "Бұрын музыкамен айналыспадым"], ["back", "Оқыдым, бірақ тастап кеттім", "Басынан емес, жалғастырғым келеді"], ["now", "Қазір оқып жүрмін", "Тезірек әрі сенімдірек дамығым келеді"], ["stage", "Сахнада өнер көрсетемін", "Келесі деңгей керек"]]],
          ["Оқушы неше жаста?", "3 пен 73 жас аралығында оқытамыз — бағдарлама жасқа қарай құрылады.", [["a1", "3–6", "жас"], ["a2", "7–12", "жас"], ["a3", "13–17", "жас"], ["a4", "18–35", "жас"], ["a5", "36+", "жас"]]],
          ["Қалай оқыған ыңғайлы?", "Онлайн басқа елдерден де оқиды.", [["off", "Алматыда, бетпе-бет", "Студиядағы сабақтар"], ["on", "Онлайн", "Үйден, кез келген қаладан"], ["unk", "Әзірге білмеймін", "Диагностикада кеңес береміз"]]],
          ["Басты мақсатыңыз қандай?", "Соңғы сұрақ — және ұсыныс дайын.", [["fun", "Өзім үшін, рахаттану үшін", "Сүйікті әндерімді айтып, ойнау"], ["stage", "Сахнаға шығу", "Студия концертінде өнер көрсету"], ["contest", "Байқау немесе оқуға түсу", "Мақсатқа байыпты дайындық"], ["test", "Қабілетім бар-жоғын білу", "Есту қабілеті мен дауысты тексеру"]]]
        ],
        teach: [
          ["Сабақ беру тәжірибеңіз қандай?", "ДоСи жаңадан бастаған педагогтерге де, тәжірибелілерге де лайық.", [["new", "Енді бастап жатырмын", "Алғашқы оқушылар немесе әзірге жоқ"], ["mid", "1 жылдан 5 жылға дейін", "Тәжірибе бар, жүйе керек"], ["pro", "5 жылдан астам", "Тәжірибемді жүйелегім келеді"]]],
          ["Кімдерді оқытасыз?", "Әдістеме оқушылардың жасына бейімделеді.", [["kids", "Негізінен балаларды", ""], ["teens", "Жасөспірімдерді", ""], ["adults", "Ересектерді", ""], ["all", "Барлық жастағыларды", ""]]],
          ["Өзіңізге қалай оқыған ыңғайлы?", "Бағдарлама топта немесе жеке өтеді.", [["on", "Онлайн", "Кез келген қаладан"], ["off", "Алматыда, бетпе-бет", "ArJai студиясында"], ["unk", "Әзірге білмеймін", "Бірге талқылаймыз"]]],
          ["Ең алдымен нені өзгерткіңіз келеді?", "Соңғы сұрақ — және ұсыныс дайын.", [["system", "Түсінікті сабақ жүйесі", "Әр сабақты қайта ойлап таппау"], ["keep", "Оқушылар кетпесін", "Қызығушылықты сақтау"], ["biz", "Көбірек оқушы мен табыс", "Маман ретінде өсу"], ["sure", "Әдістемеге сенімділік", "Алгоритмдер мен құралдар"]]]
        ],
        school: [
          ["Мектепте неше педагог бар?", "Енгізу форматы осыған байланысты.", [["s1", "5-ке дейін", "педагог"], ["s2", "5–15", "педагог"], ["s3", "15+", "педагог"]]],
          ["Оқушыларыңыз кімдер?", "", [["kids", "Негізінен балалар", ""], ["teens", "Жасөспірімдер", ""], ["adults", "Ересектер", ""], ["all", "Барлық жастағылар", ""]]],
          ["Педагогтерді қалай оқытқан ыңғайлы?", "", [["on", "Онлайн", "Бүкіл команда кез келген жерден"], ["off", "Алматыда, бетпе-бет", "Мектепке барып немесе студияда"], ["mix", "Аралас формат", "Бір бөлігі онлайн, бір бөлігі бетпе-бет"]]],
          ["Басты міндет қандай?", "Соңғы сұрақ — және ұсыныс дайын.", [["std", "Педагогтерге бірыңғай стандарт", "Барлығы бір логикамен оқытады"], ["keep", "Оқушыларды сақтау", "Кететіндер азаяды"], ["parents", "Ата-аналарға көрінетін нәтиже", "Түсінікті прогресс"], ["qa", "Сабақ сапасын бақылау", "Педагогтер жұмысының ашықтығы"]]]
        ]
      },
      learn: {
        title: function (d) { return d + ": диагностикадан бастаймыз"; },
        diag: "Диагностика: деңгейді, мақсатты және қолайлы форматты анықтаймыз.",
        back: "Басынан бастамау үшін қай жерден жалғастыру керегін көрсетеміз.",
        zero: "Нөлден бастаймыз — есту қабілеті мен дауыс сабақта дамиды.",
        stage: "Сахнаға дайындықты қосамыз — студияда оқушылармен 60-тан астам концерт өтті.",
        off: "Бетпе-бет: 60 минут — 8 000 ₸-ден, айлық абонемент — 64 000 ₸.",
        on: "Онлайн: 60 минут — 6 000 ₸-ден, айлық абонемент — 48 000 ₸.",
        unk: "Бетпе-бет 8 000 ₸-ден, онлайн 6 000 ₸-ден (60 минут) — форматты бірге таңдаймыз.",
        cta: "Диагностикаға жазылу", msg: "Диагностикадан өткім келеді.",
        alt: "Бірден сабаққа жазылу", altMsg: "Сабаққа жазылғым келеді."
      },
      teach: {
        titleBiz: "Сізге «Табысты репетитор ДоСи» курсы лайық", title: "Сізге педагогтерге арналған ДоСи бағдарламасы лайық",
        modules: "Төрт модуль: оқушы диагностикасы, оқыту жүйесі, әдістеме, кәсіби репетитор.",
        materials: "Барлық көрнекі және репертуарлық материалдар бағаға кіреді.",
        newbie: "ДО-дан СИ-ге дейінгі дайын сабақ логикасы — алғашқы оқушылардан бастап.",
        pro: "Тәжірибеңізді жүйелеп, маман ретінде құндылығыңызды арттырасыз.",
        biz: "Жеке блок — білімді оқушы әкелетін қызметке айналдыру.",
        fmt: { on: "Формат: онлайн, топта немесе жеке.", off: "Формат: Алматыда бетпе-бет, топта немесе жеке.", unk: "Формат: онлайн немесе бетпе-бет — бірге таңдаймыз." },
        cta: "ДоСи бағдарламасын алу", msg: "ДоСи бағдарламасын алғым келеді.",
        more: "Курс туралы толығырақ", ask: "Сұрақ қою", askMsg: "ДоСи бағдарламасы бойынша сұрағым бар."
      },
      school: {
        title: "ДоСи-ді мектебіңізге енгізу",
        path: "Жол: мектеп диагностикасы → педагогтерді оқыту → енгізу → бақылау → нәтижені бағалау.",
        goal: function (g) { return "Сіздің басты міндетіңіз — «" + g + "». Осыдан бастаймыз."; },
        size: function (n) { return "Формат пен бағаны кеңес кезінде мектеп көлеміне қарай есептейміз (" + n + " педагог)."; },
        cta: "Кеңес алу", msg: "Мен музыка мектебінің өкілімін, ДоСи-ді енгізу бойынша кеңес алғым келеді.",
        more: "Мектептерге толығырақ"
      }
    }
  }[LANG];

  var DIR_META = [
    { id: "vocal", img: "photo-1595422656857-ced3a4a0ce25", path: "learn" },
    { id: "piano", img: "photo-1452724931113-5ab6340ce080", path: "learn" },
    { id: "guitar", img: "photo-1536594527669-2f555de54e95", path: "learn" },
    { id: "theory", img: "photo-1717699841805-e80424b1be43", path: "learn" },
    { id: "conduct", img: "photo-1568057609581-8556cf900d3c", path: "learn" },
    { id: "teacher", img: "photo-1696522732406-065ef560da8c", path: "teach" },
    { id: "school", img: "photo-1684784176798-aae206e325e7", path: "school", wide: true }
  ];
  var DIRECTIONS = DIR_META.map(function (d) { return { id: d.id, img: d.img, path: d.path, wide: d.wide, label: Q.dirs[d.id][0], note: Q.dirs[d.id][1] }; });
  var KEYS = ["level", "age", "format", "goal"];
  var STEPS = {};
  Object.keys(Q.steps).forEach(function (path) {
    STEPS[path] = Q.steps[path].map(function (st, i) {
      return { key: KEYS[i], title: st[0], sub: st[1], type: (path === "learn" && i === 1) || (path === "school" && i === 0) ? "chips" : "cards",
        options: st[2].map(function (o) { return { k: o[0], t: o[1], s: o[2] }; }) };
    });
  });

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
      wrap.appendChild(h("p", "qz-count", Q.count(1)));
      wrap.appendChild(h("h2", null, esc(Q.q1)));
      wrap.appendChild(h("p", "qz-sub", esc(Q.q1sub)));
      var grid = h("div", "qz-grid photos");
      DIRECTIONS.forEach(function (d, i) {
        var b = h("button", "qz-opt" + (d.wide ? " wide" : "") + (state.dir === d ? " sel" : ""));
        b.type = "button";
        b.innerHTML = '<img src="' + IMG(d.img, 700) + '" alt=""><span class="key-hint"><span>' + (i + 1) + '</span></span><span class="lbl"><b>' + esc(d.label) + '</b><small>' + esc(d.note) + "</small></span>";
        b.addEventListener("click", function () {
          choose(b, function () { if (state.dir !== d) state.answers = {}; state.dir = d; state.step = 1; });
        });
        grid.appendChild(b);
      });
      wrap.appendChild(grid);
    } else if (state.step <= 4) {
      var s = STEPS[state.dir.path][state.step - 1];
      wrap.appendChild(h("p", "qz-count", Q.count(state.step + 1) + " · " + esc(state.dir.label)));
      wrap.appendChild(h("h2", null, esc(s.title)));
      if (s.sub) wrap.appendChild(h("p", "qz-sub", esc(s.sub)));
      else wrap.appendChild(h("div", null, "")).style.height = "24px";
      var g = h("div", "qz-grid " + s.type);
      s.options.forEach(function (o, i) {
        var b = h("button", "qz-opt" + (state.answers[s.key] && state.answers[s.key].k === o.k ? " sel" : ""));
        b.type = "button";
        b.innerHTML = '<span class="key-hint"><span>' + (i + 1) + "</span></span><b>" + esc(o.t) + "</b>" + (o.s ? "<small>" + esc(o.s) + "</small>" : "");
        b.addEventListener("click", function () { choose(b, function () { state.answers[s.key] = { k: o.k, t: o.t }; state.step += 1; }); });
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
    var names = Q.names[state.dir.path];
    return [Q.dir + " — " + state.dir.label].concat(KEYS.map(function (k, i) {
      var v = state.answers[k].t;
      if (k === "age" && state.dir.path === "learn") v += Q.age;
      if (k === "level" && state.dir.path === "school") v += Q.teachers;
      return names[i] + " — " + v;
    }));
  }

  function result() {
    var a = state.answers, p = state.dir.path, title, points = [], cta, ctaMsg, alt, T;
    if (p === "learn") {
      T = Q.learn;
      var stage = a.goal.k === "contest" || a.goal.k === "stage" || a.level.k === "stage";
      title = T.title(state.dir.label);
      points.push(T.diag);
      if (a.level.k === "back") points.push(T.back);
      if (a.level.k === "zero") points.push(T.zero);
      if (stage) points.push(T.stage);
      points.push(T[a.format.k] || T.unk);
      cta = T.cta; ctaMsg = T.msg;
      alt = { text: T.alt, msg: T.altMsg };
    } else if (p === "teach") {
      T = Q.teach;
      var biz = a.goal.k === "biz";
      title = biz ? T.titleBiz : T.title;
      points.push(T.modules);
      points.push(T.materials);
      points.push(a.level.k === "new" ? T.newbie : T.pro);
      if (biz) points.push(T.biz);
      points.push(T.fmt[a.format.k] || T.fmt.unk);
      cta = T.cta; ctaMsg = T.msg;
      alt = biz ? { text: T.more, href: "repetitor.html" } : { text: T.ask, msg: T.askMsg };
    } else {
      T = Q.school;
      title = T.title;
      points.push(T.path);
      points.push(T.goal(a.goal.t));
      points.push(T.size(a.level.t));
      cta = T.cta; ctaMsg = T.msg;
      alt = { text: T.more, href: "shkolam.html" };
    }
    var sum = summary();
    var box = h("div", "qz-result");
    box.innerHTML =
      '<div class="pic"><img src="' + IMG(state.dir.img, 1000) + '" alt=""><span class="stamp"><i>✓</i>' + esc(Q.done) + '</span></div>' +
      '<div><p class="qz-count">' + esc(Q.rec) + '</p><h2>' + esc(title) + '</h2>' +
      '<ul class="qz-points">' + points.map(function (t) { return "<li>" + ICON_CHECK + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul>" +
      '<div class="qz-answers">' + sum.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
      '<div class="qz-name"><label for="qz-name">' + esc(Q.nameLabel) + '</label><input id="qz-name" type="text" autocomplete="name" placeholder="' + esc(Q.namePh) + '"></div>' +
      '<button type="button" class="quiz-cta qz-send">' + esc(cta) + esc(Q.sendSuffix) + '<span class="arrow">' + ICON_ARROW + "</span></button>" +
      '<div class="qz-alt"></div></div>';
    var input = box.querySelector("#qz-name");
    function compose(msg) {
      var name = input.value.trim();
      return UI.hello + (name ? " " + UI.myName + name + "." : "") + " " + msg + "\n" + Q.sent + "\n" + sum.join("\n");
    }
    box.querySelector(".qz-send").addEventListener("click", function () { window.open(waLink(compose(ctaMsg)), "_blank", "noopener"); });
    var altBox = box.querySelector(".qz-alt");
    var altEl = h(alt.href ? "a" : "button", null, esc(alt.text));
    if (alt.href) altEl.href = alt.href; else { altEl.type = "button"; altEl.addEventListener("click", function () { window.open(waLink(compose(alt.msg)), "_blank", "noopener"); }); }
    altBox.appendChild(altEl);
    var again = h("button", null, esc(Q.again)); again.type = "button";
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
