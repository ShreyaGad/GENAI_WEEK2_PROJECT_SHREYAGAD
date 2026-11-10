(() => {
  'use strict';

  const canvas = document.querySelector('#race');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);
  const shell = $('gameShell');
  const ui = {
    hud: $('hud'), lap: $('lapValue'), clock: $('clockValue'), best: $('bestValue'), coins: $('coinValue'),
    intro: $('introScreen'), pause: $('pauseScreen'), finish: $('finishScreen'), controls: $('touchControls'),
    speed: $('speedometer'), speedValue: $('speedValue'), sound: $('soundButton'), pauseButton: $('pauseButton'),
    boostBadge: $('boostBadge'), boostCount: $('boostCount'), message: $('raceMessage'), toast: $('toast'),
    introBest: $('introBest'), start: $('startButton'), resume: $('resumeButton'), restart: $('restartButton'),
    again: $('raceAgainButton'), finishTime: $('finishTime'), finishTitle: $('finishTitle'),
    finishDetail: $('finishDetail'), finishEyebrow: $('finishEyebrow'), left: $('leftButton'), right: $('rightButton'), boost: $('boostButton'),
    scoresButton: $('scoresButton'), scoreScreen: $('scoreScreen'), highScores: $('highScores'), previousScores: $('previousScores'),
    scoresBack: $('scoresBackButton'), pauseHome: $('pauseHomeButton'), finishHome: $('finishHomeButton'),
    lifeMeter: $('lifeMeter'), gameOver: $('gameOverScreen'), gameOverBest: $('gameOverBest'), gameOverDetail: $('gameOverDetail'),
    gameOverStandings: $('gameOverStandings'), gameOverAgain: $('gameOverAgainButton'), gameOverHome: $('gameOverHomeButton'),
    finishStandings: $('finishStandings')
  };
  const LAP_LENGTH = 1800;
  const VISIBLE = 660;
  const BEST_KEY = 'auto-rally-best-v1';
  const SCORES_KEY = 'auto-rally-scores-v1';
  const held = { left: false, right: false };
  const state = {
    mode: 'intro', progress: 0, lap: 0, elapsed: 0, playerX: 0, speed: 118, coins: 0,
    chai: 3, boost: 0, stun: 0, wobble: 0, shake: 0, lives: 3, invulnerability: 0, best: readBest(), scores: readScores(), muted: false,
    phase: 0, countdown: 0, lastTime: 0, objects: [], scenery: [], opponents: [], hit: new Map(), collected: new Set(),
    raf: 0, audio: null, engineOsc: null, engineGain: null, messageTimer: 0, toastTimer: 0,
    particles: [], lastLapBoundary: 0, visualSteer: 0
  };

  function readBest() {
    try { const n = Number(localStorage.getItem(BEST_KEY)); return Number.isFinite(n) && n > 0 ? n : null; }
    catch { return null; }
  }
  function readScores() {
    try {
      const saved = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(s => s && Number.isFinite(s.time) && s.time > 0).slice(0, 20) : [];
    } catch { return []; }
  }
  function addScoreRows(list, entries, emptyText, recent = false) {
    list.replaceChildren();
    if (!entries.length) {
      const li = document.createElement('li'); li.className = 'empty-score'; li.textContent = emptyText; list.append(li); return;
    }
    entries.forEach((entry, index) => {
      const li = document.createElement('li');
      const rank = document.createElement('span'); rank.className = 'score-rank'; rank.textContent = recent ? String(index + 1).padStart(2, '0') : `#${index + 1}`;
      const time = document.createElement('strong'); time.className = 'score-time'; time.textContent = formatTime(entry.time);
      const meta = document.createElement('span'); meta.className = 'score-meta';
      let date = '';
      if (entry.date) { const parsed = new Date(entry.date); if (!Number.isNaN(parsed.getTime())) date = parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
      meta.textContent = `${entry.coins || 0} coins${date ? ` · ${date}` : ''}`;
      li.append(rank, time, meta); list.append(li);
    });
  }
  function renderScores() {
    const scores = state.scores || [];
    addScoreRows(ui.highScores, [...scores].sort((a, b) => a.time - b.time).slice(0, 5), 'Finish a three-lap race to set your first time.');
    addScoreRows(ui.previousScores, scores.slice(0, 5), 'Your recent completed races will show up here.', true);
  }
  function saveScore(time, coins) {
    state.scores.unshift({ time, coins, date: new Date().toISOString() });
    state.scores = state.scores.slice(0, 20);
    try { localStorage.setItem(SCORES_KEY, JSON.stringify(state.scores)); } catch { /* Keep the current run visible if storage is unavailable. */ }
    renderScores();
  }
  function renderStandings(target, finalRace) {
    const playerFinish = finalRace ? state.elapsed : null;
    const entries = [{ name: 'YOU · CHOTU', progress: state.progress, finishTime: playerFinish, isPlayer: true }, ...state.opponents];
    entries.sort((a, b) => {
      if (a.finishTime !== null && b.finishTime !== null) return a.finishTime - b.finishTime;
      if (a.finishTime !== null) return -1;
      if (b.finishTime !== null) return 1;
      return b.progress - a.progress;
    });
    target.replaceChildren();
    entries.forEach((entry, index) => {
      const row = document.createElement('li'); row.className = 'podium-row';
      const medal = document.createElement('span'); medal.className = 'podium-medal'; medal.textContent = ['🏆 1ST', '🥈 2ND', '🥉 3RD'][index];
      const name = document.createElement('span'); name.className = 'podium-name'; name.textContent = entry.name;
      const result = document.createElement('span'); result.className = 'podium-time';
      result.textContent = entry.finishTime !== null ? formatTime(entry.finishTime) : `${Math.min(3, Math.floor(entry.progress / LAP_LENGTH) + 1)}/3 LAPS`;
      row.append(medal, name, result); target.append(row);
    });
  }
  function formatTime(seconds) {
    const centis = Math.floor(Math.max(0, seconds) * 100);
    return `${String(Math.floor(centis / 6000)).padStart(2, '0')}:${String(Math.floor(centis / 100) % 60).padStart(2, '0')}.${String(centis % 100).padStart(2, '0')}`;
  }
  function updateHud() {
    ui.lap.innerHTML = `${Math.min(state.lap + 1, 3)} <i>/ 3</i>`;
    ui.clock.textContent = formatTime(state.elapsed);
    ui.best.textContent = state.best === null ? '--:--.--' : formatTime(state.best);
    ui.coins.textContent = state.coins;
    ui.speedValue.textContent = Math.round((state.speed + (state.boost > 0 ? 42 : 0)) * .49);
    ui.boostBadge.hidden = state.chai <= 0 && state.boost <= 0;
    ui.boostCount.textContent = state.boost > 0 ? `${state.boost.toFixed(1)}s` : state.chai;
    ui.boost.classList.toggle('active', state.boost > 0);
    ui.sound.textContent = state.muted ? '♫̸' : '♫';
    ui.sound.setAttribute('aria-label', state.muted ? 'Turn sound on' : 'Mute sound');
    ui.best.textContent = state.best === null ? '--:--.--' : formatTime(state.best);
    ui.lifeMeter.setAttribute('aria-label', `${state.lives} ${state.lives === 1 ? 'life' : 'lives'} remaining`);
    ui.lifeMeter.querySelectorAll('.pixel-heart').forEach((heart, index) => heart.classList.toggle('broken', index >= state.lives));
  }
  function resize() {
    const r = shell.getBoundingClientRect();
    canvas.width = Math.max(180, Math.floor(r.width / 2));
    canvas.height = Math.max(180, Math.floor(r.height / 2));
    ctx.imageSmoothingEnabled = false;
    draw();
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(resize, 100), { passive: true });

  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function buildLap() {
    const random = rng(4407);
    const items = [];
    for (let i = 0; i < 8; i++) {
      const d = 155 + i * 205;
      items.push({ d, type: 'coin', lane: [-.68, 0, .68][i % 3], id: `coin${i}` });
    }
    items.push({ d: 385, type: 'chai', lane: 0, id: 'chai' });
    items.push({ d: 755, type: 'chai', lane: -.65, id: 'chai2' });
    items.push({ d: 1305, type: 'chai', lane: .65, id: 'chai3' });
    items.push({ d: 545, type: 'pothole', lane: -.64, id: 'hole1' });
    items.push({ d: 1000, type: 'pothole', lane: .64, id: 'hole2' });
    items.push({ d: 1525, type: 'cow', lane: .62, id: 'cow1' });
    items.push({ d: 855, type: 'cow', lane: -.62, id: 'cow2' });
    items.sort((a, b) => a.d - b.d);
    state.objects = items;
    state.scenery = Array.from({ length: 19 }, (_, i) => ({
      d: (i * 97 + 33) % LAP_LENGTH,
      side: i % 2 ? 1 : -1,
      kind: i % 5 === 0 ? 'arch' : i % 4 === 0 ? 'lamp' : 'stall',
      hue: Math.floor(random() * 3)
    }));
  }

  function createOpponents() {
    state.opponents = [
      { name: 'BUNTY', lane: .63, d: 270, progress: 75, baseSpeed: 112, color: '#21bda7', finishTime: null },
      { name: 'PINKY', lane: -.63, d: 840, progress: 145, baseSpeed: 121, color: '#ef6e82', finishTime: null }
    ];
  }
  function updateOpponents(dt) {
    const finishDistance = LAP_LENGTH * 3;
    for (const opponent of state.opponents) {
      if (opponent.finishTime !== null) continue;
      const pace = opponent.baseSpeed + Math.sin(state.elapsed * .72 + opponent.d) * 6;
      opponent.progress = Math.min(finishDistance, opponent.progress + pace * dt);
      if (opponent.progress >= finishDistance) opponent.finishTime = state.elapsed;
    }
  }

  function startAudio() {
    if (state.muted) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!state.audio) {
        state.audio = new AC();
        state.engineOsc = state.audio.createOscillator();
        state.engineOsc.type = 'sawtooth';
        state.engineGain = state.audio.createGain();
        const filter = state.audio.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 210;
        state.engineGain.gain.value = 0;
        state.engineOsc.connect(filter).connect(state.engineGain).connect(state.audio.destination);
        state.engineOsc.start();
      }
      if (state.audio.state === 'suspended') state.audio.resume();
      state.engineGain.gain.setTargetAtTime(state.mode === 'racing' ? .018 : 0, state.audio.currentTime, .08);
    } catch { /* Sound is decorative; the race still works if the browser blocks audio. */ }
  }
  function beep(freq = 560, duration = .11, wave = 'square', volume = .055) {
    if (state.muted || !state.audio) return;
    try {
      const o = state.audio.createOscillator(), g = state.audio.createGain();
      o.type = wave; o.frequency.setValueAtTime(freq, state.audio.currentTime);
      g.gain.setValueAtTime(volume, state.audio.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, state.audio.currentTime + duration);
      o.connect(g).connect(state.audio.destination); o.start(); o.stop(state.audio.currentTime + duration);
    } catch { /* Ignore short-lived audio errors. */ }
  }
  function setMute() {
    state.muted = !state.muted;
    if (state.engineGain && state.audio) state.engineGain.gain.setTargetAtTime(!state.muted && state.mode === 'racing' ? .018 : 0, state.audio.currentTime, .05);
    if (!state.muted) startAudio();
    updateHud();
  }

  function showMessage(text, color) {
    ui.message.textContent = text;
    ui.message.style.borderColor = color || '#ffc359';
    ui.message.style.color = color || '#ffe6a4';
    ui.message.classList.add('show');
    clearTimeout(state.messageTimer);
    state.messageTimer = setTimeout(() => ui.message.classList.remove('show'), 1350);
  }
  function toast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1200);
  }
  function setupRace() {
    state.mode = 'countdown'; state.progress = 0; state.lap = 0; state.elapsed = 0;
    state.playerX = 0; state.speed = 118; state.coins = 0; state.chai = 3;
    state.boost = 0; state.stun = 0; state.wobble = 0; state.shake = 0; state.visualSteer = 0; state.lives = 3; state.invulnerability = 0;
    state.phase = 0; state.countdown = 3.6; state.hit.clear(); state.collected.clear(); state.particles.length = 0;
    state.lastLapBoundary = 0;
    ui.message.classList.remove('show');ui.toast.classList.remove('show');
    buildLap(); createOpponents();
    ui.intro.hidden = true; ui.pause.hidden = true; ui.finish.hidden = true; ui.gameOver.hidden = true;
    ui.hud.hidden = false; ui.controls.hidden = false; ui.speed.hidden = false;
    ui.lifeMeter.hidden = false;
    updateHud(); startAudio();
    cancelAnimationFrame(state.raf); state.lastTime = performance.now();
    state.raf = requestAnimationFrame(frame);
  }
  function pauseRace() {
    if (state.mode !== 'racing' && state.mode !== 'countdown') return;
    state.mode = 'paused'; held.left = held.right = false;
    ui.pause.hidden = false; ui.controls.hidden = true; ui.lifeMeter.hidden = true;
    if (state.engineGain && state.audio) state.engineGain.gain.setTargetAtTime(0, state.audio.currentTime, .04);
  }
  function goHome() {
    state.mode = 'intro'; held.left = held.right = false;
    ui.intro.hidden = false; ui.pause.hidden = true; ui.finish.hidden = true; ui.gameOver.hidden = true; ui.scoreScreen.hidden = true;
    ui.hud.hidden = true; ui.controls.hidden = true; ui.speed.hidden = true; ui.lifeMeter.hidden = true;
    ui.message.classList.remove('show'); ui.toast.classList.remove('show');
    ui.introBest.textContent = state.best === null ? 'NO TIME YET' : formatTime(state.best);
    if (state.engineGain && state.audio) state.engineGain.gain.setTargetAtTime(0, state.audio.currentTime, .05);
  }
  function resumeRace() {
    if (state.mode !== 'paused') return;
    ui.pause.hidden = true; ui.controls.hidden = false; ui.lifeMeter.hidden = false;
    state.mode = state.countdown > 0 ? 'countdown' : 'racing';
    startAudio(); state.lastTime = performance.now(); state.raf = requestAnimationFrame(frame);
  }
  function finishRace() {
    state.mode = 'finished'; held.left = held.right = false;
    if (state.engineGain && state.audio) state.engineGain.gain.setTargetAtTime(0, state.audio.currentTime, .08);
    const isBest = state.best === null || state.elapsed < state.best;
    saveScore(state.elapsed, state.coins);
    if (isBest) {
      state.best = state.elapsed;
      try { localStorage.setItem(BEST_KEY, String(state.best)); } catch { /* Storage may be disabled in private browsing. */ }
    }
    ui.hud.hidden = true; ui.controls.hidden = true; ui.speed.hidden = true;
    ui.finish.hidden = false;
    ui.lifeMeter.hidden = true;
    ui.finishTime.textContent = formatTime(state.elapsed);
    ui.finishTitle.textContent = isBest ? 'New best time!' : 'Arch crossed!';
    ui.finishEyebrow.textContent = isBest ? 'THE BAZAAR WILL HEAR ABOUT THIS' : 'THAT’S THREE LAPS · NICELY DONE';
    ui.finishDetail.textContent = isBest ? `${state.coins} coins picked up. Chotu’s charm is in the mail.` : `${state.coins} coins picked up. The bazaar is still arguing about the cow.`;
    renderStandings(ui.finishStandings,true);
    beep(isBest ? 880 : 660, .24, 'triangle', .065); setTimeout(() => beep(isBest ? 1100 : 780, .28, 'triangle', .06), 160);
  }

  function useBoost() {
    if (state.mode !== 'racing' || state.chai < 1 || state.boost > 0) return;
    state.chai--; state.boost = 2; state.stun = 0;
    showMessage('TURBO CHAI! STEER LIGHTLY', '#ff72b0'); beep(920, .22, 'sawtooth', .045);
    updateHud();
  }
  function colX(y) {
    const { w, h, horizon, phase } = state.view;
    const depth = Math.max(0, (y - horizon) / (h - horizon));
    return w / 2 + Math.sin(phase + depth * 1.6) * w * .10 + Math.sin(phase * .51 + depth * 3) * w * .035;
  }
  function roadHalf(y) {
    const { w, h, horizon } = state.view;
    const depth = Math.max(0, Math.min(1, (y - horizon) / (h - horizon)));
    return w * (.105 + depth * .40);
  }
  function projected(delta) {
    const { h, horizon, playerY } = state.view;
    const q = Math.max(0, Math.min(1, 1 - delta / VISIBLE));
    return { y: horizon + (playerY - horizon) * q * q, q };
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

  function drawCow(x, y, s, tick = 0) {
    const u = s;
    const stride=Math.sin(tick*9)*u*.035;
    rect(x-u*.48,y+u*.42,u*.9,u*.16,'#171822');
    rect(x-u*.45,y-u*.08,u*.88,u*.48,'#fff3d8'); rect(x-u*.25,y-u*.03,u*.3,u*.22,'#956347');
    rect(x+u*.23,y-u*.04,u*.16,u*.2,'#9b7253'); rect(x+u*.42,y+u*.02,u*.15,u*.18,'#f0e2c8');
    rect(x-u*.34,y+u*.33+stride,u*.13,u*.32,'#f2e5ce'); rect(x+u*.18,y+u*.33-stride,u*.13,u*.32,'#f2e5ce');
    rect(x+u*.48,y-u*.13,u*.08,u*.1,'#fff0d2'); rect(x+u*.52,y-u*.05,u*.045,u*.045,'#30252b');
    rect(x+u*.37,y-u*.18,u*.09,u*.08,'#e1cb8a'); rect(x+u*.55,y-u*.18,u*.09,u*.08,'#e1cb8a');
    rect(x+u*.31,y+u*.25,u*.08,u*.07,'#9b7253');
  }
  function drawRickshaw(x, y, width, height, color, player = false) {
    const w = width, h = height, left = x - w / 2, top = y - h;
    const outline = '#252330';
    // The compact silhouette stays legible at the game's deliberately low resolution.
    rect(left+w*.2,top+h*.03,w*.6,h*.43,'#064f3e');
    rect(left+w*.27,top+h*.02,w*.48,h*.07,'#15835e');
    rect(left+w*.17,top+h*.34,w*.54,h*.3,'#ecac27');
    rect(left+w*.12,top+h*.61,w*.74,h*.27,color || '#ffb62e');
    rect(left+w*.12,top+h*.61,w*.74,h*.07,'#ffce4e');
    rect(left+w*.16,top+h*.4,w*.45,h*.17,player?'#ee83bd':'#84b8b2');
    rect(left+w*.14,top+h*.37,w*.49,h*.04,outline);
    rect(left+w*.59,top+h*.08,w*.04,h*.48,outline);
    rect(left+w*.2,top+h*.39,w*.035,h*.14,outline);
    rect(left+w*.26,top+h*.445,w*.11,h*.11,'#fff8e7');
    rect(left+w*.47,top+h*.445,w*.11,h*.11,'#fff8e7');
    rect(left+w*.315,top+h*.475,w*.045,h*.06,outline);
    rect(left+w*.525,top+h*.475,w*.045,h*.06,outline);
    rect(left+w*.33,top+h*.67,w*.32,h*.09,'#20bba5');
    rect(left+w*.3,top+h*.77,w*.37,h*.05,outline);
    const wh = h*.17, ww = w*.2;
    rect(left+w*.16,top+h*.83,ww,wh,outline); rect(left+w*.67,top+h*.83,ww,wh,outline);
    rect(left+w*.2,top+h*.86,ww*.56,wh*.58,'#69717c'); rect(left+w*.71,top+h*.86,ww*.56,wh*.58,'#69717c');
    rect(left+w*.05,top+h*.63,w*.12,h*.06,outline);
    rect(left+w*.07,top+h*.65,w*.08,h*.025,'#fbdfa0');
    if (player) {
      rect(left+w*.83,top+h*.67,w*.07,h*.05,'#ef6457');
      rect(left+w*.27,top+h*.17,w*.035,h*.035,'#ffd359');
    }
  }
  function drawPothole(x, y, s) {
    ctx.fillStyle='#c58b4e';ctx.beginPath();ctx.ellipse(x,y,s*.64,s*.31,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#10131c';ctx.beginPath();ctx.ellipse(x,y-s*.04,s*.52,s*.25,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#a8a0a1';ctx.lineWidth=Math.max(1,s*.055);ctx.beginPath();ctx.ellipse(x,y-s*.04,s*.52,s*.25,0,0,Math.PI*2);ctx.stroke();
    rect(x-s*.25,y-s*.07,s*.19,s*.055,'#252733');
  }

  function rivalLane(o) {
    const sway=Math.sin(state.phase*1.65+o.d*.017)*.28;
    return Math.max(-.91,Math.min(.91,o.lane+sway));
  }
  function drawChai(x, y, s, tick) {
    const u=s;
    rect(x-u*.25,y-u*.25,u*.48,u*.42,'#d86b2d');rect(x-u*.22,y-u*.3,u*.43,u*.08,'#ffbc40');
    rect(x-u*.27,y+u*.14,u*.53,u*.08,'#7d302d');rect(x+u*.18,y-u*.16,u*.2,u*.2,'#f6a43b');
    rect(x+u*.23,y-u*.1,u*.1,u*.1,'#211d24');
    if (Math.sin(tick*8)>-.5) { rect(x-u*.12,y-u*.48,u*.04,u*.18,'#f5ddb0');rect(x+u*.05,y-u*.52,u*.04,u*.2,'#f5ddb0'); }
    rect(x-u*.06,y-u*.12,u*.1,u*.06,'#ffea98');
  }
  function drawCoin(x,y,s) {
    ctx.fillStyle='#a25b1b';ctx.beginPath();ctx.arc(x+1,y+1,s*.34,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffba31';ctx.beginPath();ctx.arc(x,y,s*.34,0,Math.PI*2);ctx.fill();
    rect(x-s*.035,y-s*.17,s*.07,s*.34,'#ffe898');
  }
  function drawStall(x,y,s,kind,hue) {
    const colors=[['#d65088','#ffb238'],['#2bb7a4','#e49d32'],['#5b89c9','#ff665f']][hue];
    if(kind==='lamp'){
      rect(x-s*.025,y-s*1.5,s*.05,s*1.5,'#382a34');rect(x-s*.15,y-s*1.48,s*.3,s*.08,'#ffd66f');rect(x-s*.11,y-s*1.65,s*.22,s*.2,'#ffae32');rect(x-s*.065,y-s*1.6,s*.13,s*.12,'#ffe582');return;
    }
    rect(x-s*.48,y-s*.68,s*.96,s*.7,'#37283a');
    rect(x-s*.58,y-s*.8,s*1.16,s*.18,colors[0]);
    rect(x-s*.54,y-s*.96,s*1.08,s*.16,colors[1]);
    rect(x-s*.36,y-s*.48,s*.23,s*.28,'#ffbd47');rect(x+s*.08,y-s*.5,s*.22,s*.3,'#40bdaa');
  }

  function draw() {
    if (!canvas.width || !canvas.height) return;
    const w=canvas.width,h=canvas.height;
    const portrait=h>w*1.12;
    const horizon=h*(portrait?.30:.32);
    const playerY=h*(portrait?.765:.765);
    state.view={w,h,horizon,playerY,phase:state.progress*.0013 + state.phase*.07};
    const v=state.view;
    ctx.save();
    if(state.shake>0){ctx.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);}
    // Sunset and far city
    const sky=ctx.createLinearGradient(0,0,0,horizon);
    sky.addColorStop(0,'#241b35');sky.addColorStop(.58,'#75445b');sky.addColorStop(1,'#f09a65');ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon+2);
    ctx.fillStyle='#ffcf82';ctx.beginPath();ctx.arc(w*.78,horizon*.71,Math.min(w,h)*.075,0,Math.PI*2);ctx.fill();
    // Market and flyover silhouettes
    const parallax=(state.progress*.026)%w;
    for(let i=-1;i<8;i++){
      const x=i*w/6-parallax*.35;
      const bh=horizon*(.17+((i*17+3)%4)*.035);
      rect(x,horizon-bh,w*.075,bh,'#302435');rect(x+w*.012,horizon-bh*.65,w*.013,bh*.08,'#f6a15a');
      rect(x+w*.041,horizon-bh*.76,w*.012,bh*.09,'#ffb643');
    }
    rect(0,horizon*.84,w,horizon*.13,'#14283a');
    rect(0,horizon*.84,w,h*.012,'#364456');
    // Bazaar flags and strings above the lane
    for(let i=0;i<11;i++){
      const x=(i*w/10 + state.phase*13)%w;
      const yy=horizon*.14 + Math.sin(i*.8)*horizon*.05;
      rect(x,yy,Math.max(1,w*.008),Math.max(1,h*.014),i%3===0?'#ff4f92':i%3===1?'#ffbe42':'#38dbc3');
    }
    // Roadside dirt
    rect(0,horizon,w,h-horizon,'#263b36');
    // Perspective road strips
    const bands=18;
    for(let i=0;i<bands;i++){
      const t0=i/bands,t1=(i+1)/bands;
      const y0=horizon+(h-horizon)*t0,y1=horizon+(h-horizon)*t1;
      const c0=colX(y0),c1=colX(y1),a0=roadHalf(y0),a1=roadHalf(y1);
      const stripe=(Math.floor(state.progress*.009+i)%2)===0;
      ctx.fillStyle=stripe?'#33323a':'#302e36';ctx.beginPath();ctx.moveTo(c0-a0,y0);ctx.lineTo(c0+a0,y0);ctx.lineTo(c1+a1,y1+1);ctx.lineTo(c1-a1,y1+1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ddaa61';ctx.beginPath();ctx.moveTo(c0-a0,y0);ctx.lineTo(c0-a0+w*.006,y0);ctx.lineTo(c1-a1+w*.006,y1+1);ctx.lineTo(c1-a1,y1+1);ctx.fill();
      ctx.beginPath();ctx.moveTo(c0+a0-w*.006,y0);ctx.lineTo(c0+a0,y0);ctx.lineTo(c1+a1,y1+1);ctx.lineTo(c1+a1-w*.006,y1+1);ctx.fill();
      if(Math.sin(state.progress*.012+i*.9)>-.1){
        ctx.fillStyle='#e8d39b';
        for(const lane of [-.34,.34]){
          const mx=(c0+c1)/2 + lane*(a0+a1)/2;
          const mw=Math.max(1,w*.006*t1);
          ctx.fillRect(mx-mw/2,y0+(y1-y0)*.33,mw,Math.max(1,(y1-y0)*.42));
        }
      }
    }
    // Bazaar stalls and lamps scroll toward the player.
    for(const o of state.scenery){
      let delta=o.d-(state.progress%LAP_LENGTH);if(delta<0)delta+=LAP_LENGTH;
      if(delta>VISIBLE)continue;
      const p=projected(delta),y=p.y;
      const roadX=colX(y),half=roadHalf(y),side=o.side;
      const x=roadX+side*(half+w*(.05+p.q*.16));
      const size=Math.max(2,(.8+p.q*9)*Math.min(1,w/240));
      drawStall(x,y,size,o.kind,o.hue);
    }
    // The arch appears down the road near the lap line.
    let toArch=LAP_LENGTH-(state.progress%LAP_LENGTH);
    if(toArch<VISIBLE){
      const p=projected(toArch),y=p.y,half=roadHalf(y),cx=colX(y);
      const aw=half*1.45, ah=(h*.21)*p.q;
      ctx.strokeStyle='#ffaf31';ctx.lineWidth=Math.max(2,3*p.q);ctx.beginPath();ctx.moveTo(cx-aw/2,y);ctx.lineTo(cx-aw/2,y-ah*.72);ctx.quadraticCurveTo(cx-aw/2,y-ah,cx,y-ah);ctx.quadraticCurveTo(cx+aw/2,y-ah,cx+aw/2,y-ah*.72);ctx.lineTo(cx+aw/2,y);ctx.stroke();
      ctx.fillStyle='#ffe391';ctx.font=`bold ${Math.max(5,8*p.q)}px monospace`;ctx.textAlign='center';ctx.fillText('BAZAAR  ·  LAP '+(state.lap+1),cx,y-ah*.68);
    }
    const phase=state.progress%LAP_LENGTH;
    for(const o of state.objects){
      let delta=o.d-phase;if(delta<0)delta+=LAP_LENGTH;
      if(delta>VISIBLE)continue;
      const p=projected(delta), y=p.y;
      const x=colX(y)+o.lane*roadHalf(y)*.81;
      const scale=Math.max(8,(.65+p.q*15)*Math.min(1.25,w/220));
      if(o.type==='coin') drawCoin(x,y-scale*.25,scale*.85);
      else if(o.type==='chai') drawChai(x,y-scale*.1,scale*1.2,state.phase);
      else if(o.type==='pothole') drawPothole(x,y,scale*2.25);
      else if(o.type==='cow') drawCow(x,y,scale*2.0,state.phase);
    }
    for(const opponent of state.opponents){
      const delta=opponent.progress-state.progress;
      if(delta<0||delta>VISIBLE)continue;
      const p=projected(delta),y=p.y,lane=rivalLane(opponent);
      const x=colX(y)+lane*roadHalf(y)*.81;
      const scale=Math.max(8,(.65+p.q*15)*Math.min(1.25,w/220));
      drawRickshaw(x,y+Math.sin(state.phase*11+opponent.d)*scale*.07,scale*2.7,scale*2.6,opponent.color,false);
      rect(x-scale*.7,y+scale*2.55,scale*1.4,Math.max(1,scale*.12),'#ffd366');
      ctx.fillStyle='#fff4d5';ctx.textAlign='center';ctx.font=`bold ${Math.max(6,scale*.75)}px monospace`;
      ctx.fillText(opponent.name,x,y-scale*2.85);
    }
    // Turbo trail
    const center=colX(playerY)+state.playerX*roadHalf(playerY)*.77;
    if(state.boost>0){
      for(let i=0;i<8;i++){
        const yy=playerY+(i*7)+Math.random()*5;
        rect(center-w*.07+(Math.random()-.5)*w*.08,yy,w*.012,w*.022,i%2?'#ff50ad':'#ffb62e');
      }
    }
    // Dust specks on the shoulder
    for(let i=0;i<8;i++){
      const x=((i*137 + Math.floor(state.progress*.9))%Math.max(1,w));
      const y=horizon+((i*43+Math.floor(state.progress*1.8))%(Math.max(1,h-horizon)));
      if(Math.abs(x-colX(y))>roadHalf(y)+3) rect(x,y,Math.max(1,w*.004),Math.max(1,h*.006),'#64816b');
    }
    const carW=Math.max(29,Math.min(w*.18,78)),carH=carW*.86;
    const shakeX=state.wobble>0?Math.sin(state.phase*38)*w*.016:0;
    const bounce=Math.sin(state.phase*12)*h*.002+(state.wobble>0?Math.sin(state.phase*38)*h*.006:0);
    // Lean into the turn, bob over the uneven road, and let the chassis visibly follow steering.
    ctx.save();ctx.translate(center+shakeX,playerY-bounce);ctx.rotate(-state.visualSteer*.16+(state.wobble>0?Math.sin(state.phase*38)*.035:0));
    drawRickshaw(0,0,carW,carH,'#ffb62e',true);ctx.restore();
    // Countdown overlay
    if(state.mode==='countdown'){
      const n=Math.ceil(state.countdown);
      ctx.fillStyle='#1715209c';ctx.fillRect(w*.38,h*.40,w*.24,h*.17);
      ctx.strokeStyle='#ffb62e';ctx.lineWidth=2;ctx.strokeRect(w*.38,h*.40,w*.24,h*.17);
      ctx.fillStyle='#fff3d2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.max(20,Math.min(w*.17,h*.16))}px monospace`;ctx.fillText(n>0?String(n):'GO!',w*.5,h*.485);
    }
    if(state.mode==='racing'){
      // Small lane nudge, kept clear of the touch controls.
      ctx.fillStyle='#fff3d2aa';ctx.font=`${Math.max(6,w*.025)}px monospace`;ctx.textAlign='center';ctx.fillText('←  STEER  →',w*.5,h*.915);
    }
    ctx.restore();
  }

  function collect(o) {
    const lapNo=Math.floor(state.progress/LAP_LENGTH);
    const key=`${lapNo}:${o.id}`;
    if(state.collected.has(key))return;
    if(o.type==='coin'){
      state.collected.add(key);state.coins++;beep(740,.07,'square',.035);toast('+1 BAZAAR COIN');
    } else if(o.type==='chai'){
      state.collected.add(key);state.chai=Math.min(5,state.chai+1);beep(540,.1,'triangle',.04);toast('TURBO CHAI +1');
    } else if(o.type==='pothole'){
      state.hit.set(key,true);takeHeart('POTHOLE!',true);if(state.mode==='gameover')return;
      state.stun=.72;state.wobble=.72;state.shake=2.5;
      showMessage('POTHOLE! HEART -1','#ff8b9e');beep(150,.2,'sawtooth',.07);
    } else if(o.type==='cow'){
      state.hit.set(key,true);
      const lanes=[-.68,0,.68].filter(l=>Math.abs(l-o.lane)>.2);
      lanes.sort((a,b)=>Math.abs(a-state.playerX)-Math.abs(b-state.playerX));
      state.playerX=lanes[0];takeHeart('COW!',true);if(state.mode==='gameover')return;
      state.stun=.45;state.wobble=.42;state.shake=2;showMessage('COW! HEART -1','#ff8b9e');beep(230,.23,'triangle',.065);
    }
    updateHud();
  }

  function takeHeart(reason, force = false) {
    if(!force&&state.invulnerability>0)return;
    state.lives=Math.max(0,state.lives-1);state.invulnerability=1.15;state.shake=3.5;
    updateHud();
    if(state.lives===0){gameOver(reason);return;}
    showMessage(`${reason} · HEART BROKEN`,'#ff7393');
  }

  function gameOver(reason) {
    state.mode='gameover';held.left=held.right=false;
    if(state.engineGain&&state.audio)state.engineGain.gain.setTargetAtTime(0,state.audio.currentTime,.08);
    ui.hud.hidden=true;ui.controls.hidden=true;ui.speed.hidden=true;ui.lifeMeter.hidden=true;
    ui.gameOverBest.textContent=state.best===null?'NO FINISH YET':formatTime(state.best);
    ui.gameOverDetail.textContent=`${reason} You collected ${state.coins} ${state.coins===1?'coin':'coins'} this race.`;
    renderStandings(ui.gameOverStandings,false);ui.gameOver.hidden=false;
    beep(180,.45,'sawtooth',.07);
  }

  function update(dt) {
    state.phase+=dt;
    state.shake=Math.max(0,state.shake-dt*12);
    if(state.mode==='countdown'){
      const old=Math.ceil(state.countdown);state.countdown-=dt;
      const now=Math.ceil(state.countdown);
      if(now<old&&now>0)beep(450+now*70,.12,'square',.05);
      if(state.countdown<=0){state.mode='racing';state.countdown=0;showMessage('GO! FIND YOUR LINE','#7aead9');beep(860,.23,'triangle',.06);}
      return;
    }
    if(state.mode!=='racing')return;
    state.elapsed+=dt;
    state.stun=Math.max(0,state.stun-dt);state.wobble=Math.max(0,state.wobble-dt);
    state.invulnerability=Math.max(0,state.invulnerability-dt);
    state.boost=Math.max(0,state.boost-dt);
    const opponentBefore=state.opponents.map(o=>o.progress);
    updateOpponents(dt);
    const steer=(held.right?1:0)-(held.left?1:0);
    state.visualSteer+=(steer-state.visualSteer)*Math.min(1,dt*9);
    const steerScale=state.boost>0?.61:1;
    state.playerX+=steer*dt*1.55*steerScale;
    if(state.playerX<-.96||state.playerX>.96){
      state.playerX=Math.max(-.96,Math.min(.96,state.playerX));
      state.speed=Math.max(75,state.speed-45*dt);
    }else state.speed+= (118-state.speed)*Math.min(1,dt*.7);
    const speedFactor=state.stun>0?.52:1;
    const boostFactor=state.boost>0?1.55:1;
    const travelled=state.speed*speedFactor*boostFactor*dt;
    const before=state.progress;
    state.progress+=travelled;
    for(const o of state.objects){
      const phaseBefore=before%LAP_LENGTH;
      let delta=o.d-phaseBefore;if(delta<0)delta+=LAP_LENGTH;
      if(delta<=travelled+9&&Math.abs(state.playerX-o.lane)<(o.type==='pothole'?.25:.27)){
        const lapNo=Math.floor((before+delta)/LAP_LENGTH);
        const key=`${lapNo}:${o.id}`;
        if(!state.hit.has(key)&&!state.collected.has(key))collect(o);
      }
      if(state.mode==='gameover')return;
    }
    for(let i=0;i<state.opponents.length;i++){
      const opponent=state.opponents[i];if(opponent.finishTime!==null)continue;
      const gapBefore=opponentBefore[i]-before,gapAfter=opponent.progress-state.progress;
      if(Math.min(Math.abs(gapBefore),Math.abs(gapAfter))<18&&Math.abs(rivalLane(opponent)-state.playerX)<.4){
        takeHeart('RIVAL AUTO!');
        state.stun=Math.max(state.stun,.34);state.wobble=.36;state.shake=3;
        opponent.progress=state.progress+(gapAfter>=0?48:-48);
        if(state.mode==='gameover')return;
      }
    }
    const oldLap=Math.floor(before/LAP_LENGTH),newLap=Math.floor(state.progress/LAP_LENGTH);
    if(newLap>oldLap){
      const archCenter=state.playerX;
      if(Math.abs(archCenter)<.79){
        state.lap++;
    if(state.lap>=3){finishRace();return;}
        showMessage(`LAP ${state.lap+1} · KEEP IT ROLLING`,'#ffb62e');beep(690,.16,'triangle',.05);
      }else{
        showMessage('MISSED THE ARCH · AIM FOR THE MIDDLE','#ff789c');beep(260,.18,'square',.05);
      }
    }
    if(state.engineOsc&&state.audio&&!state.muted){
      const hz=57+state.speed*.44+(state.boost>0?34:0);
      state.engineOsc.frequency.setTargetAtTime(hz,state.audio.currentTime,.08);
      state.engineGain.gain.setTargetAtTime(.018+(state.boost>0?.008:0),state.audio.currentTime,.12);
    }
    updateHud();
  }
  function frame(now) {
    if(state.mode==='paused'||state.mode==='finished'||state.mode==='gameover'||state.mode==='intro')return;
    const dt=Math.min(.04,Math.max(0,(now-state.lastTime)/1000));state.lastTime=now;
    update(dt);draw();
    if(state.mode!=='finished')state.raf=requestAnimationFrame(frame);
  }

  function bindHold(button, side) {
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held[side]=true;});
    const release=e=>{if(e) e.preventDefault();held[side]=false;};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
    button.addEventListener('contextmenu',e=>e.preventDefault());
  }
  bindHold(ui.left,'left');bindHold(ui.right,'right');
  ui.boost.addEventListener('pointerdown',e=>{e.preventDefault();useBoost();});
  ui.start.addEventListener('click',setupRace);
  ui.again.addEventListener('click',setupRace);
  ui.pauseButton.addEventListener('click',pauseRace);
  ui.resume.addEventListener('click',resumeRace);
  ui.restart.addEventListener('click',setupRace);
  ui.pauseHome.addEventListener('click',goHome);
  ui.finishHome.addEventListener('click',goHome);
  ui.gameOverAgain.addEventListener('click',setupRace);
  ui.gameOverHome.addEventListener('click',goHome);
  ui.scoresButton.addEventListener('click',()=>{renderScores();ui.scoreScreen.hidden=false;});
  ui.scoresBack.addEventListener('click',()=>{ui.scoreScreen.hidden=true;});
  ui.sound.addEventListener('click',setMute);
  window.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight',' ','a','A','d','D'].includes(e.key))e.preventDefault();
    if(e.repeat&&e.key===' ')return;
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')held.left=true;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')held.right=true;
    if(e.key===' '){ if(state.mode==='intro')setupRace();else useBoost(); }
    if(e.key==='Escape'&& !ui.scoreScreen.hidden){ui.scoreScreen.hidden=true;return;}
    if(e.key==='Escape'&&state.mode==='gameover'){goHome();return;}
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(state.mode==='paused')resumeRace();else pauseRace();}
  });
  window.addEventListener('keyup',e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')held.left=false;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')held.right=false;
  });
  window.addEventListener('blur',()=>{held.left=held.right=false;if(state.mode==='racing'||state.mode==='countdown')pauseRace();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state.mode==='racing'||state.mode==='countdown'))pauseRace();});

  if(state.best!==null)ui.introBest.textContent=formatTime(state.best);
  renderScores();
  buildLap();updateHud();resize();
})();
