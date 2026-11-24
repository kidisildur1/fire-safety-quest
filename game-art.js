(function () {
  'use strict';

  const W = 960, H = 640, T = 40;
  const C = {
    outside: '#273f43', lab: '#edf4f2', office: '#f4f1e9', corridor: '#e8eeeb',
    line: '#cfdbd5', wall: '#597274', wallTop: '#8ba19f', wallEdge: '#405b60',
    ink: '#294247', muted: '#6d8281', white: '#ffffff', blue: '#376f93',
    blueLight: '#dcecf4', green: '#2d8369', greenLight: '#d4eadf',
    red: '#be5545', amber: '#ce9854', wood: '#c9b68f', metal: '#8a9f9d'
  };
  const points = {
    cable: {x:140,y:140,label:'Проверить кабель'},
    extinguisher: {x:460,y:260,label:'Осмотреть огнетушитель'},
    boxes: {x:620,y:420,label:'Освободить проход'},
    alarm: {x:580,y:460,label:'Подать сигнал'},
    call: {x:740,y:500,label:'Учебный вызов'},
    exit: {x:860,y:540,label:'Выход и место сбора'}
  };

  function round(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w/2, h/2));
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }
  function rect(ctx,x,y,w,h,color,r) { ctx.fillStyle=color;round(ctx,x,y,w,h,r||0);ctx.fill(); }
  function line(ctx,x1,y1,x2,y2,color,width) {ctx.strokeStyle=color;ctx.lineWidth=width||1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function circle(ctx,x,y,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function text(ctx,value,x,y,size,color,weight,align) {
    ctx.font=`${weight||500} ${size||12}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillStyle=color||C.ink;ctx.textAlign=align||'left';ctx.textBaseline='middle';ctx.fillText(value,x,y);
  }
  function shadow(ctx,x,y,w,h,r) {
    rect(ctx,x+2,y+5,w,h,'rgba(34,58,57,.12)',r||6);
    rect(ctx,x+1,y+2,w,h,'rgba(34,58,57,.06)',r||6);
  }
  function pill(ctx,label,x,y,fill,fg) {
    ctx.font='600 10px "Inter", "Segoe UI", sans-serif';
    const width=ctx.measureText(label).width+18;
    rect(ctx,x-width/2,y-10,width,20,fill,6);text(ctx,label,x,y,10,fg,600,'center');
  }
  function check(ctx,x,y,color,width) {
    ctx.lineWidth=width||2;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x-1,y+3);ctx.lineTo(x+5,y-4);ctx.stroke();
  }
  function roomTag(ctx,number,label,x,y) {
    rect(ctx,x,y-10,22,20,'rgba(69,104,102,.09)',5);text(ctx,number,x+11,y,9,C.muted,700,'center');
    text(ctx,label,x+31,y,11,C.muted,700);
  }

  function floor(ctx,state) {
    rect(ctx,0,0,W,H,C.outside);
    rect(ctx,40,40,440,280,C.lab);
    rect(ctx,40,360,440,240,C.office);
    rect(ctx,480,40,440,560,C.corridor);
    rect(ctx,200,320,80,40,'#edf0e9');
    rect(ctx,480,200,40,80,C.corridor);
    rect(ctx,480,400,40,80,C.corridor);
    rect(ctx,480,480,40,120,C.corridor);
    ctx.save();ctx.globalAlpha=.58;
    for(let x=40;x<=920;x+=40)line(ctx,x,40,x,600,C.line,.65);
    for(let y=40;y<=600;y+=40)line(ctx,40,y,920,y,C.line,.65);
    ctx.restore();
    rect(ctx,42,42,436,5,'#d2e2dc');
    rect(ctx,42,362,436,4,'#e1dcca');
    roomTag(ctx,'01','ЛАБОРАТОРИЯ',60,60);
    roomTag(ctx,'02','ОФИС',60,380);
    roomTag(ctx,'03','КОРИДОР',548,60);

    // A restrained floor guide follows the safe lower corridor only.
    const active=state.phase==='alarm'||state.phase==='evacuate'||state.phase==='finished';
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    ctx.strokeStyle=active?'rgba(62,143,110,.15)':'rgba(62,143,110,.055)';ctx.lineWidth=35;
    ctx.beginPath();ctx.moveTo(570,450);ctx.lineTo(570,540);ctx.lineTo(895,540);ctx.stroke();
    ctx.strokeStyle=active?'rgba(49,130,99,.55)':'rgba(49,130,99,.18)';ctx.lineWidth=2;
    [620,700,780].forEach(x=>{ctx.beginPath();ctx.moveTo(x-5,535);ctx.lineTo(x+1,540);ctx.lineTo(x-5,545);ctx.stroke();});
    ctx.restore();
  }

  function wallTile(ctx,x,y) {
    rect(ctx,x,y,T,T,C.wall);
    rect(ctx,x+2,y+2,T-4,8,C.wallTop,1);
    rect(ctx,x,y+T-6,T,6,C.wallEdge);
    line(ctx,x+1,y+10,x+T-1,y+10,'rgba(225,239,230,.13)',1);
    line(ctx,x+T-1,y+11,x+T-1,y+T-5,'rgba(25,48,51,.10)',1);
  }
  function walls(ctx) {
    // Shadows are drawn only at the map's actual wall cells.
    const cells=[];
    for(let x=0;x<24;x++){cells.push([x,0]);cells.push([x,15]);}
    for(let y=1;y<15;y++){cells.push([0,y]);cells.push([23,y]);}
    for(let y=1;y<=11;y++)if(![5,6,10,11].includes(y))cells.push([12,y]);
    for(let x=1;x<=11;x++)if(![5,6].includes(x))cells.push([x,8]);
    cells.forEach(([x,y])=>rect(ctx,x*T+2,y*T+5,T,T,'rgba(33,58,57,.14)'));
    cells.forEach(([x,y])=>wallTile(ctx,x*T,y*T));
    // Door sills preserve every opening in the movement map.
    [[484,200,32,5],[484,275,32,5],[200,324,5,32],[275,324,5,32],[484,400,32,5],[484,475,32,5]].forEach(r=>rect(ctx,r[0],r[1],r[2],r[3],'#a6b6af',2));
    text(ctx,'УЧЕБНЫЙ КОРПУС',50,22,10,'#e4eeea',700);
    text(ctx,'СХЕМА УСЛОВНАЯ',910,22,9,'#c8d8d1',500,'right');
  }

  function bench(ctx,x,y,w,h) {
    shadow(ctx,x,y,w,h,7);
    rect(ctx,x,y,w,h,'#7e9791',7);
    rect(ctx,x+2,y+2,w-4,h-10,'#d8e1d8',6);
    rect(ctx,x+8,y+8,w-16,h-23,'#edf1e6',3);
    rect(ctx,x+5,y+h-12,w-10,5,'#a9bcb3',2);
    for(let dx=9;dx<w-12;dx+=46){line(ctx,x+dx,y+h-7,x+dx+25,y+h-7,'#617e74',2);}
  }
  function appliance(ctx,x,y,w,h) {
    shadow(ctx,x,y,w,h,3);rect(ctx,x,y,w,h,'#a7b5b3',4);
    rect(ctx,x+2,y+2,w-4,h-6,'#e9efec',3);
  }
  function labFurniture(ctx,done) {
    bench(ctx,80,80,200,80);bench(ctx,320,80,120,80);
    // Electric kettle on the front bench; the damaged section is at tile (3,3).
    appliance(ctx,106,100,29,30);
    circle(ctx,120,112,11,'#e9efed');circle(ctx,120,112,7,'#ccd8d3');
    rect(ctx,129,104,8,14,'#526f72',4);rect(ctx,132,107,3,8,'#dfe9e4',2);
    line(ctx,117,126,117,140,'#425a5d',2.6);
    ctx.strokeStyle='#425a5d';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(117,140);ctx.bezierCurveTo(125,151,135,129,145,141);ctx.lineTo(166,141);ctx.stroke();
    // Reporting a defect is not depicted as the employee repairing it.
    line(ctx,135,138,140,143,'#c07941',2.5);line(ctx,142,139,147,143,'#c07941',2.5);
    line(ctx,137,134,140,137,C.red,1.4);line(ctx,145,147,147,150,C.red,1.4);
    // A compact hotplate and microwave share the bench surface.
    appliance(ctx,183,96,30,28);circle(ctx,198,108,8,'#566d70');circle(ctx,198,108,4,'#7b8d8b');
    appliance(ctx,226,95,40,31);rect(ctx,230,99,25,19,'#526d73',2);rect(ctx,232,101,21,15,'#739395',1);
    circle(ctx,260,104,2,'#7d9290');circle(ctx,260,113,2,'#7d9290');
    // Second bench: microscope and labelled sample trays.
    rect(ctx,336,106,31,26,'#6b8985',5);rect(ctx,341,109,21,16,'#e2ebe3',3);
    line(ctx,349,110,355,96,'#718c88',7);line(ctx,355,96,368,99,'#405e65',7);
    rect(ctx,372,106,51,26,'#b8cdc2',4);
    for(let row=0;row<2;row++)for(let col=0;col<5;col++)circle(ctx,379+col*9,113+row*11,2.5,row?'#94b1a4':'#d9e5da');
    // Cabinet footprint is exactly x1..2, y6..7.
    shadow(ctx,40,240,80,80,4);rect(ctx,40,240,80,80,'#92a9a0',4);
    rect(ctx,44,244,34,69,'#c7d5c7',3);rect(ctx,82,244,34,69,'#c7d5c7',3);
    line(ctx,72,270,72,284,'#6b8277',2);line(ctx,88,270,88,284,'#6b8277',2);
    rect(ctx,49,249,22,17,'#e1e8d9',2);rect(ctx,88,249,22,17,'#e1e8d9',2);
    text(ctx,'ШКАФ',80,300,8,'#637a6f',700,'center');
  }

  function desk(ctx,x,y,w,h,second) {
    shadow(ctx,x,y,w,h,6);rect(ctx,x,y,w,h,'#b29d79',6);rect(ctx,x+2,y+2,w-4,h-8,'#d9c9a5',5);
    line(ctx,x+8,y+12,x+w-8,y+12,'rgba(255,255,255,.23)',1);
    rect(ctx,x+20,y+13,42,28,'#395b66',4);rect(ctx,x+23,y+16,36,21,second?'#8daead':'#87a9b7',2);
    line(ctx,x+41,y+41,x+41,y+48,'#718583',4);rect(ctx,x+29,y+46,25,5,'#82948f',2);
    rect(ctx,x+19,y+53,45,14,'#e4e7db',3);
    for(let i=0;i<6;i++)line(ctx,x+24+i*6,y+56,x+24+i*6,y+63,'#b6c1b3',1);
    rect(ctx,x+72,y+51,9,14,'#efeee2',4);
    rect(ctx,x+w-29,y+16,20,28,'#e9e9db',2);line(ctx,x+w-25,y+23,x+w-13,y+23,'#aeb7a4',1);line(ctx,x+w-25,y+28,x+w-13,y+28,'#aeb7a4',1);
    circle(ctx,x+w-22,y+62,7,'#e2e4d5');circle(ctx,x+w-22,y+62,4,'#8c7a61');
  }
  function officeFurniture(ctx) {
    desk(ctx,80,400,120,80,false);desk(ctx,320,400,120,80,true);
    // All decor sits on desks; no new floor obstacles are introduced.
    rect(ctx,335,451,13,13,'#c8d5bf',3);circle(ctx,342,454,6,'#658b68');
    text(ctx,'РАБОЧИЕ МЕСТА',260,579,10,'#8a927f',600,'center');
  }

  function extinguisher(ctx,done) {
    const x=points.extinguisher.x,y=points.extinguisher.y;
    rect(ctx,x-12,y-19,24,42,'rgba(43,68,64,.10)',4);
    rect(ctx,x-7,y-13,14,29,'#ad5147',6);rect(ctx,x-5,y-11,4,24,'#cf7461',3);
    rect(ctx,x-7,y-3,14,8,'#f1eadd',1);text(ctx,'ОУ',x,y+1,6,'#6b5750',700,'center');
    rect(ctx,x-4,y-19,8,7,'#516a6d',2);line(ctx,x-1,y-19,x+8,y-19,'#455c61',3);
    ctx.strokeStyle='#425d62';ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(x+7,y-18);ctx.quadraticCurveTo(x+14,y-10,x+12,y+2);ctx.stroke();
    // A completed report does not imply a self-performed repair or resealing.
    line(ctx,x-1,y-15,x-7,y-11,'#b8b5a1',1);circle(ctx,x-8,y-10,2,'#c9af74');
  }
  function box(ctx,x,y,size) {
    shadow(ctx,x,y,size,size,2);rect(ctx,x,y,size,size,'#b58c59',2);rect(ctx,x+1,y+1,size-2,size-5,'#d1ac77',2);
    rect(ctx,x+size*.42,y+1,size*.17,size-5,'#e8cd9e',1);
    line(ctx,x+2,y+size*.47,x+size-2,y+size*.47,'#bc9764',1);
    rect(ctx,x+4,y+4,8,5,'#e9d8b7',1);
  }
  function boxes(ctx,done) {
    const moved=done.has('boxes');const x=moved?820:620,y=420;
    if(moved){
      ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle='#b9c8bb';ctx.lineWidth=1;round(ctx,789,389,63,61,6);ctx.stroke();ctx.restore();
      text(ctx,'УБРАНО',820,462,8,'#78917e',600,'center');
    }
    box(ctx,x-24,y-13,26);box(ctx,x+3,y-4,29);box(ctx,x-5,y-28,22);
  }
  function alarm(ctx,done) {
    const x=points.alarm.x,y=points.alarm.y;
    // A compact wall panel is a visual fixture, not a new collision tile.
    rect(ctx,x-15,y-17,30,34,'#c4d0c8',4);rect(ctx,x-11,y-13,22,24,'#bd5146',3);
    rect(ctx,x-7,y-8,14,13,'#f1e3d5',1);circle(ctx,x,y-2,4,done.has('alarm')?'#74a58a':'#bd5146');
    text(ctx,'ПОЖАР',x,y+17,7,'#786460',700,'center');
    if(done.has('alarm'))circle(ctx,x+8,y-10,2,'#d7f5d5');
  }
  function telephoneZone(ctx,phase) {
    const x=points.call.x,y=points.call.y;
    rect(ctx,x-48,y-37,96,77,phase==='inspect'?'rgba(71,133,101,.04)':'rgba(71,133,101,.12)',12);
    ctx.save();ctx.strokeStyle='rgba(55,123,91,.32)';ctx.lineWidth=1.3;ctx.setLineDash([4,5]);round(ctx,x-47,y-36,94,75,11);ctx.stroke();ctx.restore();
    circle(ctx,x,y,18,'#dfebe1');
    ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.strokeStyle='#668e77';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-7,-10);ctx.quadraticCurveTo(-9,5,7,10);ctx.stroke();
    line(ctx,-7,-10,-3,-10,'#668e77',6);line(ctx,7,10,10,7,'#668e77',6);ctx.restore();
    text(ctx,'УЧЕБНЫЙ ВЫЗОВ',x,y+53,8,'#64816e',700,'center');
  }
  function elevator(ctx) {
    const x=860,y=140;
    shadow(ctx,x-28,y-31,56,62,5);rect(ctx,x-28,y-31,56,62,'#a3afab',5);
    rect(ctx,x-23,y-24,46,50,'#cad2cd',3);rect(ctx,x-20,y-21,19,44,'#b4c3be',1);rect(ctx,x+1,y-21,19,44,'#b4c3be',1);
    line(ctx,x,y-21,x,y+23,'#8d9e98',1.5);rect(ctx,x-11,y-34,22,9,'#496264',2);
    text(ctx,'↑ ↓',x,y-29,6,'#d9e9df',600,'center');text(ctx,'ЛИФТ',x,y+45,10,'#6c8079',700,'center');
    text(ctx,'НЕ ДЛЯ ЭВАКУАЦИИ',x,y+59,7,'#8e8f7d',500,'center');
  }
  function exit(ctx,finished) {
    const x=860,y=540;
    rect(ctx,901,516,20,49,'#b4d5bf',2);rect(ctx,909,520,9,41,'#4f9070',1);
    line(ctx,913,521,913,560,'#81b192',1);circle(ctx,906,542,1.5,'#547e66');
    rect(ctx,837,576,67,18,'#3e8666',4);text(ctx,'ВЫХОД →',870,585,9,'#f5fbf2',700,'center');
    ctx.save();ctx.strokeStyle=finished?'#5f9c79':'#a5c6ad';ctx.lineWidth=2;ctx.setLineDash([5,4]);round(ctx,x-25,y-22,50,45,9);ctx.stroke();ctx.restore();
    ctx.strokeStyle='#7aa887';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+10,y);ctx.moveTo(x+4,y-6);ctx.lineTo(x+10,y);ctx.lineTo(x+4,y+6);ctx.stroke();
  }

  function smoke(ctx,t,phase) {
    if(!['alarm','evacuate','finished'].includes(phase))return;
    ctx.save();ctx.beginPath();ctx.rect(80,78,360,122);ctx.clip();
    const clouds=[ [112,108,34],[160,128,39],[210,104,41],[252,142,43],[305,113,45],[355,142,38],[404,110,40],[178,174,34],[330,179,31] ];
    clouds.forEach(([x,y,r],i)=>{
      const drift=Math.sin(t*.7+i*1.7)*3;
      const gradient=ctx.createRadialGradient(x+drift,y,2,x+drift,y,r);
      gradient.addColorStop(0,'rgba(73,91,88,.24)');gradient.addColorStop(.64,'rgba(88,104,100,.18)');gradient.addColorStop(1,'rgba(88,104,100,0)');
      circle(ctx,x+drift,y,r,gradient);
    });ctx.restore();
    pill(ctx,'ЗАДЫМЛЕНО · НЕ ВХОДИТЬ',260,219,'#efe1d7','#976952');
  }
  function currentTask(state,done) {
    const explicit=state.currentTask||state.current||state.objectiveId;
    if(typeof explicit==='string'&&points[explicit])return explicit;
    const list=state.phase==='inspect'?['cable','extinguisher','boxes']:state.phase==='alarm'?['alarm','call']:state.phase==='evacuate'?['exit']:[];
    return list.find(id=>!done.has(id))||null;
  }
  function marker(ctx,id,done,current,nearby,t,phase) {
    const point=points[id];const x=point.x,y=point.y-34;
    const complete=done.has(id);const focused=id===current||id===nearby;
    const available=phase==='inspect'?['cable','extinguisher','boxes','exit'].includes(id):true;
    const fill=complete?C.green:focused?C.blue:available?'#678994':'#9eafaa';
    line(ctx,x,y+12,x,point.y-9,'rgba(55,82,78,.3)',1);
    if(focused&&!complete){const radius=17+Math.sin(t*3.4)*2;circle(ctx,x,y,radius,'rgba(63,115,148,.10)');}
    circle(ctx,x+1,y+2,12,'rgba(24,50,50,.13)');circle(ctx,x,y,12,C.white);circle(ctx,x,y,9,fill);
    if(complete)check(ctx,x,y,C.white,1.7);
    else if(id==='exit'){line(ctx,x-4,y,x+4,y,C.white,1.5);line(ctx,x+1,y-3,x+4,y,C.white,1.5);line(ctx,x+1,y+3,x+4,y,C.white,1.5);}
    else{circle(ctx,x,y-2,1.2,C.white);line(ctx,x,y+1,x,y+4,C.white,1.5);}
    if(focused&&phase!=='finished')pill(ctx,point.label,x,y-25,complete?'#e5f0e6':'#f7fbf6',complete?C.green:C.ink);
  }
  function navigation(ctx,state,t) {
    if(Array.isArray(state.path)){
      state.path.forEach((point,i)=>{
        const x=Array.isArray(point)?point[0]:point?.x,y=Array.isArray(point)?point[1]:point?.y;
        if(Number.isFinite(x)&&Number.isFinite(y)&&x>40&&x<920&&y>40&&y<600)circle(ctx,x,y,2.1,i%3===0?'rgba(64,117,148,.55)':'rgba(64,117,148,.32)');
      });
    }
    const target=state.target;
    if(target&&Number.isFinite(target.x)&&Number.isFinite(target.y)){
      ctx.save();ctx.strokeStyle='rgba(57,112,144,.65)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(target.x,target.y,9+Math.sin(t*4)*.8,0,Math.PI*2);ctx.stroke();
      circle(ctx,target.x,target.y,2,'#54849c');ctx.restore();
    }
  }
  function direction(dir) {
    if(typeof dir==='number'&&Number.isFinite(dir))return dir-Math.PI/2;
    if(dir&&typeof dir==='object'&&Number.isFinite(dir.x)&&Number.isFinite(dir.y))return Math.atan2(dir.y,dir.x)-Math.PI/2;
    return ({down:0,south:0,left:Math.PI/2,west:Math.PI/2,up:Math.PI,north:Math.PI,right:-Math.PI/2,east:-Math.PI/2})[dir]||0;
  }
  function player(ctx,actor,t,paused,finished) {
    const x=Number.isFinite(actor?.x)?actor.x:260,y=Number.isFinite(actor?.y)?actor.y:500;
    const moving=!!actor?.moving&&!paused;
    const frame=moving?Math.floor(t*9)%4:0;
    const step=moving?[0,2.2,0,-2.2][frame]:0;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='rgba(38,69,66,.18)';ctx.beginPath();ctx.ellipse(1,5,14,8,0,0,Math.PI*2);ctx.fill();
    if(finished){ctx.strokeStyle='rgba(46,134,99,.28)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.stroke();}
    ctx.rotate(direction(actor?.dir));
    // Four restrained walk poses; lab coat, trousers and identity badge stay legible.
    rect(ctx,-8,10+step,6,10,'#3b5867',2);rect(ctx,2,10-step,6,10,'#3b5867',2);
    rect(ctx,-9,17+step,8,4,'#29404c',2);rect(ctx,1,17-step,8,4,'#29404c',2);
    rect(ctx,-14,-2-step*.5,6,14,'#dce9e5',3);rect(ctx,8,-2+step*.5,6,14,'#e7efea',3);
    circle(ctx,-11,12-step*.5,3,'#cda58b');circle(ctx,11,12+step*.5,3,'#d8b399');
    rect(ctx,-10,-6,20,22,'#56737a',6);rect(ctx,-9,-6,18,21,'#f7faf3',5);
    ctx.fillStyle='#d7e4de';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(-3,4);ctx.lineTo(0,15);ctx.lineTo(3,4);ctx.closePath();ctx.fill();
    line(ctx,0,3,0,15,'#aebeb7',.8);rect(ctx,4,3,4,5,'#8cb7ba',.7);
    line(ctx,-7,8,-3,8,'#b8c9c0',1);line(ctx,3,8,7,8,'#b8c9c0',1);
    circle(ctx,0,-8,8.5,'#bd947e');circle(ctx,0,-9,7.7,'#ddb79b');
    ctx.fillStyle='#40565c';ctx.beginPath();ctx.arc(0,-11,8,Math.PI,0);ctx.lineTo(7,-8);ctx.quadraticCurveTo(2,-10,-2,-7);ctx.lineTo(-7,-8);ctx.closePath();ctx.fill();
    circle(ctx,-2.5,-7.5,.75,'#53615e');circle(ctx,2.5,-7.5,.75,'#53615e');
    ctx.restore();
    pill(ctx,'ВЫ',x,y-35,'#2f5969','#f6faf4');
  }

  function draw(ctx, state, time) {
    if(!ctx)return;
    state=state||{};
    const phase=state.phase||'inspect';
    const normalized=Object.assign({},state,{phase});
    const done=new Set(Array.isArray(state.completed)?state.completed:state.completed instanceof Set?Array.from(state.completed):[]);
    const t=state.paused||state.reducedMotion?0:(Number.isFinite(time)?time/1000:0);
    ctx.save();
    ctx.globalAlpha=1;ctx.lineCap='butt';ctx.lineJoin='round';
    ctx.clearRect(0,0,W,H);
    floor(ctx,normalized);walls(ctx);labFurniture(ctx,done);officeFurniture(ctx);
    elevator(ctx);extinguisher(ctx,done);boxes(ctx,done);alarm(ctx,done);telephoneZone(ctx,phase);exit(ctx,phase==='finished');
    smoke(ctx,t,phase);navigation(ctx,state,t);
    const current=currentTask(normalized,done);
    Object.keys(points).forEach(id=>marker(ctx,id,done,current,state.nearby,t,phase));
    player(ctx,state.player,t,!!state.paused,phase==='finished');
    ctx.restore();
  }

  window.QuestArt = {draw};
})();
