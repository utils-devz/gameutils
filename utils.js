(function() {
  const S = document.createElement('style');
  S.textContent = `
    #jx-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,0.7); display: flex;
      align-items: center; justify-content: center;
      padding: 16px; box-sizing: border-box;
    }
    #jx {
      background: #0f0f0f; border: 2px solid #c8ff00;
      font-family: monospace; display: flex; flex-direction: column;
      width: 100%; max-width: 480px;
      max-height: 80vh; border-radius: 10px;
      overflow: hidden; box-shadow: 0 0 40px #c8ff0033;
    }
    #jx-out {
      flex: 1; overflow-y: scroll; padding: 8px 10px; font-size: 13px;
      line-height: 1.7; background: #0a0a0a; min-height: 120px;
      -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    }
    .jxl{color:#aaa;}.jxi{color:#44aaff;}
    .jxw{color:#ffaa00;}.jxe{color:#ff4444;}
    .jxr{color:#c8ff00;}.jxecho{color:#2a2a2a;font-size:11px;}
    #jx-snips {
      display: flex; gap: 8px; padding: 8px 10px; overflow-x: scroll;
      background: #111; border-top: 1px solid #1c1c1c;
      -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    #jx-snips::-webkit-scrollbar{display:none;}
    .jxs {
      background: #1a1a1a; border: 1px solid #2c2c2c; color: #777;
      font-family: monospace; font-size: 11px;
      padding: 6px 14px; border-radius: 99px;
      white-space: nowrap; flex-shrink: 0;
      min-height: 32px; display: flex; align-items: center;
    }
    #jx-row {
      display: flex; border-top: 1px solid #1c1c1c;
      flex-shrink: 0; min-height: 52px;
    }
    #jx-inp {
      flex: 1; background: #111; border: none; outline: none;
      color: #e8e8e8; font-family: monospace; font-size: 15px;
      padding: 14px 12px; caret-color: #c8ff00; resize: none;
      -webkit-user-select: text; user-select: text;
      -webkit-appearance: none; line-height: 1.5;
      min-height: 52px; max-height: 120px;
      overflow-y: auto; -webkit-overflow-scrolling: touch;
    }
    #jx-btns{display:flex;flex-direction:column;flex-shrink:0;}
    #jx-run {
      flex: 1; background: #c8ff00; border: none; color: #000;
      font-size: 20px; width: 56px; cursor: pointer;
    }
    #jx-x {
      background: #1a1a1a; border: none; color: #555;
      font-size: 14px; width: 56px; height: 28px; cursor: pointer;
      border-top: 1px solid #111;
    }
  `;
  document.head.appendChild(S);

  const overlay = document.createElement('div'); overlay.id = 'jx-overlay';
  overlay.innerHTML = `
    <div id="jx">
      <div id="jx-out"></div>
      <div id="jx-snips">
        <span class="jxs" data-c="console.log(navigator.userAgent)">UA</span>
        <span class="jxs" data-c="console.log(document.querySelectorAll('*').length+' nodes')">DOM</span>
        <span class="jxs" data-c="console.log(document.cookie||'(empty)')">cookies</span>
        <span class="jxs" data-c="console.log(localStorage.length+' ls items')">ls</span>
        <span class="jxs" data-c="console.log(screen.width+'x'+screen.height+' dpr='+devicePixelRatio)">screen</span>
        <span class="jxs" data-c="console.log(window.location.href)">url</span>
        <span class="jxs" data-c="fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>console.log('IP:',d.ip))">IP</span>
        <span class="jxs" data-c="console.log(performance.now().toFixed(1)+'ms uptime')">perf</span>
      </div>
      <div id="jx-row">
        <textarea id="jx-inp" placeholder="// js here..." autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" rows="1"></textarea>
        <div id="jx-btns">
          <button id="jx-run">▶</button>
          <button id="jx-x">✕</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // tap outside to close
  overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });

  const out = document.getElementById('jx-out');
  const inp = document.getElementById('jx-inp');

  out.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });

  inp.addEventListener('input', () => {
    inp.style.height = 'auto';
    inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
  });

  function ser(v, d) {
    d = d||0;
    if (d>3) return '…';
    if (v===null) return 'null';
    if (v===undefined) return 'undefined';
    if (typeof v==='function') return '[fn:'+(v.name||'?')+']';
    if (typeof v==='string') return d===0 ? v : JSON.stringify(v);
    if (typeof v==='number'||typeof v==='boolean') return String(v);
    if (v instanceof Error) return v.constructor.name+': '+v.message;
    if (Array.isArray(v)) {
      var i=v.slice(0,8).map(function(x){return ser(x,d+1)});
      if(v.length>8)i.push('…+'+(v.length-8));
      return '['+i.join(', ')+']';
    }
    if (typeof v==='object') {
      try {
        var k=Object.keys(v).slice(0,5);
        var p=k.map(function(x){return x+':'+ser(v[x],d+1)});
        if(Object.keys(v).length>5)p.push('…');
        return '{'+p.join(', ')+'}';
      } catch(e){return '[Object]';}
    }
    return String(v);
  }

  function addLine(cls, pre, txt) {
    var d=document.createElement('div');
    d.className=cls; d.textContent=pre+' '+txt;
    out.appendChild(d); out.scrollTop=out.scrollHeight;
  }

  var _c={};
  ['log','info','warn','error'].forEach(function(m){
    _c[m]=console[m].bind(console);
    console[m]=function(){
      var a=Array.prototype.slice.call(arguments);
      _c[m].apply(console,a);
      addLine('jx'+m.charAt(0), m.slice(0,3).toUpperCase(), a.map(ser).join(' '));
    };
  });

  function run() {
    var code=inp.value.trim(); if(!code) return;
    addLine('jxecho','›', code.length>60?code.slice(0,60)+'…':code);
    try {
      var r=eval(code);
      if(r!==undefined) addLine('jxr','←',ser(r));
    } catch(e) { addLine('jxe','ERR',e.message); }
  }

  function close() {
    ['log','info','warn','error'].forEach(function(m){ console[m]=_c[m]; });
    overlay.remove(); S.remove();
  }

  document.getElementById('jx-run').addEventListener('click', run);
  document.getElementById('jx-x').addEventListener('click', close);
  document.querySelectorAll('.jxs').forEach(function(b){
    b.addEventListener('click', function(){ inp.value=b.dataset.c; inp.focus(); });
  });

  addLine('jxi','INF','ready');
})();
