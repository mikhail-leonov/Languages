(function(){
  "use strict";

  /* ===================== UI locales (interface language) ===================== */
  /* Each js/lng/*.js registers itself via window.UI_LOCALES.push({...}), so the
     dropdown is built from whatever locale files index.html loads — no list here. */
  var UI_LOCALES = (window.UI_LOCALES && window.UI_LOCALES.length)
    ? window.UI_LOCALES.slice()
    : [{code:"en", label:"English", lang:"english"}];
  var LOCALE = "en";

  function t(key, vars){
    var dict=(window.I18N&&window.I18N[LOCALE])||{};
    var s=dict[key];
    if(s==null){ var en=(window.I18N&&window.I18N.en)||{}; s=en[key]; }
    if(s==null) s=key;
    if(vars){ s=s.replace(/\{(\w+)\}/g,function(m,k){ return (vars[k]!=null)?vars[k]:m; }); }
    return s;
  }
  function detectLocale(){
    var nav=(navigator.language||"en").slice(0,2).toLowerCase();
    return UI_LOCALES.some(function(L){return L.code===nav;}) ? nav : "en";
  }
  function applyStaticI18n(){
    document.documentElement.lang=LOCALE;
    document.querySelectorAll("[data-i18n]").forEach(function(node){
      node.textContent=t(node.getAttribute("data-i18n"));
    });
  }

  /* ===================== language knowledge (phrasebook langs) ===================== */
  var KNOWN = {
    english:{name:"English",native:"English",code:"EN",tint:"--lc-en",bcp:"en-US"},
    russian:{name:"Russian",native:"Русский",code:"RU",tint:"--lc-ru",bcp:"ru-RU"},
    spanish:{name:"Spanish",native:"Español",code:"ES",tint:"--lc-es",bcp:"es-ES"},
    french :{name:"French", native:"Français",code:"FR",tint:"--lc-fr",bcp:"fr-FR"},
    german :{name:"German", native:"Deutsch", code:"DE",tint:"--lc-de",bcp:"de-DE"},
    esperanto: {name:"Esperanto", native:"Esperanto", code:"EO", tint:"--lc-eo", bcp:"eo"}
  };
  // pull in phrasebook-language descriptors contributed by locale files (e.g. pt, it)
  UI_LOCALES.forEach(function(L){ if(L.lang && L.known && !KNOWN[L.lang]) KNOWN[L.lang]=L.known; });
  function langInfo(key){
    var k=String(key).toLowerCase();
    if(KNOWN[k]) return KNOWN[k];
    var nm=key.charAt(0).toUpperCase()+key.slice(1);
    return {name:nm,native:nm,code:key.slice(0,2).toUpperCase(),tint:"--lc-x",bcp:k.slice(0,2)};
  }
  function tint(info){
    var v=(info&&info.tint)||"";
    if(v.indexOf("--")===0){
      return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"#6B7785";
    }
    return v||"#6B7785";
  }

  /* ===================== tiny DOM helpers ===================== */
  var el=function(id){return document.getElementById(id);};
  var main=el("main");
  function esc(s){return String(s).replace(/[&<>"']/g,function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];});}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t2=a[i];a[i]=a[j];a[j]=t2;}return a;}
  function sample(a,n){return shuffle(a).slice(0,n);}
  function randInt(lo,hi){return lo+Math.floor(Math.random()*(hi-lo+1));}

  var SPK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var GRIP_SVG='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  var TICK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  var SHUFFLE_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/></svg>';
  var PICK_SVG2='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8.5 12 2.2 2.2L15.8 9"/></svg>';
  var FILL_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 3v18"/><rect x="11.5" y="11.5" width="6.5" height="6.5" rx="1" fill="currentColor" stroke="none"/></svg>';
  var SPK_INLINE='<span style="vertical-align:middle;display:inline-grid;place-items:center;width:22px;height:22px;border:1px solid var(--line);border-radius:6px;color:var(--ink-2)">'+SPK_SVG+'</span>';

  /* ===================== IndexedDB layer ===================== */
  var DB_NAME="ParallelDB", DB_VER=2, STORE="categories", META="meta", _db=null;
  function openDB(){
    return new Promise(function(res,rej){
      if(_db) return res(_db);
      var rq=indexedDB.open(DB_NAME,DB_VER);
      rq.onupgradeneeded=function(){
        var db=rq.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});
        if(!db.objectStoreNames.contains(META)) db.createObjectStore(META,{keyPath:"k"});
      };
      rq.onsuccess=function(){_db=rq.result;res(_db);};
      rq.onerror=function(){rej(rq.error||new Error("Couldn't open the database."));};
    });
  }
  function store(name,mode){return openDB().then(function(db){return db.transaction(name,mode).objectStore(name);});}
  function dbGetAll(){
    return store(STORE,"readonly").then(function(st){return new Promise(function(res,rej){
      var rq=st.getAll(); rq.onsuccess=function(){res(rq.result||[]);}; rq.onerror=function(){rej(rq.error);};
    });});
  }
  function dbClear(){
    return store(STORE,"readwrite").then(function(st){return new Promise(function(res,rej){
      var rq=st.clear(); rq.onsuccess=function(){res();}; rq.onerror=function(){rej(rq.error);};
    });});
  }

  /* merge helpers: categories are identified by name, phrases by their full content */
  function normName(s){ return String(s==null?"":s).trim().toLowerCase(); }
  function phraseKey(p){
    try{
      return Object.keys(p).sort().map(function(k){ return k+"\u0000"+p[k]; }).join("\u0001");
    }catch(e){ return JSON.stringify(p); }
  }

  /* import = MERGE into the database — it never wipes existing data.
     - a category whose name matches one already stored (case-insensitive) only
       gains its NEW phrases; its existing phrases are kept
     - brand-new categories are appended
     - identical phrases are de-duplicated, so re-importing the same file is a no-op
     To clear everything, use dbClear() (the "Empty the database" button). */
  function dbMerge(categories){
    return dbGetAll().then(function(existing){
      var list=existing.map(function(r){ return {id:r.id, name:r.name, phrases:(r.phrases||[]).slice()}; });
      var byName={};
      list.forEach(function(r){ byName[normName(r.name)]=r; });

      (categories||[]).forEach(function(c){
        if(!c||typeof c!=="object") return;
        var key=normName(c.name);
        var hit=byName[key];
        if(hit){
          var seen={};
          hit.phrases.forEach(function(p){ seen[phraseKey(p)]=1; });
          (c.phrases||[]).forEach(function(p){
            var k=phraseKey(p);
            if(!seen[k]){ seen[k]=1; hit.phrases.push(p); }
          });
        }else{
          var rec={name:c.name, phrases:(c.phrases||[]).slice()};
          list.push(rec); byName[key]=rec;   // also merges duplicate names within one import
        }
      });

      return store(STORE,"readwrite").then(function(st){
        return new Promise(function(res,rej){
          var tr=st.transaction; tr.oncomplete=function(){res();}; tr.onerror=function(){rej(tr.error);};
          list.forEach(function(r){
            if(r.id!=null) st.put({id:r.id, name:r.name, phrases:r.phrases});  // update existing
            else          st.add({name:r.name, phrases:r.phrases});            // append new
          });
        });
      });
    });
  }

  function getMeta(k){
    return store(META,"readonly").then(function(st){return new Promise(function(res){
      var rq=st.get(k); rq.onsuccess=function(){res(rq.result?rq.result.v:null);}; rq.onerror=function(){res(null);};
    });}).catch(function(){return null;});
  }
  function setMeta(k,v){
    return store(META,"readwrite").then(function(st){ st.put({k:k,v:v}); }).catch(function(){});
  }

  /* ===================== JSON normalize (forgiving) ===================== */
  function normalize(obj){
    var cats=obj&&obj.categories;
    if(!Array.isArray(cats)){ if(Array.isArray(obj)) cats=obj; else return null; }
    var out=[];
    cats.forEach(function(c){
      if(!c||typeof c!=="object") return;
      var phrases=c.phrases||c.items||c.entries;
      if(!Array.isArray(phrases)) return;
      var rows=[];
      phrases.forEach(function(p){ if(p&&typeof p==="object"&&!Array.isArray(p)) rows.push(p); });
      out.push({name:c.name||c.title||"Untitled", phrases:rows});
    });
    return out.length?out:null;
  }
  function collectLangs(cats){
    var order=[],seen={};
    cats.forEach(function(c){c.phrases.forEach(function(p){
      Object.keys(p).forEach(function(k){ if(!seen[k]){seen[k]=1;order.push(k);} });
    });});
    var pref=["english","russian","spanish","french","german"];
    return order.slice().sort(function(a,b){
      var ia=pref.indexOf(a.toLowerCase()),ib=pref.indexOf(b.toLowerCase());
      if(ia===-1)ia=99; if(ib===-1)ib=99;
      return ia-ib || order.indexOf(a)-order.indexOf(b);
    });
  }

  /* ===================== app state ===================== */
  var DATA=null, ALL_PHRASES=[], LANGS=[];
  var chosen={}, difficulty="easy", roundActive=false;
  var baseLang=null;
  var gameMode="shuffle";                 // "shuffle" | "pick"
  var DIFF={easy:[2,4], normal:[5,7], supreme:[8,10]};          // shuffle: rows to align
  var PICK={easy:{opts:3,rounds:6}, normal:{opts:5,rounds:8}, supreme:{opts:8,rounds:10}}; // pick: choices & questions
  var FILL={easy:{rows:[2,3],opts:3}, normal:{rows:[3,4],opts:5}, supreme:{rows:[4,6],opts:8}}; // fill: board rows & cards per blank

  /* interface locale <-> phrasebook language key, built from the locale registry */
  var LOCALE_LANG={};
  UI_LOCALES.forEach(function(L){ if(L.lang) LOCALE_LANG[L.code]=L.lang; });
  function langKeyForLocale(loc){ return LOCALE_LANG[loc]||null; }

  // pick a sensible base language: keep current if still selected,
  // otherwise prefer the one matching the interface language, else the first selected
  function ensureBase(){
    var sel=LANGS.filter(function(k){return chosen[k];});
    if(baseLang && chosen[baseLang]) return;
    var pref=langKeyForLocale(LOCALE);
    baseLang = (pref && chosen[pref]) ? pref : (sel.length?sel[0]:null);
  }

  /* ===================== pronunciation ===================== */
  function speak(text,bcp){
    if(!text) return;
    try{
      if(!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(text);
      u.lang=bcp||"en-US"; u.rate=.92;
      var vs=window.speechSynthesis.getVoices();
      var v=vs.filter(function(x){return x.lang && x.lang.toLowerCase().indexOf((bcp||"").slice(0,2).toLowerCase())===0;})[0];
      if(v) u.voice=v;
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
  if("speechSynthesis" in window){ window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged=function(){window.speechSynthesis.getVoices();}; }

  /* ===================== UI language switcher ===================== */
  function buildLangMenu(){
    var menu=el("uiLangMenu"); if(!menu) return;
    menu.innerHTML="";
    UI_LOCALES.forEach(function(L){
      var li=document.createElement("li");
      li.innerHTML='<button type="button" class="dropdown-item'+(L.code===LOCALE?' active':'')+'" data-loc="'+L.code+'">'+L.label+'</button>';
      li.querySelector("button").addEventListener("click",function(){ setLocale(L.code); });
      menu.appendChild(li);
    });
    var cur=UI_LOCALES.filter(function(L){return L.code===LOCALE;})[0]||UI_LOCALES[0];
    el("uiLangLabel").textContent=cur.label;
    var btn=el("uiLangBtn"); if(btn) btn.setAttribute("aria-label",t("ui_lang_label"));
  }
  function setLocale(code){
    LOCALE=code; setMeta("locale",code);
    // make the matching phrasebook language selected and the key column (when it exists in the data)
    var lang=langKeyForLocale(code);
    if(DATA && lang && LANGS.indexOf(lang)!==-1){
      chosen[lang]=true;
      baseLang=lang;
    }
    applyStaticI18n(); buildLangMenu();
    paintPill(); paintDbStatus();
    if(!DATA) renderEmpty();
    else if(roundActive) renderActiveBoard();
    else renderSetup();
  }

  // route a mid-round locale change to whichever game is on screen
  function renderActiveBoard(){ if(gameMode==="pick") renderPickBoard(); else if(gameMode==="fill") renderFillBoard(); else renderBoard(); }

  /* ===================== DB UI ===================== */
  var dbCanvas=new bootstrap.Offcanvas(el("dbCanvas"));
  el("dataBtn").addEventListener("click",function(){dbCanvas.show();});
  el("importBtn").addEventListener("click",function(){el("fileInput").click();});
  el("fileInput").addEventListener("change",function(e){
    var f=e.target.files&&e.target.files[0]; if(f) readFile(f); e.target.value="";
  });
  el("exampleBtn").addEventListener("click",function(){
    dbMerge(EXAMPLE).then(function(){dbMsg(t("msg_example_stored"),"good");return refresh();})
      .catch(function(err){dbMsg(t("msg_example_fail",{err:err.message}),"bad");});
  });
  el("exportBtn").addEventListener("click",exportJSON);
  el("clearBtn").addEventListener("click",function(){
    dbClear().then(function(){dbMsg(t("msg_emptied"),"good");return refresh();});
  });

  function readFile(file){
    var fr=new FileReader();
    fr.onload=function(){
      var parsed;
      try{ parsed=JSON.parse(fr.result); }
      catch(err){ dbMsg(t("msg_not_json",{err:err.message}),"bad"); return; }
      var cats=normalize(parsed);
      if(!cats){ dbMsg(t("msg_no_categories"),"bad"); return; }
      dbMerge(cats).then(function(){
        dbMsg(t("msg_imported",{n:cats.length,name:file.name}),"good");
        return refresh();
      }).catch(function(err){ dbMsg(t("msg_import_fail",{err:err.message}),"bad"); });
    };
    fr.onerror=function(){ dbMsg(t("msg_read_fail"),"bad"); };
    fr.readAsText(file);
  }

  function exportJSON(){
    // export = the WHOLE database, every stored category and phrase
    dbGetAll().then(function(rows){
      if(!rows.length){ dbMsg(t("msg_nothing_export"),"bad"); return; }
      var payload={categories:rows.map(function(r){return {name:r.name,phrases:r.phrases};})};
      var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      var url=URL.createObjectURL(blob);
      var a=document.createElement("a");
      a.href=url; a.download="phrasebook-export.json"; document.body.appendChild(a); a.click();
      a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1000);
      dbMsg(t("msg_exported",{n:rows.length}),"good");
    });
  }

  function dbMsg(text,kind){
    var m=el("dbMsg"); if(!m) return;
    m.textContent=text;
    m.style.color = kind==="bad"?"var(--bad)" : kind==="good"?"var(--good)" : "var(--ink-2)";
  }

  /* ===================== load DB -> state, paint chrome ===================== */
  function refresh(){
    return dbGetAll().then(function(rows){
      DATA = rows.length ? rows.map(function(r){return {name:r.name,phrases:r.phrases};}) : null;
      ALL_PHRASES=[]; LANGS=[];
      if(DATA){
        DATA.forEach(function(c){c.phrases.forEach(function(p){ALL_PHRASES.push(p);});});
        LANGS=collectLangs(DATA);
        chosen={}; LANGS.slice(0,Math.min(3,LANGS.length)).forEach(function(k){chosen[k]=true;});
        var loc=langKeyForLocale(LOCALE);
        if(loc && LANGS.indexOf(loc)!==-1) chosen[loc]=true;   // interface language always selected
        baseLang=null; ensureBase();                            // ...and becomes the key column
      }
      paintPill(); paintDbStatus();
      roundActive=false;
      if(DATA) renderSetup(); else renderEmpty();
    });
  }

  function paintPill(){
    var pill=el("dbPill");
    if(!DATA){ pill.className="dbpill empty"; pill.textContent=t("pill_empty"); return; }
    pill.className="dbpill";
    pill.innerHTML=t("pill_summary",{cats:DATA.length,phrases:ALL_PHRASES.length,langs:LANGS.length});
  }
  function paintDbStatus(){
    var s=el("dbStatus"); if(!s) return;
    if(!DATA){ s.innerHTML='<span class="muted">'+t("db_empty")+'</span>'; return; }
    var chips=LANGS.map(function(k){var i=langInfo(k);return '<span class="code" style="background:'+tint(i)+'">'+i.code+'</span>';}).join(" ");
    s.innerHTML='<div class="mb-2">'+t("db_summary",{cats:DATA.length,phrases:ALL_PHRASES.length})+'</div>'+
      '<div class="d-flex flex-wrap gap-1 align-items-center">'+chips+'</div>';
  }

  /* ===================== EMPTY screen ===================== */
  function renderEmpty(){
    main.innerHTML=
      '<div class="empty-state leaf p-5">'+
        '<div class="glyph">🗝️</div>'+
        '<h2 class="mt-2">'+t("empty_title")+'</h2>'+
        '<p class="muted mb-4">'+t("empty_body")+'</p>'+
        '<div class="d-flex gap-2 justify-content-center flex-wrap">'+
          '<button class="btn btn-ink" id="e_import">'+t("empty_import")+'</button>'+
          '<button class="btn btn-parch" id="e_example">'+t("empty_example")+'</button>'+
        '</div>'+
      '</div>';
    el("e_import").addEventListener("click",function(){el("fileInput").click();});
    el("e_example").addEventListener("click",function(){ dbMerge(EXAMPLE).then(refresh); });
  }

  /* ===================== SETUP screen ===================== */
  function renderSetup(){
    function modeCard(key){
      var on=gameMode===key;
      var icon = key==="shuffle"?SHUFFLE_SVG : key==="pick"?PICK_SVG2 : FILL_SVG;
      return '<button class="mode '+key+(on?' on':'')+'" data-m="'+key+'">'+
        '<span class="mode-ic">'+icon+'</span>'+
        '<span class="mode-tx"><span class="mt">'+t("mode_"+key)+'</span>'+
          '<span class="md">'+t("mode_"+key+"_desc")+'</span></span>'+
      '</button>';
    }

    var langCards=LANGS.map(function(k){
      var i=langInfo(k), c=tint(i), on=!!chosen[k];
      return '<div class="lang-pick'+(on?' on':'')+'" data-k="'+k+'">'+
        '<span class="tick">'+TICK_SVG+'</span>'+
        '<span class="code" style="background:'+c+'">'+i.code+'</span>'+
        '<span class="meta"><span class="nat">'+esc(i.native)+'</span>'+
          '<span class="en">'+esc(i.name)+'</span></span>'+
      '</div>';
    }).join("");

    function diffCard(key,roman){
      var sub = (gameMode==="pick")
        ? t("pick_diff_opts",{n:PICK[key].opts})
        : (gameMode==="fill")
          ? t("fill_diff_opts",{n:FILL[key].opts})
          : t("diff_lines",{lo:DIFF[key][0],hi:DIFF[key][1]});
      return '<button class="diff '+key+(difficulty===key?' on':'')+'" data-d="'+key+'">'+
        '<div class="seal">'+roman+'</div>'+
        '<h3>'+t("diff_"+key)+'</h3>'+
        '<div class="rng">'+sub+'</div>'+
      '</button>';
    }

    main.innerHTML=
      '<div class="setup-pair mb-4">'+
        '<div class="leaf">'+
          '<div class="leaf-head"><h2>'+t("choose_game")+'</h2></div>'+
          '<div class="leaf-body">'+
            '<div class="mode-grid" id="modeGrid">'+modeCard("shuffle")+modeCard("pick")+modeCard("fill")+'</div>'+
          '</div>'+
        '</div>'+
        '<div class="leaf">'+
          '<div class="leaf-head"><h2>'+t("setup_diff_title")+'</h2></div>'+
          '<div class="leaf-body">'+
            '<div class="diff-grid" id="diffGrid">'+
              diffCard("easy","I")+diffCard("normal","II")+diffCard("supreme","III")+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+

      '<div class="leaf mb-4">'+
        '<div class="leaf-head"><span class="eyebrow">'+t("step_one")+'</span><h2>'+t("setup_lang_title")+'</h2></div>'+
        '<div class="leaf-body">'+
          '<p class="hintline mb-3">'+t("setup_lang_hint")+'</p>'+
          '<div class="lang-grid" id="langGrid">'+langCards+'</div>'+
        '</div>'+
      '</div>'+

      '<div class="leaf mb-4">'+
        '<div class="leaf-head"><span class="eyebrow">'+t("step_two")+'</span><h2>'+t("setup_base_title")+'</h2></div>'+
        '<div class="leaf-body">'+
          '<p class="hintline mb-3">'+t("setup_base_hint")+'</p>'+
          '<div class="base-chips" id="baseChips"></div>'+
        '</div>'+
      '</div>'+

      '<div class="d-flex align-items-center gap-3 flex-wrap">'+
        '<button class="btn btn-quill btn-lg px-4" id="startBtn">'+t("begin")+'</button>'+
        '<span class="muted small" id="setupWarn"></span>'+
      '</div>';

    Array.prototype.forEach.call(el("modeGrid").children,function(node){
      node.addEventListener("click",function(){
        gameMode=node.getAttribute("data-m");
        renderSetup(); // re-render so difficulty subtitles + active states update
      });
    });
    Array.prototype.forEach.call(el("langGrid").children,function(node){
      node.addEventListener("click",function(){
        var k=node.getAttribute("data-k");
        chosen[k]=!chosen[k];
        node.classList.toggle("on",!!chosen[k]);
        ensureBase(); renderBasePicker();
      });
    });
    renderBasePicker();
    Array.prototype.forEach.call(el("diffGrid").children,function(node){
      node.addEventListener("click",function(){
        difficulty=node.getAttribute("data-d");
        Array.prototype.forEach.call(el("diffGrid").children,function(n){n.classList.toggle("on",n===node);});
      });
    });
    el("startBtn").addEventListener("click",beginRound);
  }

  function renderBasePicker(){
    var wrap=el("baseChips"); if(!wrap) return;
    var sel=LANGS.filter(function(k){return chosen[k];});
    if(!baseLang||!chosen[baseLang]) ensureBase();
    wrap.innerHTML="";
    if(sel.length===0){ wrap.innerHTML='<span class="muted small">'+t("base_none")+'</span>'; return; }
    sel.forEach(function(k){
      var i=langInfo(k), c=tint(i);
      var b=document.createElement("button");
      b.type="button";
      b.className="base-chip"+(k===baseLang?" on":"");
      b.setAttribute("data-k",k);
      b.innerHTML='<span class="code" style="background:'+c+'">'+i.code+'</span>'+
        '<span class="bn">'+esc(i.native)+' <small>'+esc(i.name)+'</small></span>';
      b.addEventListener("click",function(){ baseLang=k; renderBasePicker(); });
      wrap.appendChild(b);
    });
  }

  // Begin button dispatches to the chosen game
  function beginRound(){
    if(gameMode==="pick") startPick();
    else if(gameMode==="fill") startFill();
    else startRound();
  }

  /* ===================== SHUFFLE round ===================== */
  var round=null;
  var selCell=null, dragCell=null;

  function startRound(){
    var langs=LANGS.filter(function(k){return chosen[k];});
    if(langs.length<2){ if(el("setupWarn")) el("setupWarn").textContent=t("warn_two_langs"); return; }

    ensureBase();
    var anchor=(baseLang && chosen[baseLang]) ? baseLang : langs[0];
    // key (base) column leads, the rest follow in their natural order
    langs=[anchor].concat(langs.filter(function(k){return k!==anchor;}));

    var rng=DIFF[difficulty];
    var n=randInt(rng[0],rng[1]);

    var full=ALL_PHRASES.filter(function(p){
      return langs.every(function(k){return p[k]!=null && String(p[k]).trim()!=="";});
    });
    var pool=full.length>=n ? full : ALL_PHRASES.slice();
    n=Math.min(n,pool.length);
    if(n<2){ if(el("setupWarn")) el("setupWarn").textContent=t("warn_not_enough"); return; }

    var items=sample(pool,n);

    var order={};
    langs.forEach(function(k){
      if(k===anchor){ order[k]=items.map(function(_,i){return i;}); return; }
      var ids=items.map(function(_,i){return i;});
      var sh=shuffle(ids);
      if(n>1 && sh.every(function(v,i){return v===i;})){ var t2=sh[0]; sh[0]=sh[1]; sh[1]=t2; }
      order[k]=sh;
    });

    gameMode="shuffle";
    round={langs:langs, anchor:anchor, items:items, n:n, order:order};
    roundActive=true; selCell=null; dragCell=null;
    renderBoard();
  }

  function renderBoard(){
    var langs=round.langs, anchor=round.anchor, items=round.items, n=round.n;
    var tmpl="38px "+langs.map(function(){return "minmax(0,1fr)";}).join(" ");

    var html=
      '<div class="board-head">'+
        '<div><span class="eyebrow d-block mb-1">'+t("board_eyebrow",{diff:t("diff_"+difficulty),n:n})+'</span>'+
          '<h2 class="serif m-0" style="font-size:24px;">'+t("board_title")+'</h2></div>'+
        '<div class="d-flex gap-2 flex-wrap">'+
          '<button class="btn btn-parch" id="reshuffleBtn">'+t("reshuffle")+'</button>'+
          '<button class="btn btn-parch" id="backBtn">'+t("change_setup")+'</button>'+
          '<button class="btn btn-quill" id="checkBtn">'+t("check")+'</button>'+
        '</div>'+
      '</div>'+
      '<p class="hintline">'+t("board_hint",{lang:esc(langInfo(anchor).native), spk:SPK_INLINE})+'</p>'+
      '<div id="wonSlot"></div>'+
      '<div class="scoreline mb-2" id="scoreLine"></div>'+
      '<div class="board" id="board" style="grid-template-columns:'+tmpl+';">';

    html+='<div></div>';
    langs.forEach(function(k){
      var i=langInfo(k),c=tint(i);
      html+='<div class="col-head"><span class="code" style="background:'+c+'">'+i.code+'</span>'+
        '<span class="nm">'+esc(i.native)+(i.native!==i.name?' <small>'+esc(i.name)+'</small>':'')+
        (k===anchor?' <small style="color:var(--accent)">· '+t("col_key")+'</small>':'')+'</span></div>';
    });

    for(var r=0;r<n;r++){
      html+='<div class="rownum">'+(r+1)+'</div>';
      langs.forEach(function(k){
        var info=langInfo(k);
        var id=round.order[k][r];
        var val=items[id][k];
        var has=val!=null && String(val).trim()!=="";
        var txt=has?esc(String(val)):t("not_given");
        if(k===anchor){
          html+='<div class="tile anchor" data-bcp="'+info.bcp+'" data-text="'+(has?esc(String(val)):'')+'">'+
            '<span class="txt'+(has?'':' empty')+'">'+txt+'</span>'+
            '<button class="spk" data-spk title="'+t("pronounce")+'">'+SPK_SVG+'</button></div>';
        }else{
          html+='<div class="tile move" data-lang="'+k+'" data-row="'+r+'" data-id="'+id+'" data-bcp="'+info.bcp+'" data-text="'+(has?esc(String(val)):'')+'" draggable="true">'+
            '<span class="grip">'+GRIP_SVG+'</span>'+
            '<span class="txt'+(has?'':' empty')+'">'+txt+'</span>'+
            '<button class="spk" data-spk title="'+t("pronounce")+'">'+SPK_SVG+'</button>'+
            '<span class="badge"></span></div>';
        }
      });
    }
    html+='</div>';
    main.innerHTML=html;

    el("checkBtn").addEventListener("click",checkAlign);
    el("reshuffleBtn").addEventListener("click",reScramble);
    el("backBtn").addEventListener("click",function(){ roundActive=false; renderSetup(); });

    wireBoard();
    updateScore();
  }

  function reScramble(){
    round.langs.forEach(function(k){
      if(k===round.anchor) return;
      var ids=round.items.map(function(_,i){return i;});
      var sh=shuffle(ids);
      if(round.n>1 && sh.every(function(v,i){return v===i;})){ var t2=sh[0];sh[0]=sh[1];sh[1]=t2; }
      round.order[k]=sh;
    });
    selCell=null; renderBoard();
  }

  /* ----- board interactions: swap within a column ----- */
  function wireBoard(){
    var board=el("board");
    board.querySelectorAll("[data-spk]").forEach(function(btn){
      btn.addEventListener("click",function(e){
        e.stopPropagation();
        var tile=btn.closest(".tile");
        speak(tile.getAttribute("data-text"), tile.getAttribute("data-bcp"));
      });
    });
    board.querySelectorAll(".tile.move").forEach(function(tile){
      tile.addEventListener("click",function(e){
        if(e.target.closest("[data-spk]")) return;
        onPick(tile);
      });
      tile.addEventListener("dragstart",function(e){
        dragCell=tile; tile.classList.add("dragging");
        try{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain","x");}catch(_){}
      });
      tile.addEventListener("dragend",function(){ tile.classList.remove("dragging"); dragCell=null; });
      tile.addEventListener("dragover",function(e){
        if(dragCell && dragCell!==tile && dragCell.getAttribute("data-lang")===tile.getAttribute("data-lang")) e.preventDefault();
      });
      tile.addEventListener("drop",function(e){
        e.preventDefault();
        if(dragCell && dragCell!==tile && dragCell.getAttribute("data-lang")===tile.getAttribute("data-lang")) swapTiles(dragCell,tile);
      });
    });
  }

  function onPick(tile){
    if(selCell===tile){ tile.classList.remove("sel"); selCell=null; return; }
    if(selCell && selCell.getAttribute("data-lang")===tile.getAttribute("data-lang")){
      swapTiles(selCell,tile); selCell.classList.remove("sel"); selCell=null; return;
    }
    if(selCell) selCell.classList.remove("sel");
    selCell=tile; tile.classList.add("sel");
  }

  function swapTiles(a,b){
    ["data-id","data-text","data-bcp"].forEach(function(attr){
      var av=a.getAttribute(attr), bv=b.getAttribute(attr);
      a.setAttribute(attr,bv); b.setAttribute(attr,av);
    });
    var at=a.querySelector(".txt"), bt=b.querySelector(".txt");
    var tmpHtml=at.innerHTML, tmpEmpty=at.classList.contains("empty");
    at.innerHTML=bt.innerHTML; at.classList.toggle("empty",bt.classList.contains("empty"));
    bt.innerHTML=tmpHtml; bt.classList.toggle("empty",tmpEmpty);
    syncOrderFromDom();
    clearMarks(); el("wonSlot").innerHTML=""; updateScore();
  }

  function syncOrderFromDom(){
    var board=el("board");
    round.langs.forEach(function(k){
      if(k===round.anchor) return;
      var arr=[];
      board.querySelectorAll('.tile.move[data-lang="'+k+'"]').forEach(function(c){ arr.push(parseInt(c.getAttribute("data-id"),10)); });
      round.order[k]=arr;
    });
  }

  function clearMarks(){
    el("board").querySelectorAll(".tile.move").forEach(function(t2){
      t2.classList.remove("ok","no"); t2.querySelector(".badge").textContent="";
    });
  }

  function correctCount(){
    var total=0, right=0;
    round.langs.forEach(function(k){
      if(k===round.anchor) return;
      round.order[k].forEach(function(id,row){ total++; if(id===row) right++; });
    });
    return {total:total,right:right};
  }

  function updateScore(){
    var sc=correctCount(), line=el("scoreLine"); if(!line) return;
    line.innerHTML=t("score_line",{right:sc.right,total:sc.total});
  }

  function checkAlign(){
    clearMarks();
    var board=el("board");
    round.langs.forEach(function(k){
      if(k===round.anchor) return;
      board.querySelectorAll('.tile.move[data-lang="'+k+'"]').forEach(function(c,row){
        var ok=parseInt(c.getAttribute("data-id"),10)===row;
        c.classList.add(ok?"ok":"no");
        c.querySelector(".badge").textContent= ok?"✓":"✕";
      });
    });
    var sc=correctCount(); updateScore();
    if(sc.right===sc.total){
      el("wonSlot").innerHTML=
        '<div class="won"><div class="seal">★</div>'+
        '<div><h4>'+t("won_title")+'</h4><p>'+t("won_body",{n:round.langs.length})+'</p></div>'+
        '<button class="btn btn-quill ms-auto" id="againBtn">'+t("won_again")+'</button></div>';
      el("againBtn").addEventListener("click",startRound);
    }
  }

  /* ===================== PICK round ===================== */
  /* A phrase is shown across the chosen languages with one cell left blank.
     You choose, from a set of candidates (size = difficulty), the phrase that
     fills the gap. Each round is a short series of such questions. */
  var pick=null;

  function startPick(){
    var langs=LANGS.filter(function(k){return chosen[k];});
    if(langs.length<2){ if(el("setupWarn")) el("setupWarn").textContent=t("warn_two_langs"); return; }

    ensureBase();
    var anchor=(baseLang && chosen[baseLang]) ? baseLang : langs[0];
    langs=[anchor].concat(langs.filter(function(k){return k!==anchor;}));

    var cfg=PICK[difficulty];

    // prefer phrases that have every chosen language for the richest context
    var full=ALL_PHRASES.filter(function(p){
      return langs.every(function(k){return p[k]!=null && String(p[k]).trim()!=="";});
    });
    var pool=full.length>=2 ? full : ALL_PHRASES.slice();
    if(pool.length<2){ if(el("setupWarn")) el("setupWarn").textContent=t("warn_not_enough"); return; }

    var rounds=Math.max(1, Math.min(cfg.rounds, pool.length)); // unique phrase per question

    gameMode="pick";
    pick={
      langs:langs, anchor:anchor, opts:cfg.opts, pool:pool,
      total:rounds, qIndex:0, right:0, answered:false, sel:null, q:null,
      order:shuffle(pool.map(function(_,i){return i;})).slice(0,rounds)
    };
    roundActive=true;
    buildPickQuestion();
    renderPickBoard();
  }

  function buildPickQuestion(){
    var P=pick, pool=P.pool;
    var phrase=pool[P.order[P.qIndex]];

    // gap goes in a non-key language that this phrase actually has filled
    var targets=P.langs.filter(function(k){ return k!==P.anchor && phrase[k]!=null && String(phrase[k]).trim()!==""; });
    if(!targets.length) targets=P.langs.filter(function(k){return k!==P.anchor;});
    var target=targets[Math.floor(Math.random()*targets.length)];
    var correctVal=String(phrase[target]);

    // distractors: distinct target-language values from other phrases
    var seen={}; seen[correctVal]=1;
    var distract=[];
    shuffle(pool.filter(function(p){return p!==phrase;})).forEach(function(p){
      var v=p[target];
      if(v!=null && String(v).trim()!=="" && !seen[String(v)]){ seen[String(v)]=1; distract.push(String(v)); }
    });
    if(distract.length < P.opts-1){
      shuffle(ALL_PHRASES).forEach(function(p){
        var v=p[target];
        if(v!=null && String(v).trim()!=="" && !seen[String(v)]){ seen[String(v)]=1; distract.push(String(v)); }
      });
    }
    distract=distract.slice(0, Math.max(0,P.opts-1));

    P.q={ phrase:phrase, target:target, correct:correctVal, choices:shuffle([correctVal].concat(distract)) };
    P.sel=null; P.answered=false;
  }

  function renderPickBoard(){
    var P=pick, q=P.q, anchor=P.anchor;
    var tinfo=langInfo(q.target);
    var last=(P.qIndex+1>=P.total);
    var answeredCount=P.qIndex+(P.answered?1:0);

    // header + action button (Check while answering, Next/Results after)
    var html=
      '<div class="board-head">'+
        '<div><span class="eyebrow d-block mb-1">'+t("pick_progress",{i:P.qIndex+1,n:P.total})+'</span>'+
          '<h2 class="serif m-0" style="font-size:24px;">'+t("pick_title")+'</h2></div>'+
        '<div class="d-flex gap-2 flex-wrap">'+
          '<button class="btn btn-parch" id="backBtn">'+t("change_setup")+'</button>'+
          (P.answered
            ? '<button class="btn btn-quill" id="nextBtn">'+(last?t("pick_results"):t("pick_next"))+'</button>'
            : '<button class="btn btn-quill" id="pickCheckBtn">'+t("pick_check")+'</button>')+
        '</div>'+
      '</div>'+
      '<p class="hintline">'+t("pick_hint",{lang:esc(tinfo.native), spk:SPK_INLINE})+'</p>'+
      (answeredCount>0 ? '<div class="scoreline mb-3">'+t("pick_score",{right:P.right,total:answeredCount})+'</div>' : '');

    // phrase card — one row per chosen language; target row is the gap
    var rows=P.langs.map(function(k){
      var i=langInfo(k), c=tint(i);
      var label='<span class="code" style="background:'+c+'">'+i.code+'</span>'+
        '<span class="pl-nm">'+esc(i.native)+(k===anchor?' <small style="color:var(--accent)">· '+t("col_key")+'</small>':'')+'</span>';

      if(k===q.target){
        var slot = (P.sel!=null)
          ? '<span class="gap-fill">'+esc(P.sel)+'</span>'
          : '<span class="gap-empty">'+t("pick_gap")+'</span>';
        var stateCls = P.answered ? (P.sel===q.correct?' ok':' no') : '';
        return '<div class="pl-row target'+stateCls+'">'+label+
          '<span class="pl-val gap">'+slot+'</span>'+
          (P.answered?'<span class="badge2">'+(P.sel===q.correct?'✓':'✕')+'</span>':'')+'</div>';
      }
      var val=q.phrase[k];
      var has=val!=null && String(val).trim()!=="";
      return '<div class="pl-row">'+label+
        '<span class="pl-val">'+(has?esc(String(val)):'<span class="empty">'+t("not_given")+'</span>')+'</span>'+
        (has?'<button class="spk" data-spk data-text="'+esc(String(val))+'" data-bcp="'+i.bcp+'" title="'+t("pronounce")+'">'+SPK_SVG+'</button>':'')+'</div>';
    }).join("");

    html+='<div class="leaf pick-card mb-3"><div class="leaf-body">'+rows+'</div></div>';

    // feedback after an answer
    if(P.answered){
      var good=(P.sel===q.correct);
      html+='<div class="pick-fb '+(good?'good':'bad')+'">'+
        (good ? t("pick_correct")
              : t("pick_wrong")+' '+t("pick_answer_was")+' <b>'+esc(q.correct)+'</b>')+'</div>';
    }

    // candidate tray (in the target language)
    var choices=q.choices.map(function(v){
      var sel = (P.sel===v) ? ' sel':'';
      var mark='';
      if(P.answered){ if(v===q.correct) mark=' ok'; else if(v===P.sel) mark=' no'; }
      return '<button class="choice'+sel+mark+'" data-v="'+esc(v)+'"'+(P.answered?' disabled':'')+'>'+
        '<span class="ch-tx">'+esc(v)+'</span>'+
        '<span class="ch-spk" data-spk data-text="'+esc(v)+'" data-bcp="'+esc(tinfo.bcp)+'" title="'+t("pronounce")+'">'+SPK_SVG+'</span>'+
      '</button>';
    }).join("");

    html+='<div class="choice-tray" id="choiceTray">'+choices+'</div>'+
          '<div class="muted small mt-2" id="pickWarn"></div>';

    main.innerHTML=html;

    el("backBtn").addEventListener("click",function(){ roundActive=false; renderSetup(); });
    var cb=el("pickCheckBtn"); if(cb) cb.addEventListener("click",pickCheck);
    var nb=el("nextBtn"); if(nb) nb.addEventListener("click",pickNext);

    if(!P.answered){
      el("choiceTray").querySelectorAll(".choice").forEach(function(b){
        b.addEventListener("click",function(e){
          if(e.target.closest("[data-spk]")) return;
          P.sel=b.getAttribute("data-v");
          renderPickBoard();
        });
      });
    }
    wirePickSpk();
  }

  function wirePickSpk(){
    main.querySelectorAll("[data-spk]").forEach(function(btn){
      btn.addEventListener("click",function(e){
        e.stopPropagation();
        speak(btn.getAttribute("data-text"), btn.getAttribute("data-bcp"));
      });
    });
  }

  function pickCheck(){
    var P=pick;
    if(P.sel==null){ var w=el("pickWarn"); if(w) w.textContent=t("pick_warn_select"); return; }
    P.answered=true;
    if(P.sel===P.q.correct) P.right++;
    renderPickBoard();
  }

  function pickNext(){
    var P=pick;
    if(P.qIndex+1>=P.total){ renderPickDone(); return; }
    P.qIndex++;
    buildPickQuestion();
    renderPickBoard();
  }

  function renderPickDone(){
    var P=pick;
    main.innerHTML=
      '<div class="board-head">'+
        '<div><span class="eyebrow d-block mb-1">'+t("pick_title")+'</span>'+
          '<h2 class="serif m-0" style="font-size:24px;">'+t("pick_done_title")+'</h2></div>'+
        '<div class="d-flex gap-2 flex-wrap">'+
          '<button class="btn btn-parch" id="backBtn">'+t("change_setup")+'</button>'+
          '<button class="btn btn-quill" id="againBtn">'+t("won_again")+'</button>'+
        '</div>'+
      '</div>'+
      '<div class="won"><div class="seal">★</div>'+
        '<div><h4>'+t("pick_done_title")+'</h4>'+
          '<p>'+t("pick_done_body",{right:P.right,total:P.total})+'</p></div></div>';
    el("backBtn").addEventListener("click",function(){ roundActive=false; renderSetup(); });
    el("againBtn").addEventListener("click",startPick);
  }

  /* ===================== FILL round ===================== */
  /* The key column is shown fixed and true; every other cell starts empty.
     Tap a cell to open a chooser of N candidates (N = difficulty) in that
     cell's language and place the phrase that belongs there. Fill them all,
     then check. */
  var fill=null;
  function cellKey(k,r){ return k+"\u0000"+r; }

  function startFill(){
    var langs=LANGS.filter(function(k){return chosen[k];});
    if(langs.length<2){ if(el("setupWarn")) el("setupWarn").textContent=t("warn_two_langs"); return; }

    ensureBase();
    var anchor=(baseLang && chosen[baseLang]) ? baseLang : langs[0];
    langs=[anchor].concat(langs.filter(function(k){return k!==anchor;}));

    var cfg=FILL[difficulty];
    var n=randInt(cfg.rows[0],cfg.rows[1]);

    // prefer phrases that have the key plus at least one other chosen language
    var full=ALL_PHRASES.filter(function(p){
      return p[anchor]!=null && String(p[anchor]).trim()!=="" &&
        langs.some(function(k){return k!==anchor && p[k]!=null && String(p[k]).trim()!=="";});
    });
    var pool=full.length>=n ? full : ALL_PHRASES.slice();
    n=Math.min(n,pool.length);
    if(n<2){ if(el("setupWarn")) el("setupWarn").textContent=t("warn_not_enough"); return; }

    var items=sample(pool,n);

    // precompute a stable candidate set for every interactive (non-key, given) cell
    var choices={}, placed={};
    langs.forEach(function(k){
      if(k===anchor) return;
      for(var r=0;r<n;r++){
        var val=items[r][k];
        if(val==null || String(val).trim()==="") continue;  // not-given => static, no blank
        var correct=String(val);
        var seen={}; seen[correct]=1;
        var distract=[];
        // plausible neighbours first: the same column's other rows on this board
        shuffle(items).forEach(function(it){
          var v=it[k];
          if(v!=null && String(v).trim()!=="" && !seen[String(v)]){ seen[String(v)]=1; distract.push(String(v)); }
        });
        // then widen to the rest of the phrasebook if we still need more
        if(distract.length < cfg.opts-1){
          shuffle(ALL_PHRASES).forEach(function(p){
            var v=p[k];
            if(v!=null && String(v).trim()!=="" && !seen[String(v)]){ seen[String(v)]=1; distract.push(String(v)); }
          });
        }
        distract=distract.slice(0, Math.max(0,cfg.opts-1));
        choices[cellKey(k,r)]=shuffle([correct].concat(distract));
        placed[cellKey(k,r)]=null;
      }
    });

    gameMode="fill";
    fill={ langs:langs, anchor:anchor, items:items, n:n, opts:cfg.opts,
           choices:choices, placed:placed, active:null, checked:false };
    roundActive=true;
    renderFillBoard();
  }

  function renderFillBoard(){
    var F=fill, langs=F.langs, anchor=F.anchor, items=F.items, n=F.n;
    var tmpl="38px "+langs.map(function(){return "minmax(0,1fr)";}).join(" ");
    var ainfo=langInfo(anchor);

    var html=
      '<div class="board-head">'+
        '<div><span class="eyebrow d-block mb-1">'+t("board_eyebrow",{diff:t("diff_"+difficulty),n:n})+'</span>'+
          '<h2 class="serif m-0" style="font-size:24px;">'+t("fill_title")+'</h2></div>'+
        '<div class="d-flex gap-2 flex-wrap">'+
          '<button class="btn btn-parch" id="clearBtn">'+t("fill_clear")+'</button>'+
          '<button class="btn btn-parch" id="backBtn">'+t("change_setup")+'</button>'+
          '<button class="btn btn-quill" id="checkBtn">'+t("fill_check")+'</button>'+
        '</div>'+
      '</div>'+
      '<p class="hintline">'+t("fill_hint",{lang:esc(ainfo.native), n:F.opts, spk:SPK_INLINE})+'</p>'+
      '<div id="wonSlot"></div>'+
      '<div class="scoreline mb-2" id="scoreLine"></div>'+
      '<div class="board" id="board" style="grid-template-columns:'+tmpl+';">';

    html+='<div></div>';
    langs.forEach(function(k){
      var i=langInfo(k),c=tint(i);
      html+='<div class="col-head"><span class="code" style="background:'+c+'">'+i.code+'</span>'+
        '<span class="nm">'+esc(i.native)+(i.native!==i.name?' <small>'+esc(i.name)+'</small>':'')+
        (k===anchor?' <small style="color:var(--accent)">· '+t("col_key")+'</small>':'')+'</span></div>';
    });

    for(var r=0;r<n;r++){
      html+='<div class="rownum">'+(r+1)+'</div>';
      (function(r){
        langs.forEach(function(k){
          var i=langInfo(k);
          if(k===anchor){
            var av=items[r][k];
            var ah=av!=null && String(av).trim()!=="";
            html+='<div class="tile anchor" data-bcp="'+i.bcp+'" data-text="'+(ah?esc(String(av)):'')+'">'+
              '<span class="txt'+(ah?'':' empty')+'">'+(ah?esc(String(av)):t("not_given"))+'</span>'+
              '<button class="spk" data-spk title="'+t("pronounce")+'">'+SPK_SVG+'</button></div>';
            return;
          }
          var ck=cellKey(k,r);
          if(!F.choices.hasOwnProperty(ck)){
            html+='<div class="tile"><span class="txt empty">'+t("not_given")+'</span></div>';
            return;
          }
          var val=F.placed[ck];
          var filled=val!=null;
          var active=F.active===ck;
          var correct = filled && val===String(items[r][k]);
          var mark = F.checked ? (correct?' ok':' no') : '';
          var badge = F.checked ? (correct?'✓':'✕') : '';
          html+='<div class="tile cell'+(filled?' filled':'')+(active?' sel':'')+mark+'" '+
                'data-lang="'+esc(k)+'" data-row="'+r+'" data-bcp="'+i.bcp+'" data-text="'+(filled?esc(val):'')+'">'+
            '<span class="txt'+(filled?'':' empty')+'">'+(filled?esc(val):t("fill_empty"))+'</span>'+
            (filled?'<button class="spk" data-spk title="'+t("pronounce")+'">'+SPK_SVG+'</button>':'')+
            '<span class="badge">'+badge+'</span></div>';
        });
      })(r);
    }
    html+='</div>';
    html+='<div id="fillChooser" class="fill-chooser"></div>';

    main.innerHTML=html;

    el("checkBtn").addEventListener("click",fillCheck);
    el("clearBtn").addEventListener("click",clearFill);
    el("backBtn").addEventListener("click",function(){ roundActive=false; renderSetup(); });

    wireFillBoard();
    renderFillChooser();
    updateFillScore();
  }

  function wireFillBoard(){
    var board=el("board");
    board.querySelectorAll("[data-spk]").forEach(function(btn){
      btn.addEventListener("click",function(e){
        e.stopPropagation();
        var tile=btn.closest(".tile");
        speak(tile.getAttribute("data-text"), tile.getAttribute("data-bcp"));
      });
    });
    board.querySelectorAll(".tile.cell").forEach(function(tile){
      tile.addEventListener("click",function(e){
        if(e.target.closest("[data-spk]")) return;
        var ck=cellKey(tile.getAttribute("data-lang"), parseInt(tile.getAttribute("data-row"),10));
        fill.active=(fill.active===ck)?null:ck;
        renderFillBoard();
        if(fill.active){ var ch=el("fillChooser"); if(ch) ch.scrollIntoView({behavior:"smooth",block:"nearest"}); }
      });
    });
  }

  function renderFillChooser(){
    var F=fill, host=el("fillChooser"); if(!host) return;
    if(!F.active){ host.innerHTML='<p class="muted small m-0">'+t("fill_pick_cell")+'</p>'; return; }

    var parts=F.active.split("\u0000"), k=parts[0], r=parseInt(parts[1],10);
    var tinfo=langInfo(k);
    var keyVal=F.items[r][F.anchor];
    var keyTxt=(keyVal!=null && String(keyVal).trim()!=="") ? esc(String(keyVal)) : t("not_given");

    var prompt='<div class="fill-prompt">'+t("fill_prompt",{lang:esc(tinfo.native), key:keyTxt})+'</div>';

    var cur=F.placed[F.active];
    var choices=F.choices[F.active].map(function(v){
      var sel=(cur===v)?' sel':'';
      var mark='';
      if(F.checked){ if(v===String(F.items[r][k])) mark=' ok'; else if(v===cur) mark=' no'; }
      return '<button class="choice'+sel+mark+'" data-v="'+esc(v)+'">'+
        '<span class="ch-tx">'+esc(v)+'</span>'+
        '<span class="ch-spk" data-spk data-text="'+esc(v)+'" data-bcp="'+esc(tinfo.bcp)+'" title="'+t("pronounce")+'">'+SPK_SVG+'</span>'+
      '</button>';
    }).join("");

    host.innerHTML=prompt+'<div class="choice-tray">'+choices+'</div>';

    host.querySelectorAll(".choice").forEach(function(b){
      b.addEventListener("click",function(e){
        if(e.target.closest("[data-spk]")) return;
        F.placed[F.active]=b.getAttribute("data-v");
        F.checked=false;   // editing invalidates a prior check
        F.active=null;     // close the chooser once a card is placed
        renderFillBoard();
      });
    });
    host.querySelectorAll("[data-spk]").forEach(function(btn){
      btn.addEventListener("click",function(e){
        e.stopPropagation();
        speak(btn.getAttribute("data-text"), btn.getAttribute("data-bcp"));
      });
    });
  }

  function fillCounts(){
    var F=fill, total=0, right=0, done=0;
    for(var ck in F.choices){
      if(!F.choices.hasOwnProperty(ck)) continue;
      total++;
      var parts=ck.split("\u0000"), k=parts[0], r=parseInt(parts[1],10);
      var v=F.placed[ck];
      if(v!=null){ done++; if(v===String(F.items[r][k])) right++; }
    }
    return {total:total,right:right,done:done};
  }

  function updateFillScore(){
    var F=fill, sc=fillCounts(), line=el("scoreLine"); if(!line) return;
    line.innerHTML = F.checked
      ? t("score_line",{right:sc.right,total:sc.total})
      : t("fill_progress",{done:sc.done,total:sc.total});
  }

  function clearFill(){
    for(var ck in fill.placed){ if(fill.placed.hasOwnProperty(ck)) fill.placed[ck]=null; }
    fill.checked=false; fill.active=null;
    renderFillBoard();
  }

  function fillCheck(){
    fill.checked=true; fill.active=null;
    renderFillBoard();
    var sc=fillCounts();
    if(sc.total>0 && sc.right===sc.total){
      el("wonSlot").innerHTML=
        '<div class="won"><div class="seal">★</div>'+
        '<div><h4>'+t("fill_won_title")+'</h4><p>'+t("fill_won_body",{n:fill.langs.length})+'</p></div>'+
        '<button class="btn btn-quill ms-auto" id="againBtn">'+t("won_again")+'</button></div>';
      el("againBtn").addEventListener("click",startFill);
    }
  }

  /* ===================== example data ===================== */
  var EXAMPLE=[
    {name:"Greetings & Basic Interaction",phrases:[
      {english:"Hello",russian:"Привет",spanish:"Hola",french:"Bonjour",german:"Hallo",portuguese:"Olá",italian:"Ciao"},
      {english:"Good morning",russian:"Доброе утро",spanish:"Buenos días",french:"Bonjour",german:"Guten Morgen",portuguese:"Bom dia",italian:"Buongiorno"},
      {english:"Thank you",russian:"Спасибо",spanish:"Gracias",french:"Merci",german:"Danke",portuguese:"Obrigado",italian:"Grazie"},
      {english:"Please",russian:"Пожалуйста",spanish:"Por favor",french:"S'il vous plaît",german:"Bitte",portuguese:"Por favor",italian:"Per favore"},
      {english:"Excuse me",russian:"Извините",spanish:"Perdone",french:"Excusez-moi",german:"Entschuldigung",portuguese:"Com licença",italian:"Mi scusi"},
      {english:"Goodbye",russian:"До свидания",spanish:"Adiós",french:"Au revoir",german:"Auf Wiedersehen",portuguese:"Adeus",italian:"Arrivederci"}
    ]},
    {name:"Getting Around",phrases:[
      {english:"Where is the station?",russian:"Где вокзал?",spanish:"¿Dónde está la estación?",french:"Où est la gare ?",german:"Wo ist der Bahnhof?",portuguese:"Onde fica a estação?",italian:"Dov'è la stazione?"},
      {english:"How much is a ticket?",russian:"Сколько стоит билет?",spanish:"¿Cuánto cuesta un billete?",french:"Combien coûte un billet ?",german:"Was kostet eine Fahrkarte?",portuguese:"Quanto custa um bilhete?",italian:"Quanto costa un biglietto?"},
      {english:"Turn left",russian:"Поверните налево",spanish:"Gire a la izquierda",french:"Tournez à gauche",german:"Biegen Sie links ab",portuguese:"Vire à esquerda",italian:"Gira a sinistra"},
      {english:"Turn right",russian:"Поверните направо",spanish:"Gire a la derecha",french:"Tournez à droite",german:"Biegen Sie rechts ab",portuguese:"Vire à direita",italian:"Gira a destra"},
      {english:"Stop here, please",russian:"Остановитесь здесь, пожалуйста",spanish:"Pare aquí, por favor",french:"Arrêtez-vous ici, s'il vous plaît",german:"Halten Sie hier, bitte",portuguese:"Pare aqui, por favor",italian:"Si fermi qui, per favore"}
    ]},
    {name:"At the Restaurant",phrases:[
      {english:"A table for two, please",russian:"Столик на двоих, пожалуйста",spanish:"Una mesa para dos, por favor",french:"Une table pour deux, s'il vous plaît",german:"Einen Tisch für zwei, bitte",portuguese:"Uma mesa para dois, por favor",italian:"Un tavolo per due, per favore"},
      {english:"The menu, please",russian:"Меню, пожалуйста",spanish:"La carta, por favor",french:"La carte, s'il vous plaît",german:"Die Speisekarte, bitte",portuguese:"A ementa, por favor",italian:"Il menù, per favore"},
      {english:"The bill, please",russian:"Счёт, пожалуйста",spanish:"La cuenta, por favor",french:"L'addition, s'il vous plaît",german:"Die Rechnung, bitte",portuguese:"A conta, por favor",italian:"Il conto, per favore"},
      {english:"A glass of water",russian:"Стакан воды",spanish:"Un vaso de agua",french:"Un verre d'eau",german:"Ein Glas Wasser",portuguese:"Um copo de água",italian:"Un bicchiere d'acqua"},
      {english:"It was delicious",russian:"Было вкусно",spanish:"Estaba delicioso",french:"C'était délicieux",german:"Es war köstlich",portuguese:"Estava delicioso",italian:"Era delizioso"}
    ]}
  ];

  /* ===================== go ===================== */
  getMeta("locale").then(function(v){
    LOCALE = (v && UI_LOCALES.some(function(L){return L.code===v;})) ? v : detectLocale();
    applyStaticI18n(); buildLangMenu();
    return refresh();
  });
})();
