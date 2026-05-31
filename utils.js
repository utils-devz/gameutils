(function() {
  const S = document.createElement('style');
  S.textContent = `
    #jx-wrap {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 2147483647;
      background: #0f0f0f; border-top: 2px solid #c8ff00;
      font-family: monospace; display: flex; flex-direction: column;
      max-height: 60vh; box-shadow: 0 -8px 32px #000a;
    }
    #jx-out {
      flex: 1; overflow-y: auto; padding: 8px; font-size: 12px;
      line-height: 1.6; background: #0a0a0a; -webkit-overflow-scrolling: touch;
    }
    .jx-log  { color: #aaa; } .jx-info { color: #44aaff; }
    .jx-warn { color: #ffaa00; } .jx-error { color: #ff4444; }
    .jx-result { color: #c8ff00; } .jx-echo { color: #333; font-size: 11px; }
    #jx-row {
      display: flex; border-top: 1px solid #222; flex-shrink: 0;
    }
    #jx-input {
      flex: 1; background: #111; border: none; outline: none;
      color: #e8e8e8; font-family: monospace; font-size: 13px;
      padding: 10px 12px; caret-color: #c8ff00;
      -webkit-user-select: text; user-select: text;
    }
    #jx-run {
      background: #c8ff00; border: none; color: #000; font-weight: bold;
      font-size: 13px; padding: 0 18px; cursor: pointer; flex-shrink: 0;
    }
    #jx-bar {
      display: flex; gap: 6px; padding: 6px 8px; overflow-x: auto;
      background: #0f0f0f; border-top: 1px solid #1a1a1a;
      scrollbar-width: none;
    }
    #jx-bar::-webkit-scrollbar { display: none; }
    .jx-snip {
      background: #1a1a1a; border: 1px solid #2a2a2a; color: #666;
      font-family: monospace; font-size: 10px; padding: 3px 9px;
      border-radius: 20px; white-space: nowrap; cursor: pointer; flex-shrink: 0;
    }
    #jx-close {
      background: none; border: none; color: #444; font-size: 16px;
      padding: 0 10px; cursor: pointer; flex-shrink: 0;
    }
  `;
  document.head.appendChild(S);

  const wrap = document.createElement('div'); wrap.id = 'jx-wrap';
  wrap.innerHTML = `
    <div id="jx-out"></div>
    <div id="jx-bar">
      <span class="jx-snip" data-c="console.log(navigator.userAgent)">UA</span>
      <span class="jx-snip" data-c="console.log(document.title)">title</span>
      <span class="jx-snip" data-c="console.log(document.querySelectorAll('*').length+' elements')">DOM</span>
      <span class="jx-snip" data-c="console.log(JSON.stringify(performance.timing,null,2))">timing</span>
      <span class="jx-snip" data-c="console.log(document.cookie||'(empty)')">cookies</span>
      <span class="jx-snip" data-c="console.log(localStorage.length+' ls items')">ls</span>
      <span class="jx-snip" data-c="console.log(screen.width+'x'+screen.height+' dpr='+devicePixelRatio)">screen</span>
      <span class="jx-snip" data-c="fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>console.log('IP:',d.ip))">IP</span>
    </div>
    <div id="jx-row">
      <input id="jx-input" placeholder="js here..." autocorrect="off" autocapitalize="off" spellcheck="false"/>
      <button id="jx-run">▶</button>
      <button id="jx-close">✕</button>
    </div>
  `;
  document.body.appendChild(wrap);

  const out = document.getElementById('jx-out');
  const inp = document.getElementById('jx-input');

  function ser(v, d=0) {
    if (d>3) return '…';
    if (v===null) return 'null';
    if (v===undefined) return 'undefined';
    if (typeof v==='function') return '[Function: '+(v.name||'anon')+']';
    if (typeof v==='string') return d===0?v:JSON.stringify(v);
    if (typeof v==='number'||typeof v==='boolean'||typeof v==='symbol') return String(v);
    if (v instanceof Error) return v.constructor.name+': '+v.message;
    if (Array.isArray(v)) { const i=v.slice(0,10).map(x=>ser(x,d+1)); if(v.length>10)i.push('…'); return '['+i.join(', ')+']'; }
    if (typeof v==='object') { try { const k=Object.keys(v).slice(0,6); const p=k.map(x=>x+':'+ser(v[x],d+1)); const e=Object.keys(v).length>6?'…':''; return '{'+[...p,e].filter(Boolean).join(', ')+'}'; } catch(e){return '[Object]';} }
    return String(v);
  }

  function log(cls, prefix, text) {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = prefix + ' ' + text;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }

  const _c = {};
  ['log','info','warn','error'].forEach(m => {
    _c[m] = console[m].bind(console);
    console[m] = (...a) => { _c[m](...a); log('jx-'+m, m.slice(0,3).toUpperCase(), a.map(ser).join(' ')); };
  });

  function run() {
    const code = inp.value.trim(); if (!code) return;
    log('jx-echo', '›', code.length>80?code.slice(0,80)+'…':code);
    try {
      const r = eval(code);
      if (r !== undefined) log('jx-result', '←', ser(r));
    } catch(e) { log('jx-error', 'ERR', e.message); }
  }

  document.getElementById('jx-run').addEventListener('click', run);
  inp.addEventListener('keydown', e => { if(e.key==='Enter'&&(e.ctrlKey||e.metaKey||e.shiftKey)) run(); });
  document.getElementById('jx-close').onclick = () => {
    ['log','info','warn','error'].forEach(m => console[m]=_c[m]);
    wrap.remove(); S.remove();
  };
  document.querySelectorAll('.jx-snip').forEach(b => b.addEventListener('click', () => { inp.value=b.dataset.c; inp.focus(); }));

  log('jx-info', 'INF', 'ready — Enter+Ctrl/Shift to run');
})();
