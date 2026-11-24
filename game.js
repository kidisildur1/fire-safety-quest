(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const TILE = 40, COLS = 24, ROWS = 16, SPEED = 156;
  const KEY = 'safe-shift:minigame-v2';
  const icons = {cable:'⌁',extinguisher:'▣',boxes:'▧',alarm:'◉',call:'☎',exit:'↗'};
  const objects = {
    cable: {x:3,y:3,title:'Повреждённый кабель',short:'Заметьте повреждение',desc:'Изоляция шнура повреждена. Прибор не включён. Не касайтесь повреждения и не пытайтесь ремонтировать его.',action:'Отметить: не пользоваться',source:'№ 3-ИПБ, пп. 5–7'},
    extinguisher: {x:11,y:6,title:'Огнетушитель без пломбы',short:'Проверьте огнетушитель',desc:'Пломба сорвана. Сообщите ответственному: он организует проверку и замену. Пробный пуск не нужен.',action:'Сообщить ответственному',source:'№ 2-ИПБ, пп. 2.13, 2.15'},
    boxes: {x:15,y:10,title:'Коробки в проходе',short:'Освободите проход',desc:'Три лёгкие пустые коробки мешают проходу. Пожара нет. Переместите их в обозначенную зону хранения.',action:'Перенести коробки',source:'№ 4-ИПБ, п. 2.2.25'},
    alarm: {x:14,y:11,title:'Ручной извещатель',short:'Предупредите людей',desc:'Извещатель находится на свободном пути к выходу. Подайте сигнал. Предупредить людей голосом также можно из безопасного места.',action:'Подать сигнал тревоги',source:'№ 4-ИПБ, п. 10.1'},
    call: {x:18,y:12,title:'Учебный вызов',short:'Сообщите о пожаре',desc:'Вы в свободной зоне коридора. Можно сделать учебный вызов сейчас или после выхода, с места сбора.',action:'Открыть учебный телефон',source:'№ 1-ИПБ: порядок действий; № 4-ИПБ, п. 10.1'},
    exit: {x:21,y:13,title:'Безопасный выход',short:'Дойдите до места сбора',desc:'Обозначенный свободный путь ведёт по эвакуационной лестнице наружу. Выход доступен сразу — завершать задания перед эвакуацией не требуется.',action:'Выйти к месту сбора',source:'№ 1-ИПБ: безопасные пути и выходы'}
  };
  const point = (x,y) => ({x:(x+.5)*TILE,y:(y+.5)*TILE});
  const initial = () => ({phase:'inspect',completed:[],player:{...point(6,12),dir:'down',moving:false},started:false,boxCount:0,mistakes:[],phoneFacts:[],sound:false});
  let state = initial(), path = [], pendingObject = null, nearest = null, lastContext = '', dialogKind = '', toastTimer;
  let keys = new Set(), lastTime = 0, audioContext, selectedBox = null, phoneNumber = '', dialed = false;
  let focusBeforeDialog = null;
  let parcelDrag = null, suppressBoxClickUntil = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && ['inspect','alarm','evacuate','finished'].includes(saved.phase) && Array.isArray(saved.completed)) {
      state = {...initial(),...saved,completed:saved.completed.filter(id=>objects[id]),mistakes:Array.isArray(saved.mistakes)?saved.mistakes:[],phoneFacts:Array.isArray(saved.phoneFacts)?saved.phoneFacts:[],player:{...point(6,12),...saved.player,moving:false}};
      if (!Number.isFinite(state.player.x)||!Number.isFinite(state.player.y)) state.player = {...point(6,12),dir:'down',moving:false};
      state.boxCount = Math.min(3,Math.max(0,Number(state.boxCount)||0));
    }
  } catch (_) {}
  const done = id => state.completed.includes(id);
  const incident = () => state.phase !== 'inspect';
  const modalOpen = () => !$('dialog').hidden || !$('overlay').hidden;
  const save = () => {try {localStorage.setItem(KEY,JSON.stringify({...state,player:{...state.player,moving:false}}));}catch(_) {}};
  const escape = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sound(success=true) {
    if (!state.sound) return;
    try {audioContext ||= new (window.AudioContext||window.webkitAudioContext)(); audioContext.resume();
      const osc=audioContext.createOscillator(), gain=audioContext.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(success?520:220,audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(success?780:180,audioContext.currentTime+.13);
      gain.gain.setValueAtTime(.035,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.2);
      osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.21);
    } catch (_) {}
  }
  function toast(message) {
    $('toast').textContent=message;$('status-text').textContent=message;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',5200);
  }
  function wall(x,y) {
    if(x<=0||x>=23||y<=0||y>=15) return true;
    if(x===12&&y<=11&&![5,6,10,11].includes(y)) return true;
    if(y===8&&x<=11&&![5,6].includes(x)) return true;
    if(y>=2&&y<=3&&((x>=2&&x<=6)||(x>=8&&x<=10))) return true;
    if(y>=10&&y<=11&&((x>=2&&x<=4)||(x>=8&&x<=10))) return true;
    if(x<=2&&y>=6&&y<=7) return true;
    if(!done('boxes')&&x===15&&y===10) return true;
    if(x>=20&&x<=21&&y>=2&&y<=3) return true;
    return false;
  }
  function smoke(x,y) {return incident()&&x<=11&&y<=7;}
  function blocked(x,y) {return wall(x,y)||smoke(x,y);}
  function passable(px,py) {
    return [[-9,-9],[9,-9],[-9,9],[9,9]].every(([dx,dy])=>!blocked(Math.floor((px+dx)/40),Math.floor((py+dy)/40)));
  }
  function routeTo(tx,ty) {
    if(blocked(tx,ty)) return null;
    const sx=Math.floor(state.player.x/40),sy=Math.floor(state.player.y/40), start=sy*24+sx, end=ty*24+tx;
    const queue=[start],prev=new Map([[start,null]]);
    for(let i=0;i<queue.length;i++) {
      const n=queue[i];if(n===end) break;
      const x=n%24,y=Math.floor(n/24);
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
        const nx=x+dx,ny=y+dy,k=ny*24+nx;
        if(!blocked(nx,ny)&&!prev.has(k)) {prev.set(k,n);queue.push(k);}
      }
    }
    if(!prev.has(end)) return null;
    const result=[];for(let n=end;n!==start;n=prev.get(n)) result.push(point(n%24,Math.floor(n/24)));
    result.reverse();
    if(result.length&&Math.hypot(state.player.x-(sx+.5)*40,state.player.y-(sy+.5)*40)>2) result.unshift(point(sx,sy));
    return result;
  }
  function activeObjects() {return state.phase==='inspect'?['cable','extinguisher','boxes']:['alarm','call','exit'];}
  function visibleBetween(a,b) {
    const length=Math.hypot(b.x-a.x,b.y-a.y);
    for(let n=8;n<length-24;n+=8) {
      const x=Math.floor((a.x+(b.x-a.x)*n/length)/40),y=Math.floor((a.y+(b.y-a.y)*n/length)/40);
      if(wall(x,y)) return false;
    } return true;
  }
  function closestObject() {
    let best=null,dist=73;
    for(const id of activeObjects()) {
      if(done(id)) continue;
      const p=point(objects[id].x,objects[id].y),d=Math.hypot(p.x-state.player.x,p.y-state.player.y);
      if(d<dist&&visibleBetween(state.player,p)) {best=id;dist=d;}
    } return best;
  }
  function goToObject(id) {
    if(modalOpen()||state.phase==='finished'||!activeObjects().includes(id)||done(id)) return;
    const o=objects[id]; let best=null;
    for(const [dx,dy] of [[0,1],[0,-1],[-1,0],[1,0]]) {
      const r=routeTo(o.x+dx,o.y+dy);
      if(r&&(!best||r.length<best.length)) best=r;
    }
    if(!best) {toast('Этот объект сейчас недоступен. Выберите свободный путь.');return;}
    path=best;pendingObject=id;keys.clear();toast(`Идём к объекту: ${o.title.toLowerCase()}.`);canvas.focus();
    if(!path.length) {nearest=closestObject();updateContext(true);}
  }
  function unsafe(id) {
    if(!state.mistakes.includes(id)) {state.mistakes.push(id);save();sound(false);}
    toast(id==='smoke'?'Здесь дым. Персонаж остановился: выберите свободный обозначенный путь.':'Обычный лифт при пожаре не используют. Двигайтесь по свободному пути к выходу.');
    path=[];pendingObject=null;
  }
  function updateHUD() {
    const titles={inspect:['01 · Обход','Найдите три опасных условия до начала работы'],alarm:['02 · Учебная тревога','Прекратите обычные дела. Безопасный выход доступен сразу'],evacuate:['02 · К месту сбора','Люди предупреждены, сообщение передано. Выходите'],finished:['Сценарий завершён','Вы у условного места сбора']};
    $('stage-name').textContent=titles[state.phase][0];$('stage-caption').textContent=titles[state.phase][1];
    $('progress-fill').style.width=`${state.completed.length/6*100}%`;
    $('progress-track')?.setAttribute('aria-valuenow',state.completed.length);
    if($('decision-count')) $('decision-count').textContent=`${state.completed.length} / 6`;
    $('sound-button').setAttribute('aria-pressed',String(state.sound));$('sound-button').textContent=state.sound?'Звук вкл.':'Звук выкл.';
    $('sound-button').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');
    const ids=state.phase==='inspect'?['cable','extinguisher','boxes']:['alarm','call','exit'];
    $('objectives').innerHTML=ids.map((id,i)=>`<li class="objective ${done(id)?'done':'active'}"><button type="button" data-go="${id}" ${done(id)||state.phase==='finished'?'disabled':''} aria-label="${done(id)?'Выполнено: ':'Пройти к объекту: '}${objects[id].short}"><span class="objective-icon" aria-hidden="true">${done(id)?'✓':icons[id]}</span><span><strong>${objects[id].short}</strong><small>${done(id)?'Готово':id==='boxes'?`${state.boxCount} из 3 коробок`:id==='exit'?'Выход всегда доступен':'Нажмите, чтобы подойти'}</small></span></button></li>`).join('');
    if(state.phase==='inspect'&&['cable','extinguisher','boxes'].every(done)) {
      $('objectives').innerHTML+='<li class="objective active"><button type="button" data-action="corridor"><span class="objective-icon">→</span><span><strong>Перейдите в коридор</strong><small>Продолжить сценарий</small></span></button></li>';
    }
    updateContext(true);
  }
  function updateContext(force=false) {
    if(!force&&nearest===lastContext) return;
    lastContext=nearest;
    $('interact-button').disabled=!nearest||modalOpen()||state.phase==='finished';
    if(nearest) {
      const o=objects[nearest];$('context-title').textContent=o.title;$('context-description').textContent=o.desc;
      $('context-actions').innerHTML=`<button type="button" class="action-button" data-action="interact"><span class="keycap">E</span> ${o.action}</button>`;
    } else {
      $('context-title').textContent=state.phase==='inspect'?'Исследуйте пространство':'Двигайтесь к безопасному выходу';
      $('context-description').textContent=state.phase==='inspect'?'Подойдите к отмеченному объекту. Нажмите E или кнопку действия. Можно нажать на карту или на задачу в журнале.':'Зелёные указатели ведут к выходу. Оповестите людей и сообщите о пожаре из безопасного места.';
      $('context-actions').innerHTML='';
    }
    if(incident()&&!done('alarm')&&state.phase!=='finished') $('context-actions').insertAdjacentHTML('beforeend','<button type="button" class="secondary-button" data-action="voice">Предупредить людей голосом</button>');
    if(incident()&&!done('call')&&state.phase!=='finished') $('context-actions').insertAdjacentHTML('beforeend','<button type="button" class="secondary-button" data-action="phone">Учебный вызов с этого места</button>');
  }
  function finishTask(id,message) {
    if(!done(id)) state.completed.push(id);
    if(state.phase!=='finished'&&incident()&&done('alarm')&&done('call')) state.phase='evacuate';
    sound();save();nearest=closestObject();updateHUD();toast(message);
  }
  function showDialog(kind,title,body,buttons) {
    keys.clear();path=[];state.player.moving=false;dialogKind=kind;
    if($('dialog').hidden) focusBeforeDialog=document.activeElement;
    $('dialog-title').textContent=title;$('dialog-content').innerHTML=body;$('dialog-actions').innerHTML=buttons;
    $('dialog').hidden=false;$('dialog').setAttribute('aria-labelledby','dialog-title');
    $('dialog-title').tabIndex=-1;
    requestAnimationFrame(()=>{$('dialog-title').focus({preventScroll:true});$('dialog').querySelector('.dialog-card').scrollTop=0;});
    updateContext(true);
  }
  const button=(action,label,secondary=false)=>`<button type="button" class="${secondary?'secondary-button':'action-button'}" data-action="${action}">${label}</button>`;
  function closeDialog() {
    $('dialog').hidden=true;dialogKind='';keys.clear();
    if(state.phase==='finished') showResult();
    else {updateContext(true);canvas.focus();}
  }
  function interact() {
    if(modalOpen()||state.phase==='finished') return;
    nearest=closestObject();if(!nearest) {toast('Подойдите ближе к отмеченному объекту.');return;}
    const id=nearest,o=objects[id];
    if(id==='cable'||id==='extinguisher') {
      showDialog(id,o.title,`<div class="inspection-scene ${id}"><span class="inspection-symbol" aria-hidden="true">${id==='cable'?'⌁':'▣'}</span><span class="inspection-tag">${id==='cable'?'ПОВРЕЖДЕНА ИЗОЛЯЦИЯ':'ПЛОМБА СОРВАНА'}</span></div><p>${o.desc}</p><p class="field-note">${id==='cable'?'В игре вы поставите отметку «Не пользоваться» и передадите сообщение руководителю.':'В игре вы передадите отметку ответственному. Самостоятельная проверка пробным пуском не выполняется.'}</p><small class="source-label">${o.source}</small>`,button(`report-${id}`,'Поставить отметку и сообщить')+button('close','Вернуться к обходу',true));
    } else if(id==='boxes') showBoxes();
    else if(id==='alarm') {finishTask('alarm','Сигнал подан. Следующий шаг — сообщение пожарной охране из безопасного места.');}
    else if(id==='call') openPhone();
    else if(id==='exit') {
      finishTask('exit','Вы у условного места сбора.');state.phase='finished';state.player={...point(21,13),dir:'down',moving:false};save();updateHUD();showResult();
    }
  }
  function showBoxes() {
    const remaining=3-state.boxCount;
    showDialog('boxes','Освободите проход',`<p>Пожара нет. Переместите <strong>лёгкие пустые коробки</strong> в зону хранения вне пути эвакуации.</p><div class="box-puzzle"><div class="box-source"><span class="puzzle-label">ПРОХОД</span><div class="box-row">${Array.from({length:remaining},(_,i)=>`<button class="parcel ${selectedBox===i?'selected':''}" type="button" draggable="true" data-box="${i}" aria-label="Взять пустую коробку ${i+1}"><span aria-hidden="true">▧</span>Коробка ${i+1}</button>`).join('')}</div></div><button type="button" class="storage-zone" data-action="store-box" ${selectedBox===null?'aria-disabled="true"':''}><span aria-hidden="true">↓</span><strong>Зона хранения</strong><small>${selectedBox===null?'Перетащите сюда коробку или выберите её нажатием':'Нажмите, чтобы поставить выбранную коробку'}</small></button></div><p class="field-note">Убрано ${state.boxCount} из 3. Во время пожара хозяйственные действия прекращают.</p>`,button('close','Вернуться на карту',true));
  }
  function storeBox() {
    if(dialogKind!=='boxes'||selectedBox===null) return;
    state.boxCount++;selectedBox=null;sound();save();
    if(state.boxCount===3) {closeDialog();finishTask('boxes','Проход свободен. Коробки находятся в обозначенной зоне хранения.');}
    else {showBoxes();updateHUD();}
  }
  const facts = [
    {id:'address',title:'Адрес и место',value:'Примерск, улица Учебная, 10, корпус Б, первый этаж, лаборатория 102.'},
    {id:'event',title:'Что произошло',value:'Из лаборатории идёт дым. Люди покидают здание.'},
    {id:'people',title:'Сведения о людях',value:'Есть ли люди внутри лаборатории, не знаю. Возвращаться для проверки не буду.'},
    {id:'name',title:'Кто звонит и подъезд',value:'Я Иванова. Подъезд с Учебной, через ворота № 1.'}
  ];
  function openPhone() {
    if(!incident()||done('call')) return;
    phoneNumber='';dialed=false;renderPhone();
  }
  function renderPhone() {
    const message=state.phase==='finished'?'Вы уже снаружи, у места сбора.':'В этой точке нет дыма. Если оставаться небезопасно, продолжите выход и позвоните снаружи.';
    if(!dialed) {
      showDialog('phone','Учебный телефон',`<p>${message}</p><div class="phone-layout"><div class="phone-device"><div class="phone-screen"><small>СИМУЛЯЦИЯ · РЕАЛЬНОГО ЗВОНКА НЕТ</small><output id="dial-display">${phoneNumber||'•••'}</output><span>Пожарная охрана: 101 / 112</span></div><div class="phone-keypad">${['1','2','3','4','5','6','7','8','9','⌫','0'].map(n=>`<button type="button" data-digit="${n}" aria-label="${n==='⌫'?'Удалить цифру':n}">${n}</button>`).join('')}<button type="button" data-action="dial" aria-label="Сделать учебный вызов" class="dial-button">☎</button></div></div><div class="call-notes"><span class="puzzle-label">КАРТОЧКА УЧЕБНОЙ СИТУАЦИИ</span>${facts.map(f=>`<p><strong>${f.title}</strong><br>${f.value}</p>`).join('')}<small>Все имена и адреса условные.</small></div></div>`,button('close',state.phase==='finished'?'К результату':'Продолжить выход',true));
    } else {
      showDialog('phone','Диспетчер слушает',`<p>Передайте известные сведения: нажмите на каждую карточку. Неизвестное не нужно угадывать.</p><div class="transmission-progress">Передано ${state.phoneFacts.length} из 4</div><div class="fact-cards">${facts.map(f=>`<button type="button" class="fact-card ${state.phoneFacts.includes(f.id)?'sent':''}" data-fact="${f.id}" ${state.phoneFacts.includes(f.id)?'disabled':''}><span>${state.phoneFacts.includes(f.id)?'✓ Передано':'↑ Передать'}</span><strong>${f.title}</strong><small>${f.value}</small></button>`).join('')}</div><p class="field-note">В реальном вызове отвечайте на уточняющие вопросы диспетчера. Этот экран никуда не звонит.</p>`,`<button type="button" class="action-button" data-action="finish-call" ${state.phoneFacts.length<4?'disabled':''}>Сообщение передано</button>`+button('close',state.phase==='finished'?'К результату':'Продолжить выход',true));
    }
  }
  function triggerIncident() {
    if(state.phase!=='inspect'||!['cable','extinguisher','boxes'].every(done)||state.player.x<13*40) return;
    state.phase='alarm';path=[];pendingObject=null;save();updateHUD();
    showDialog('incident','Учебная тревога',`<div class="story-card"><span class="badge">НОВАЯ СИТУАЦИЯ</span><h3>Из лаборатории идёт дым.</h3><p>Прекратите обычные дела. Вы находитесь в свободном коридоре. Предупредите людей, сообщите о пожаре из безопасного места и выходите по обозначенному пути.</p><p><strong>Выход доступен сразу.</strong> Не возвращайтесь в опасную зону ради заданий или вещей. Учебный вызов можно завершить снаружи.</p></div>`,button('close','Действовать'));
  }
  function showResult() {
    $('overlay').hidden=false;$('overlay-content').innerHTML=`<span class="badge">МИНИ-ИГРА ПРОЙДЕНА</span><h2>Вы в безопасности</h2><p>Вы у условного места сбора. Сообщите ответственному, что вышли. Не возвращайтесь в здание.</p><div class="result-grid"><div class="result-stat"><strong>${state.completed.length}<small>/6</small></strong><span>действий отработано</span></div><div class="result-stat"><strong>${state.mistakes.length===0?'✓':state.mistakes.length}</strong><span>${state.mistakes.length===0?'опасные пути не выбраны':'опасных выборов разобрано'}</span></div></div><div class="earned-badges"><span>✦ Наблюдатель</span>${done('alarm')?'<span>✦ Оповещение</span>':''}${done('call')?'<span>✦ Связист</span>':''}<span>✦ Безопасный маршрут</span></div>${!done('call')?'<p class="result-note">Вы вышли до вызова. Теперь из безопасного места сообщите пожарной охране.</p>':''}${!done('alarm')?'<p class="result-note">В этом прохождении люди не были предупреждены вами. При признаках пожара оповестите окружающих голосом или извещателем, не заходя в опасную зону.</p>':''}${state.mistakes.length?'<p class="result-note">Персонаж остановился перед опасным выбором. Дым и обычный лифт не подходят для эвакуации.</p>':''}<div class="overlay-actions">${!done('call')?button('phone','Учебный вызов с места сбора'):''}${button('restart','Новая смена',!done('call'))}${button('sources','Что мы отработали',true)}</div><small class="field-note">Учебный результат — не допуск к работе.</small>`;
    keys.clear();path=[];$('overlay-content').querySelector('button')?.focus({preventScroll:true});$('overlay-content').scrollTop=0;
  }
  function showWelcome() {
    $('overlay').hidden=false;
    $('overlay-content').innerHTML=`<span class="badge">ИНТЕРАКТИВНАЯ МИНИ-ИГРА</span><h2>Ваша смена.<br>Ваши решения.</h2><p>Вы — сотрудник научного кластера. Исследуйте лабораторию и офис, разберитесь с рисками и найдите безопасный путь при учебной тревоге.</p><div class="welcome-controls"><span><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> — идти</span><span><kbd>E</kbd> — действовать рядом с объектом</span><span>Или нажимайте на карту и задачи в журнале.</span></div><div class="overlay-actions"><button id="start-game" type="button" class="action-button" data-action="start">${state.started?'Продолжить смену':'Начать смену'} <span aria-hidden="true">→</span></button>${state.started?button('restart','Начать заново',true):''}</div><small class="field-note">Без гонки на время. Условная карта, 5–8 минут практики.</small>`;
  }
  function start() {
    if(state.phase==='finished') {showResult();return;}
    state.started=true;$('overlay').hidden=true;save();nearest=closestObject();updateHUD();canvas.focus();toast('Нажмите на карту, чтобы идти. Подойдите к объекту и нажмите E.');
  }
  function restart() {
    showDialog('restart','Начать новую смену?','<p>Текущее прохождение мини-игры будет сброшено.</p>',button('confirm-restart','Начать новую смену')+button('close','Оставить прогресс',true));
  }
  function help() {
    showDialog('help','Как играть',`<div class="story-card"><p><strong>Движение:</strong> WASD, стрелки, кнопки на экране или нажатие на свободное место карты. Персонаж сам обходит мебель и стены.</p><p><strong>Взаимодействие:</strong> подойдите к маркеру и нажмите E, пробел или кнопку действия. Задача в журнале тоже ведёт персонажа к объекту.</p><p><strong>Коробки:</strong> перетащите их в обозначенную зону или выберите коробку и нажмите на место хранения.</p><p><strong>Учебная тревога:</strong> прекратите обычные дела. Выходите по свободному пути. Задания не блокируют выход, а вызов можно сделать снаружи.</p><p>Скорость не оценивается. Прогресс сохраняется в этом браузере.</p></div>`,button('close','Понятно'));
  }
  function sources() {
    showDialog('sources','Что мы отработали',`<div class="source-list">${Object.entries(objects).map(([id,o])=>`<p><strong>${done(id)?'✓':'○'} ${o.title}</strong><br>${o.desc}<br><small>${o.source}</small></p>`).join('')}</div><p class="field-note">Карта, место сбора и обстоятельства условные. Действуйте по реальным инструкциям вашего объекта. Мини-игра не заменяет инструктаж и практическую отработку.</p>`,button('close','Вернуться'));
  }
  document.addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');if(go) {goToObject(go.dataset.go);return;}
    const box=e.target.closest('[data-box]');if(box) {if(performance.now()<suppressBoxClickUntil)return;selectedBox=Number(box.dataset.box);showBoxes();return;}
    const digit=e.target.closest('[data-digit]');if(digit&&dialogKind==='phone'&&!dialed) {phoneNumber=digit.dataset.digit==='⌫'?phoneNumber.slice(0,-1):(phoneNumber+digit.dataset.digit).slice(0,3);$('dial-display').textContent=phoneNumber||'•••';return;}
    const fact=e.target.closest('[data-fact]');if(fact&&dialogKind==='phone'&&dialed) {if(!state.phoneFacts.includes(fact.dataset.fact))state.phoneFacts.push(fact.dataset.fact);save();sound();renderPhone();return;}
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(!action)return;
    switch(action) {
      case 'start':start();break;
      case 'close':closeDialog();break;
      case 'interact':interact();break;
      case 'report-cable':closeDialog();finishTask('cable','Отметка «Не пользоваться» поставлена. Сообщение руководителю передано в учебном сценарии.');break;
      case 'report-extinguisher':closeDialog();finishTask('extinguisher','Ответственный уведомлён в учебном сценарии. Он организует замену огнетушителя.');break;
      case 'store-box':storeBox();break;
      case 'voice':if(incident()&&state.phase!=='finished')finishTask('alarm','Вы предупредили окружающих голосом: «Пожар! Выходим по свободному пути!»');break;
      case 'phone':openPhone();break;
      case 'dial':if(['101','112'].includes(phoneNumber)){dialed=true;sound();renderPhone();}else{toast('Для этого учебного вызова наберите 101 или 112.');sound(false);}break;
      case 'finish-call':if(state.phoneFacts.length===4){finishTask('call','Учебное сообщение передано. В реальном вызове отвечайте на вопросы диспетчера.');closeDialog();}break;
      case 'restart':restart();break;
      case 'confirm-restart':{const soundOn=state.sound;state=initial();state.sound=soundOn;path=[];keys.clear();nearest=null;selectedBox=null;$('dialog').hidden=true;dialogKind='';save();showWelcome();updateHUD();break;}
      case 'sources':sources();break;
      case 'corridor':path=routeTo(15,12)||[];pendingObject=null;canvas.focus();break;
    }
  });
  $('help-button').addEventListener('click',help);
  $('restart-button').addEventListener('click',restart);
  $('sound-button').addEventListener('click',()=>{state.sound=!state.sound;save();updateHUD();sound();});
  $('interact-button').addEventListener('click',interact);
  $('dialog').addEventListener('dragstart',e=>{if(e.target.closest('[data-box]'))e.preventDefault();});
  $('dialog').addEventListener('pointerdown',e=>{
    const box=e.target.closest('[data-box]');if(!box||dialogKind!=='boxes')return;
    e.preventDefault();selectedBox=Number(box.dataset.box);box.setPointerCapture(e.pointerId);box.classList.add('selected');
    parcelDrag={box,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,ghost:null};
  });
  $('dialog').addEventListener('pointermove',e=>{
    if(!parcelDrag||e.pointerId!==parcelDrag.pointerId)return;
    if(!parcelDrag.ghost&&Math.hypot(e.clientX-parcelDrag.startX,e.clientY-parcelDrag.startY)>7){
      parcelDrag.ghost=document.createElement('div');parcelDrag.ghost.className='drag-parcel';parcelDrag.ghost.textContent='▧';document.body.appendChild(parcelDrag.ghost);
    }
    if(parcelDrag.ghost){parcelDrag.ghost.style.left=`${e.clientX}px`;parcelDrag.ghost.style.top=`${e.clientY}px`;}
  });
  $('dialog').addEventListener('pointerup',e=>{
    if(!parcelDrag||e.pointerId!==parcelDrag.pointerId)return;
    const zone=$('dialog').querySelector('.storage-zone'),r=zone?.getBoundingClientRect();
    const dropped=parcelDrag.ghost&&r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    parcelDrag.ghost?.remove();parcelDrag=null;suppressBoxClickUntil=performance.now()+350;
    if(dropped)storeBox();else showBoxes();
  });
  $('dialog').addEventListener('pointercancel',()=>{parcelDrag?.ghost?.remove();parcelDrag=null;});
  canvas.addEventListener('pointerdown',e=>{
    if(modalOpen()||!state.started||state.phase==='finished')return;
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*960/r.width,y=(e.clientY-r.top)*640/r.height,tx=Math.floor(x/40),ty=Math.floor(y/40);
    canvas.focus();keys.clear();
    if(smoke(tx,ty)){unsafe('smoke');return;}
    if(incident()&&tx>=20&&ty>=2&&ty<=4){unsafe('lift');return;}
    const id=activeObjects().find(id=>!done(id)&&Math.hypot(point(objects[id].x,objects[id].y).x-x,point(objects[id].x,objects[id].y).y-y)<29);
    if(id){goToObject(id);return;}
    const route=routeTo(tx,ty);if(route){path=route;pendingObject=null;}else toast('Там препятствие. Нажмите на свободный участок пола.');
  });
  const moveCodes = {KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  document.addEventListener('keydown',e=>{
    if(e.key==='Tab'&&modalOpen()) {
      const panel=$('dialog').hidden?$('overlay'):$('dialog');
      const list=[...panel.querySelectorAll('button:not([disabled]),a[href],[tabindex="0"]')].filter(el=>el.offsetParent!==null);
      if(list.length&&(e.shiftKey&&document.activeElement===list[0]||!e.shiftKey&&document.activeElement===list[list.length-1])){e.preventDefault();list[e.shiftKey?list.length-1:0].focus();}return;
    }
    if(e.code==='Escape'&&!$('dialog').hidden){e.preventDefault();closeDialog();return;}
    if(modalOpen()||state.phase==='finished'||!state.started)return;
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
    if(moveCodes[e.code]){e.preventDefault();keys.add(moveCodes[e.code]);path=[];pendingObject=null;}
    if((e.code==='KeyE'||e.code==='Space')&&!e.repeat&&document.activeElement.tagName!=='BUTTON'){e.preventDefault();interact();}
  });
  document.addEventListener('keyup',e=>{if(moveCodes[e.code]) {keys.delete(moveCodes[e.code]);save();}});
  document.querySelectorAll('[data-move]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{if(modalOpen())return;e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);path=[];pendingObject=null;});
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,()=>{keys.delete(b.dataset.move);save();}));
  });
  window.addEventListener('blur',()=>{keys.clear();path=[];save();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();path=[];save();}});
  function move(dt) {
    if(modalOpen()||!state.started||state.phase==='finished'){state.player.moving=false;return;}
    let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
    if(!dx&&!dy&&path.length){const p=path[0],vx=p.x-state.player.x,vy=p.y-state.player.y,d=Math.hypot(vx,vy);if(d<Math.max(2,SPEED*dt)){state.player.x=p.x;state.player.y=p.y;path.shift();if(!path.length){save();if(pendingObject)toast('Вы у объекта. Нажмите E или кнопку действия.');pendingObject=null;}}else{dx=vx/d;dy=vy/d;}}
    const n=Math.hypot(dx,dy);state.player.moving=n>0;
    if(n){dx/=n;dy/=n;const step=SPEED*dt,nx=state.player.x+dx*step,ny=state.player.y+dy*step;
      const aheadX=Math.floor((nx+dx*10)/40),aheadY=Math.floor((ny+dy*10)/40);
      if(smoke(aheadX,aheadY)){if(!state.mistakes.includes('smoke'))unsafe('smoke');}
      if(incident()&&aheadX>=20&&aheadX<=21&&aheadY>=2&&aheadY<=3&&!state.mistakes.includes('lift'))unsafe('lift');
      if(passable(nx,state.player.y))state.player.x=nx;
      if(passable(state.player.x,ny))state.player.y=ny;
      state.player.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    }
    nearest=closestObject();updateContext();triggerIncident();
  }
  function frame(time) {
    const dt=Math.min((time-lastTime)/1000||0,.035);lastTime=time;move(dt);
    const current=activeObjects().find(id=>!done(id));
    if(window.QuestArt)window.QuestArt.draw(ctx,{...state,nearby:nearest,current,path,target:path[path.length-1]||null,paused:modalOpen()},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:time);
    requestAnimationFrame(frame);
  }
  if(!passable(state.player.x,state.player.y))state.player={...point(6,12),dir:'down',moving:false};
  updateHUD();if(state.phase==='finished')showResult();else showWelcome();requestAnimationFrame(frame);
})();
