(() => {
  'use strict';

  const root = document.getElementById('app-root');
  const screen = document.getElementById('screen-area');
  const nav = document.getElementById('mission-nav');
  if (!root || !screen || !nav) return;

  const STORAGE_KEY = 'fire-safety-quest:designed-v1';
  const VERSION = 'designed-v1';
  const letters = ['А', 'Б', 'В', 'Г'];
  const iconPaths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    inspect: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    phone: '<path d="M8 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-3l-5-2-2 2a13 13 0 0 1-6-6l2-2-2-5Z"/>',
    power: '<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
    route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
    warning: '<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v1"/>',
    extinguisher: '<rect x="7" y="9" width="10" height="12" rx="3"/><path d="M10 9V5h4v4m-4-4h7m-3 0V2h3m0 3c4 0 4 3 4 6v3"/>'
  };
  const icon = name => `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.shield}</svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const missions = [
    {
      short: 'Осмотр пространства', title: 'Заметьте то, что может стать опасным',
      subtitle: 'Осмотрите пространство и отметьте три опасных условия. Можно выбирать точки на сцене или объекты в списке.',
      type: 'objects', icon: 'inspect', skill: 'Замечать опасные условия',
      source: '№ 3-ИПБ, пункты 5–7, 9, 17; № 4-ИПБ, пункт 2.2.25.',
      correct: ['cable', 'adapter', 'exit'],
      success: 'Вы нашли повреждённый шнур, мощные приборы через тройник и загромождённый выход. Сообщите о выявленных проблемах ответственному; неисправный прибор нельзя продолжать использовать или ремонтировать самостоятельно.',
      choices: [
        {id:'cable',title:'Кабель чайника',detail:'На шнуре повреждена изоляция.',x:27.67,y:75.61,why:'Повреждённый шнур — опасное условие. Перед включением проверяют исправность шнура и вилки (№ 3, п. 5).'},
        {id:'adapter',title:'Тройник у розетки',detail:'К нему подключены электроплитка и микроволновая печь.',x:46.78,y:69.85,why:'Мощные электроприборы нельзя подключать через тройник (№ 3, п. 9).'},
        {id:'exit',title:'Эвакуационный выход',detail:'Проход через дверь перекрыт коробками.',x:78.44,y:58.18,why:'Загромождать пути и блокировать эвакуационные выходы запрещено (№ 4, п. 2.2.25).'},
        {id:'printer',title:'Вентиляция принтера',detail:'Отверстия свободны, бумага их не закрывает.',x:45.11,y:46.36,why:'Свободные вентиляционные отверстия — нормальное условие для офисной техники (№ 3, п. 17).'},
        {id:'passage',title:'Проход между столами',detail:'Свободен от вещей и оборудования.',x:62.33,y:74.55,why:'Свободный проход не является нарушением (№ 4, п. 2.2.25).'},
        {id:'socket',title:'Кабель офисного прибора',detail:'Шнур и вилка исправны, повреждений нет.',x:19.89,y:47.88,why:'По условиям задания шнур и вилка исправны; опасного условия здесь нет (№ 3, п. 5).'}
      ]
    },
    {
      short: 'Готовность огнетушителя', title: 'Пломба сорвана. Ваше решение?',
      subtitle: 'Пожара нет. У углекислотного огнетушителя вы заметили сорванную пломбу. Вы — сотрудник, а не специалист по его обслуживанию.',
      type: 'single', icon: 'extinguisher', skill: 'Сообщать о неисправном средстве защиты',
      source: '№ 2-ИПБ, пункты 2.11, 2.13; подраздел 2.15 «Углекислотные огнетушители», абзац о замене.',
      correct: ['report'],
      success: 'Сообщение ответственному — правильное действие сотрудника. Ответственное лицо организует замену огнетушителя с сорванной пломбой и необходимые дальнейшие работы.',
      choices: [
        {id:'test-release',title:'Проверить коротким пуском',detail:'Нажать рычаг и посмотреть, выходит ли заряд.',why:'Пробный пуск не подтверждает готовность огнетушителя и расходует заряд. В этой ситуации нужно сообщить ответственному о сорванной пломбе.'},
        {id:'report',title:'Сообщить ответственному',detail:'Передать, что пломба сорвана, чтобы ответственное лицо организовало замену.',why:''},
        {id:'ignore',title:'Оставить как есть',detail:'Корпус цел и огнетушитель стоит на месте — значит, он готов.',why:'Внешний вид корпуса не отменяет сорванную пломбу. Для такого ОУ предоставленная инструкция предусматривает замену.'}
      ]
    },
    {
      short: 'Вызов пожарной охраны', title: 'Скажите главное диспетчеру',
      subtitle: 'Симуляция: вы уже в безопасном месте, коллега оповещает людей. Вы звоните 101 или 112. Выберите сообщение с известными сведениями.',
      type: 'single', icon: 'phone', skill: 'Точно передавать сведения о пожаре',
      source: '№ 1-ИПБ, раздел «Порядок действий работников…», абзац о вызове пожарной охраны; № 4-ИПБ, пункт 10.1.',
      correct: ['complete'],
      success: 'Переданы адрес и место, наблюдаемый дым, фамилия и известный подъезд. Неизвестные сведения о людях не выдуманы. Ответьте на уточняющие вопросы диспетчера.',
      choices: [
        {id:'vague',title:'«В нашем кластере дым. Приезжайте скорее!»',detail:'Коротко сообщить о происшествии.',why:'Не хватает точного адреса, места и других известных данных. По ним диспетчер и пожарные должны найти объект.'},
        {id:'complete',title:'«Примерск, Учебная, 10, корпус Б, второй этаж. Дым из лаборатории 204. Есть ли люди внутри, не знаю. Я Иванова. Подъезд с Учебной через ворота № 1».',detail:'Передать точные данные из карточки ситуации.',why:''},
        {id:'return-check',title:'Сначала вернуться и проверить людей',detail:'Уточнить, есть ли кто-то в лаборатории, и только затем сообщить.',why:'Не возвращайтесь к дыму ради уточнения. Сообщите уже известные сведения и прямо укажите, что наличие людей внутри неизвестно.'}
      ]
    },
    {
      short: 'Безопасный маршрут', title: 'Привычный путь больше не подходит',
      subtitle: 'Коридор А задымлён. Другой предусмотренный путь — обозначенная свободная эвакуационная лестница Б — ведёт наружу. Как действовать?',
      type: 'single', icon: 'route', skill: 'Выбирать предусмотренный безопасный путь',
      source: '№ 1-ИПБ, раздел «Порядок действий работников…», абзац о наиболее безопасных путях и выходах; рекомендации МЧС по эвакуации.',
      correct: ['stairs'],
      success: 'В условиях задания свободная обозначенная лестница ведёт наружу. После выхода не возвращайтесь за вещами; действуйте по установленному на объекте порядку.',
      choices: [
        {id:'smoke',title:'Через привычный коридор А',detail:'Он короче, хотя на пути виден дым.',why:'Не выбирайте путь через дым. По условиям задания доступна свободная эвакуационная лестница с выходом наружу.'},
        {id:'stairs',title:'По эвакуационной лестнице Б',detail:'Свободный обозначенный путь с выходом наружу.',why:''},
        {id:'lift',title:'На обычном лифте',detail:'Кабина сейчас свободна, двери открыты.',why:'Обычный лифт не используют для эвакуации при пожаре. В задании предусмотрен безопасный путь по лестнице.'}
      ]
    },
    {
      short: 'Завершение рабочего дня', title: 'Отключить — не значит выключить всё',
      subtitle: 'Отдельный эпизод: обычный день, пожара нет. Работа окончена, дежурного персонала в помещении не остаётся. Выберите приборы, которые нужно отключить от питающей сети.',
      type: 'multiple', icon: 'power', skill: 'Завершать работу с учётом исключений',
      source: '№ 3-ИПБ, пункт 18; № 4-ИПБ, пункт 5.4.',
      correct: ['kettle', 'microwave'],
      success: 'Чайник и микроволновую печь отключают. Холодильник с предусмотренным круглосуточным режимом остаётся по установленному порядку; пожарную сигнализацию не отключают.',
      choices: [
        {id:'kettle',title:'Электрический чайник',detail:'Работа завершена; круглосуточный режим не предусмотрен.',why:'Чайник нужно отключить от питающей сети после работы (№ 3, п. 18; № 4, п. 5.4).'},
        {id:'fridge',title:'Холодильник',detail:'Круглосуточная работа предусмотрена изготовителем и порядком объекта.',why:'Для этого холодильника прямо предусмотрен круглосуточный режим: применяется исключение.'},
        {id:'microwave',title:'Микроволновая печь',detail:'Работа завершена; круглосуточный режим не предусмотрен.',why:'Микроволновую печь нужно отключить после окончания работы (№ 3, п. 18; № 4, п. 5.4).'},
        {id:'alarm',title:'Пожарная сигнализация',detail:'Система противопожарной защиты здания должна оставаться включённой.',why:'Системы противопожарной защиты входят в исключения: пожарную сигнализацию при закрытии помещения не отключают (№ 4, п. 5.4).'}
      ]
    }
  ];

  const fresh = () => ({version:VERSION,view:'home',current:0,started:false,answers:missions.map(()=>[]),attempts:missions.map(()=>0),solved:missions.map(()=>false),feedback:missions.map(()=>null)});
  const correctAnswer = (index, answers) => missions[index].choices.every(choice => missions[index].correct.includes(choice.id) === answers.includes(choice.id));
  function load() {
    let raw;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { return fresh(); }
    if (!raw || raw.version !== VERSION) return fresh();
    const next = fresh();
    let precedingComplete = true;
    missions.forEach((mission, index) => {
      const answers = Array.isArray(raw.answers?.[index]) ? raw.answers[index] : [];
      next.answers[index] = [...new Set(answers.filter(id => mission.choices.some(choice => choice.id === id)))];
      if (mission.type === 'single') next.answers[index] = next.answers[index].slice(0, 1);
      next.attempts[index] = Number.isInteger(raw.attempts?.[index]) ? Math.min(9999, Math.max(0, raw.attempts[index])) : 0;
      next.solved[index] = precedingComplete && raw.solved?.[index] === true && next.attempts[index] > 0 && correctAnswer(index, next.answers[index]);
      if (!precedingComplete) { next.answers[index] = []; next.attempts[index] = 0; }
      precedingComplete = precedingComplete && next.solved[index];
      next.feedback[index] = next.solved[index] ? 'correct' : raw.feedback?.[index] === 'wrong' && next.attempts[index] > 0 ? 'wrong' : null;
    });
    const firstOpen = next.solved.findIndex(done => !done);
    const latest = firstOpen < 0 ? missions.length - 1 : firstOpen;
    next.current = Number.isInteger(raw.current) ? Math.max(0, Math.min(latest, raw.current)) : latest;
    next.started = raw.started === true || next.attempts.some(Boolean);
    next.view = raw.view === 'mission' && next.started ? 'mission' : raw.view === 'results' && next.solved.every(Boolean) ? 'results' : 'home';
    return next;
  }
  let state = load();
  let showHow = false;
  let restartPending = false;
  const completeCount = () => state.solved.filter(Boolean).length;
  const firstAttemptCount = () => state.solved.reduce((sum, done, index) => sum + (done && state.attempts[index] === 1 ? 1 : 0), 0);
  const openIndex = () => { const found = state.solved.findIndex(done => !done); return found < 0 ? missions.length - 1 : found; };
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }

  function updateShell() {
    root.dataset.view = state.view;
    const done = completeCount();
    nav.innerHTML = missions.map((mission, index) => {
      const locked = index > openIndex();
      const selected = state.view === 'mission' && state.current === index;
      return `<button type="button" class="route-item${selected ? ' is-current' : ''}${state.solved[index] ? ' is-complete' : ''}${locked ? ' is-locked' : ''}" data-nav-index="${index}" ${locked ? 'disabled' : ''} ${selected ? 'aria-current="step"' : ''} aria-label="${index + 1}. ${esc(mission.short)}${locked ? '. Пока недоступно' : state.solved[index] ? '. Пройдено' : ''}"><span class="route-number">${state.solved[index] ? icon('check') : locked ? icon('lock') : String(index + 1).padStart(2,'0')}</span><span class="route-label">${esc(mission.short)}<span class="route-meta">${state.solved[index] ? 'Разобрано' : locked ? 'После предыдущей миссии' : selected ? 'Сейчас' : 'Можно начать'}</span></span></button>`;
    }).join('');
    const values = {'header-progress':`${done} / 5 миссий`, 'sidebar-completed':`${done} из 5`, 'mobile-progress':`${done} / 5`};
    Object.entries(values).forEach(([id,text]) => {const element=document.getElementById(id);if(element)element.textContent=text;});
    const bar=document.getElementById('sidebar-progress');
    if(bar){bar.style.width=`${done / 5 * 100}%`;bar.parentElement?.setAttribute('aria-valuenow',String(done));}
  }

  function restartMarkup() {
    if (!restartPending) return '';
    return `<div class="restart-panel" role="region" aria-label="Начать заново"><h3>Начать новую попытку?</h3><p>Ответы и результат текущего прохождения будут сброшены. Можно отменить и сохранить прогресс.</p><div class="button-row"><button class="button button-primary" type="button" data-action="restart-confirm">Да, начать заново</button><button class="button button-secondary" type="button" data-action="restart-cancel">Сохранить прогресс</button></div></div>`;
  }

  function renderHome() {
    const hasProgress=state.started;
    const allDone=state.solved.every(Boolean);
    screen.innerHTML=`<section class="screen screen-home"><div class="home-grid hero"><div class="hero-copy"><p class="eyebrow">ПРАКТИКА ПОЖАРНОЙ БЕЗОПАСНОСТИ</p><h1 class="screen-title" tabindex="-1">Безопасная<br>смена</h1><p class="screen-lead">Знакомое пространство. Пять решений, которые стоит отработать заранее.</p><p class="muted">Замечайте опасные условия, выбирайте действия и разбирайте результат — в своём темпе.</p><div class="home-meta"><span>${icon('clock')}4–6 минут</span><span>${icon('layers')}5 миссий</span><span>${icon('shield')}Для сотрудников</span></div><div class="button-row"><button id="${hasProgress?'resume-quest':'start-quest'}" class="button button-primary" type="button" data-action="${allDone?'results':hasProgress?'resume':'start'}">${allDone?'Посмотреть результат':hasProgress?'Продолжить квест':'Начать квест'} ${icon('arrow')}</button><button class="button button-ghost" type="button" data-action="how" aria-expanded="${showHow}" aria-controls="how-it-works">Как это работает</button></div>${hasProgress&&!allDone?`<p class="muted">Прогресс сохранён на этом устройстве: ${completeCount()} из 5 миссий.</p>`:''}</div><div class="hero-visual"><img class="hero-image" src="assets/lab-scene.svg" alt="Учебная сцена: офисная зона, оборудование и выход"><div class="hero-badge">${icon('inspect')} Посмотрите внимательнее</div></div></div><div id="how-it-works" class="how-it-works" ${showHow?'':'hidden'}><div class="section-heading"><p class="eyebrow">ОТ НАБЛЮДЕНИЯ К РЕШЕНИЮ</p><h2>Три шага в каждой ситуации</h2></div><div class="journey-grid"><article class="journey-card"><span class="journey-number">01</span><h3>Осмотритесь</h3><p>Изучите сцену и условия. Все необходимые данные находятся перед вами.</p></article><article class="journey-card"><span class="journey-number">02</span><h3>Примите решение</h3><p>Отметьте объекты или выберите действие. Здесь нет гонки на время.</p></article><article class="journey-card"><span class="journey-number">03</span><h3>Разберите результат</h3><p>После ошибки получите объяснение и исправьте выбор. Первые попытки учитываются отдельно.</p></article></div></div>${restartMarkup()}</section>`;
    if (hasProgress && !allDone) {
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'button button-ghost home-reset';
      reset.dataset.action = 'restart';
      reset.textContent = 'Начать заново';
      screen.querySelector('.hero-copy .button-row').appendChild(reset);
    }
  }

  function choiceCards(mission) {
    const selected=state.answers[state.current];
    return `<div class="choice-grid${mission.type==='multiple'?' choice-grid-multiple':''}" role="group" aria-label="${mission.type==='multiple'?'Выберите приборы для отключения':'Выберите решение'}">${mission.choices.map((choice,index)=>`<label class="choice-card${selected.includes(choice.id)?' is-selected':''}${state.solved[state.current]&&mission.correct.includes(choice.id)?' is-correct':''}" data-choice-card="${choice.id}"><input class="choice-input sr-only" type="${mission.type==='multiple'?'checkbox':'radio'}" name="mission-${state.current}" value="${choice.id}" data-choice-id="${choice.id}" ${selected.includes(choice.id)?'checked':''} ${state.solved[state.current]?'disabled':''}><span class="choice-letter" aria-hidden="true">${mission.type==='multiple'?(selected.includes(choice.id)?icon('check'):letters[index]):letters[index]}</span><span class="choice-content"><span class="choice-title">${esc(choice.title)}</span>${choice.detail?`<span class="choice-detail">${esc(choice.detail)}</span>`:''}</span></label>`).join('')}</div>`;
  }

  function observationScene(mission) {
    const selected=state.answers[0];
    return `<div class="mission-layout"><div class="mission-stage mission-main"><div class="scene-wrap"><img class="scene-image" src="assets/lab-scene.svg" alt="Условная офисная зона с шестью объектами для осмотра. Те же объекты подробно описаны в списке рядом.">${mission.choices.map((choice,index)=>`<button type="button" class="hotspot${selected.includes(choice.id)?' is-selected':''}${state.solved[0]&&mission.correct.includes(choice.id)?' is-correct':''}" style="--x:${choice.x}%;--y:${choice.y}%" data-object-id="${choice.id}" aria-label="${index+1}. ${esc(choice.title)}. ${esc(choice.detail)}" aria-pressed="${selected.includes(choice.id)}" ${state.solved[0]?'disabled':''}>${index+1}</button>`).join('')}</div><p class="muted scene-caption">Учебная сцена. Номера на ней соответствуют объектам в списке.</p></div><aside class="mission-side mission-aside"><div class="section-heading"><h2>Объекты для осмотра</h2><p class="muted">Выберите опасные условия</p></div><div class="object-list">${mission.choices.map((choice,index)=>`<button type="button" class="object-item${selected.includes(choice.id)?' is-selected':''}${state.solved[0]&&mission.correct.includes(choice.id)?' is-correct':''}" data-object-id="${choice.id}" aria-pressed="${selected.includes(choice.id)}" ${state.solved[0]?'disabled':''}><span class="object-index">${index+1}</span><span class="object-copy"><span class="object-name">${esc(choice.title)}</span><span class="object-detail">${esc(choice.detail)}</span></span></button>`).join('')}</div></aside></div>`;
  }

  function contextMarkup(index) {
    if(index===1)return `<aside class="context-card"><p class="context-label">${icon('extinguisher')} ВАШЕ НАБЛЮДЕНИЕ</p><h2 class="context-title">Углекислотный огнетушитель</h2><span class="status-badge status-warning">Пломба сорвана</span><p>Ваша задача — заметить проблему и передать её ответственному. Это не техническое освидетельствование.</p></aside>`;
    if(index===2)return `<aside class="context-card"><p class="context-label">${icon('phone')} КАРТОЧКА СИТУАЦИИ</p><h2 class="context-title">Только учебные данные</h2><dl class="fact-list"><div class="fact-row"><dt class="fact-label">Адрес</dt><dd class="fact-value">Примерск, ул. Учебная, 10</dd></div><div class="fact-row"><dt class="fact-label">Место</dt><dd class="fact-value">Корпус Б, 2-й этаж, лаборатория 204</dd></div><div class="fact-row"><dt class="fact-label">Наблюдение</dt><dd class="fact-value">Из лаборатории идёт дым</dd></div><div class="fact-row"><dt class="fact-label">Люди внутри</dt><dd class="fact-value">Неизвестно</dd></div><div class="fact-row"><dt class="fact-label">Подъезд</dt><dd class="fact-value">С Учебной улицы, ворота № 1</dd></div><div class="fact-row"><dt class="fact-label">Ваша фамилия</dt><dd class="fact-value">Иванова</dd></div></dl></aside>`;
    if(index===3)return `<aside class="context-card"><p class="context-label">${icon('route')} УСЛОВНАЯ РАЗВИЛКА</p><h2 class="context-title">Выбирайте по обстановке</h2><div class="route-preview"><div class="route-option"><span>Коридор А</span><span class="route-state">Задымлён</span></div><div class="route-option"><span>Лестница Б → наружу</span><span class="route-state">Свободна, обозначена</span></div><div class="route-option"><span>Обычный лифт</span><span class="route-state">Кабина свободна</span></div></div><p class="muted">Учебная развилка, а не план эвакуации реального здания.</p></aside>`;
    if(index===4)return `<aside class="context-card"><p class="context-label">${icon('power')} ДРУГОЙ ЭПИЗОД</p><h2 class="context-title">Обычный день. Пожара нет.</h2><span class="status-badge status-neutral">Выберите несколько приборов</span><p>Для холодильника круглосуточная работа предусмотрена изготовителем и порядком объекта.</p><p>Пожарная сигнализация должна оставаться включённой.</p></aside>`;
    return '';
  }

  function feedbackMarkup() {
    const kind=state.feedback[state.current];
    if(!kind)return '';
    const mission=missions[state.current];
    const success=kind==='correct';
    const mismatches=mission.choices.filter(choice=>mission.type==='single'?state.answers[state.current].includes(choice.id):mission.correct.includes(choice.id)!==state.answers[state.current].includes(choice.id));
    return `<section class="feedback ${success?'feedback-success':'feedback-error'}" role="status" aria-live="polite"><div class="feedback-title">${icon(success?'check':'warning')}<h2>${success?'Верное решение':'Разберём этот выбор'}</h2></div>${success?`<p>${esc(mission.success)}</p>`:`<ul class="feedback-list">${mismatches.filter(choice=>choice.why).map(choice=>`<li>${esc(choice.why)}</li>`).join('')}</ul><p>Исправьте выбор и проверьте решение ещё раз.</p>`}</section>`;
  }

  function footerMarkup() {
    const index=state.current;
    const mission=missions[index];
    const done=state.solved[index];
    const selected=state.answers[index].length;
    const countText=mission.type==='objects'?`Отмечено ${selected} из 6 объектов`:mission.type==='multiple'?`Выбрано приборов: ${selected}`:selected?'Решение выбрано':'Выберите один вариант';
    return `<div class="mission-footer"><div class="selection-count" id="selection-count">${done?'Миссия разобрана':countText}</div><div class="button-row">${done?`<button type="button" class="button button-primary" data-action="next">${index===missions.length-1?'К результату':'Следующая миссия'} ${icon('arrow')}</button>`:`<button type="button" id="check-answer" class="button button-primary" data-action="check" ${selected?'':'disabled'}>${state.attempts[index]?'Проверить ещё раз':mission.type==='objects'?'Проверить осмотр':'Проверить решение'} ${icon('arrow')}</button>`}</div></div>`;
  }

  function renderMission() {
    const mission=missions[state.current];
    const reviewing=state.solved[state.current];
    screen.innerHTML=`<section class="screen screen-mission"><div class="mission-topline"><p class="eyebrow">МИССИЯ ${String(state.current+1).padStart(2,'0')} / 05</p>${reviewing?'<span class="status-badge status-neutral">Просмотр пройденного</span>':''}</div><div class="mission-heading"><h1 class="screen-title" tabindex="-1">${esc(mission.title)}</h1><p class="screen-lead">${esc(mission.subtitle)}</p></div>${mission.type==='objects'?observationScene(mission):`<div class="mission-layout"><div class="mission-stage mission-main">${choiceCards(mission)}</div><div class="mission-side mission-aside">${contextMarkup(state.current)}</div></div>`}<div id="feedback-area">${feedbackMarkup()}</div>${footerMarkup()}<details class="source-note"><summary>На чём основано задание</summary><p>${esc(mission.source)}</p><p>Учебный прототип по предоставленным редакциям; требует согласования для применения на объекте.</p></details><div id="quest-announcement" class="sr-only" aria-live="polite"></div></section>`;
  }

  function renderResults() {
    screen.innerHTML=`<section class="screen screen-results"><div class="result-hero"><p class="eyebrow">ПЯТЬ СИТУАЦИЙ РАЗОБРАНЫ</p><h1 class="screen-title" tabindex="-1">Решения, которые<br>стоит помнить</h1><p class="screen-lead">Вы прошли учебный разбор пожарной безопасности. Посмотрите, какие решения дались сразу, а какие потребовали объяснения.</p><div class="result-score"><strong>${firstAttemptCount()}<span> / 5</span></strong><p>миссий с верным решением<br>с первой попытки</p></div></div><div class="section-heading"><p class="eyebrow">КАРТА РАЗОБРАННЫХ НАВЫКОВ</p><h2>Что вы потренировали</h2></div><div class="skill-list">${missions.map((mission,index)=>`<div class="skill-item"><span class="skill-number">${icon(mission.icon)}</span><div class="skill-copy"><h3>${esc(mission.skill)}</h3><span class="skill-status">${state.attempts[index]===1?'С первой попытки':'После разбора'}</span></div><button class="button button-ghost" type="button" data-nav-index="${index}" aria-label="Посмотреть миссию: ${esc(mission.short)}">Посмотреть ${icon('arrow')}</button></div>`).join('')}</div><p class="muted">Результат относится только к этому учебному примеру. Он не подтверждает практические навыки и не является допуском к работе или сертификатом.</p><div class="result-actions button-row"><button type="button" class="button button-primary" data-action="restart">Повторить практику ${icon('arrow')}</button><button type="button" class="button button-secondary" data-action="home">На главную</button></div>${restartMarkup()}</section>`;
  }

  function render(focus=false) {
    updateShell();
    if(state.view==='mission')renderMission();else if(state.view==='results')renderResults();else renderHome();
    if(focus){screen.querySelector('h1')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}
  }

  function syncSelection() {
    const mission=missions[state.current];
    const answers=state.answers[state.current];
    screen.querySelectorAll('[data-object-id]').forEach(button=>{const selected=answers.includes(button.dataset.objectId);button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
    screen.querySelectorAll('[data-choice-card]').forEach(card=>{
      const selected=answers.includes(card.dataset.choiceCard);card.classList.toggle('is-selected',selected);
      const input=card.querySelector('input');if(input)input.checked=selected;
      if(mission.type==='multiple'){const index=mission.choices.findIndex(choice=>choice.id===card.dataset.choiceCard);card.querySelector('.choice-letter').innerHTML=selected?icon('check'):letters[index];}
    });
    const counter=screen.querySelector('#selection-count');
    if(counter)counter.textContent=mission.type==='objects'?`Отмечено ${answers.length} из 6 объектов`:mission.type==='multiple'?`Выбрано приборов: ${answers.length}`:answers.length?'Решение выбрано':'Выберите один вариант';
    const button=screen.querySelector('#check-answer');if(button)button.disabled=!answers.length;
    const feedback=screen.querySelector('#feedback-area');if(feedback)feedback.innerHTML='';
  }

  function selectChoice(id) {
    if(state.view!=='mission'||state.solved[state.current])return;
    const mission=missions[state.current];
    if(!mission.choices.some(choice=>choice.id===id))return;
    const answers=state.answers[state.current];
    state.answers[state.current]=mission.type==='single'?[id]:answers.includes(id)?answers.filter(value=>value!==id):[...answers,id];
    state.feedback[state.current]=null;save();syncSelection();
  }

  function checkAnswer() {
    const index=state.current;
    if(state.view!=='mission'||state.solved[index]||!state.answers[index].length)return;
    state.attempts[index]+=1;
    state.solved[index]=correctAnswer(index,state.answers[index]);
    state.feedback[index]=state.solved[index]?'correct':'wrong';
    save();render();
    screen.querySelector('.feedback')?.scrollIntoView({block:'nearest',behavior:'auto'});
    screen.querySelector('.mission-footer .button-primary')?.focus({preventScroll:true});
  }

  function navigateMission(index) {
    if(!Number.isInteger(index)||index<0||index>=missions.length||index>openIndex())return;
    state.started=true;state.current=index;state.view='mission';restartPending=false;save();render(true);
  }

  root.addEventListener('change',event=>{
    const input=event.target.closest('[data-choice-id]');
    if(input)selectChoice(input.dataset.choiceId);
  });
  root.addEventListener('click',event=>{
    const object=event.target.closest('[data-object-id]');
    if(object){selectChoice(object.dataset.objectId);return;}
    const route=event.target.closest('[data-nav-index]');
    if(route&&!route.disabled){navigateMission(Number(route.dataset.navIndex));return;}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(!action)return;
    if(action==='home'){state.view='home';restartPending=false;save();render(true);}
    else if(action==='start'||action==='resume')navigateMission(openIndex());
    else if(action==='how'){showHow=!showHow;const panel=screen.querySelector('#how-it-works');if(panel)panel.hidden=!showHow;event.target.closest('[data-action]').setAttribute('aria-expanded',String(showHow));if(showHow)panel?.scrollIntoView({block:'nearest',behavior:'smooth'});}
    else if(action==='check')checkAnswer();
    else if(action==='next'&&state.solved[state.current]){if(state.current<missions.length-1)navigateMission(state.current+1);else{state.view='results';save();render(true);}}
    else if(action==='results'&&state.solved.every(Boolean)){state.view='results';save();render(true);}
    else if(action==='restart'){restartPending=true;render();screen.querySelector('.restart-panel')?.scrollIntoView({block:'nearest',behavior:'auto'});screen.querySelector('[data-action="restart-confirm"]')?.focus({preventScroll:true});}
    else if(action==='restart-cancel'){restartPending=false;render();screen.querySelector('[data-action="restart"]')?.focus();}
    else if(action==='restart-confirm'){state=fresh();restartPending=false;save();render(true);}
  });
  render();
})();
