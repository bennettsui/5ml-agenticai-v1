<?php
/**
 * TEDxXinyi — Media Library Admin Panel
 * Pure PHP version — no Node.js required.
 */
?>
<!DOCTYPE html>
<html lang="zh-TW"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TEDxXinyi — Media Library</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#111;color:#e5e5e5;min-height:100vh}
.login-bg{position:fixed;inset:0;background:#111;z-index:200;display:flex;align-items:center;justify-content:center}
.login-bg.hidden{display:none}
.login-box{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:2rem;width:90%;max-width:360px;text-align:center}
.login-box h1{font-size:1.1rem;margin-bottom:0.3rem}.login-box h1 em{color:#E62B1E;font-style:normal}
.login-box .sub{color:#666;font-size:0.8rem;margin-bottom:1.5rem}
.login-box input{width:100%;padding:0.6rem;background:#111;border:1px solid #333;border-radius:6px;color:#ccc;font-size:0.9rem;margin-bottom:1rem;text-align:center}
.login-box input:focus{outline:none;border-color:#E62B1E}
.login-box .err{color:#f87171;font-size:0.8rem;margin-top:0.5rem;display:none}
.app{display:none}.app.show{display:block}
.header{background:#1a1a1a;border-bottom:1px solid #333;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.header h1{font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:0.5rem}
.header h1 em{color:#E62B1E;font-style:normal}
.header-actions{display:flex;gap:0.5rem;align-items:center}
.toolbar{background:#1a1a1a;border-bottom:1px solid #222;padding:0.75rem 1.5rem;display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;position:sticky;top:52px;z-index:40}
.btn{border:none;padding:0.45rem 1rem;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.8rem;transition:all 0.15s;display:inline-flex;align-items:center;gap:0.35rem}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.btn-red{background:#E62B1E;color:#fff}.btn-red:hover:not(:disabled){background:#c42419}
.btn-outline{background:transparent;border:1px solid #444;color:#ccc}.btn-outline:hover:not(:disabled){border-color:#888;color:#fff}
.btn-ghost{background:transparent;color:#999;border:1px solid transparent}.btn-ghost:hover{color:#fff}
.btn-sm{padding:0.3rem 0.6rem;font-size:0.75rem}
.stats{font-size:0.75rem;color:#666;margin-left:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;padding:1.5rem}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;transition:all 0.15s;position:relative}
.card:hover{border-color:#444;transform:translateY(-1px)}
.card.selected{border-color:#E62B1E;box-shadow:0 0 0 1px #E62B1E}
.card-check{position:absolute;top:0.5rem;left:0.5rem;z-index:5;width:20px;height:20px;border-radius:4px;border:2px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
.card.selected .card-check{background:#E62B1E;border-color:#E62B1E}
.card-check svg{opacity:0;transition:opacity 0.1s}.card.selected .card-check svg{opacity:1}
.card-img{aspect-ratio:4/3;background:#0a0a0a;display:flex;align-items:center;justify-content:center;overflow:hidden}
.card-img img{width:100%;height:100%;object-fit:cover}
.card-img .placeholder{color:#333;font-size:2rem;font-weight:900}
.card-body{padding:0.75rem}
.card-filename{font-size:0.8rem;font-weight:600;color:#ddd;word-break:break-all;margin-bottom:0.25rem}
.card-meta{font-size:0.7rem;color:#666;display:flex;gap:0.5rem;margin-bottom:0.5rem}
.card-alt{width:100%;padding:0.35rem 0.5rem;background:#111;border:1px solid #333;border-radius:5px;color:#ccc;font-size:0.75rem;margin-bottom:0.4rem;resize:none;font-family:inherit}
.card-alt:focus{outline:none;border-color:#E62B1E}
.card-actions{display:flex;gap:0.25rem}
.tag{display:inline-block;padding:0.1rem 0.4rem;border-radius:4px;font-size:0.65rem;font-weight:600}
.tag-gen{background:#1e293b;color:#60a5fa}.tag-up{background:#1c1917;color:#fb923c}.tag-spk{background:#14532d;color:#86efac}
.card-missing{opacity:0.6;border-style:dashed;border-color:#333}
.toast{position:fixed;bottom:1.5rem;right:1.5rem;background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:0.75rem 1rem;font-size:0.8rem;z-index:100;opacity:0;transition:opacity 0.3s;pointer-events:none}
.toast.show{opacity:1}.toast.ok{border-color:#065f46;color:#6ee7b7}.toast.err{border-color:#991b1b;color:#fca5a5}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:60;display:none;align-items:center;justify-content:center}
.modal-bg.open{display:flex}
.modal{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:1.5rem;width:90%;max-width:480px}
.modal h2{font-size:1rem;font-weight:700;margin-bottom:1rem}
.modal label{display:block;font-size:0.8rem;font-weight:600;color:#999;margin-bottom:0.3rem}
.modal input[type=file]{width:100%;margin-bottom:0.75rem;font-size:0.8rem}
.modal input[type=text],.modal select,.modal textarea{width:100%;padding:0.45rem 0.6rem;background:#111;border:1px solid #333;border-radius:6px;color:#ccc;font-size:0.8rem;margin-bottom:0.75rem;font-family:inherit}
.modal input[type=text]:focus,.modal select:focus,.modal textarea:focus{outline:none;border-color:#E62B1E}
.modal .preview-area{aspect-ratio:16/9;background:#0a0a0a;border-radius:8px;margin-bottom:0.75rem;display:flex;align-items:center;justify-content:center;overflow:hidden}
.modal .preview-area img{max-width:100%;max-height:100%;object-fit:contain}
.modal-foot{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.5rem}
.compress-bar{height:3px;background:#222;border-radius:2px;margin-top:0.5rem;overflow:hidden;display:none}
.compress-bar .fill{height:100%;background:#E62B1E;transition:width 0.3s;width:0}
</style>
</head><body>

<!-- Login Screen -->
<div class="login-bg" id="loginScreen">
  <div class="login-box">
    <h1><em>TEDx</em>Xinyi Admin</h1>
    <p class="sub">Media Library</p>
    <form onsubmit="event.preventDefault();doLogin()">
      <input type="password" id="loginPw" placeholder="Password" autofocus>
      <button class="btn btn-red" type="submit" style="width:100%">Enter</button>
    </form>
    <p class="err" id="loginErr">Incorrect password</p>
  </div>
</div>

<!-- Main App -->
<div class="app" id="app">
<div class="header">
  <h1><em>TEDx</em>Xinyi Media Library</h1>
  <div class="header-actions">
    <button class="btn btn-outline" onclick="loadMedia()">Refresh</button>
    <button class="btn btn-ghost btn-sm" onclick="doLogout()">Logout</button>
  </div>
</div>
<div class="toolbar">
  <button class="btn btn-red" onclick="openUpload()">+ Upload</button>
  <button class="btn btn-outline" id="compressAllBtn" onclick="compressAll()">Compress All</button>
  <button class="btn btn-outline" id="compressSelBtn" onclick="compressSelected()" disabled>Compress Selected</button>
  <button class="btn btn-ghost btn-sm" onclick="toggleSelectAll()">Select All</button>
  <div class="stats" id="stats"></div>
</div>
<div class="compress-bar" id="compressBar"><div class="fill" id="compressFill"></div></div>
<div class="grid" id="grid"></div>
</div>

<!-- Upload Modal -->
<div class="modal-bg" id="uploadModal">
  <div class="modal">
    <h2>Upload Image</h2>
    <label>File (JPG / PNG / WebP, max 25 MB)</label>
    <input type="file" id="uploadFile" accept="image/jpeg,image/png,image/webp">
    <div class="preview-area" id="uploadPreview"><span style="color:#444;font-size:0.85rem">Select a file</span></div>
    <label>Save to</label>
    <select id="uploadFolder">
      <option value="">Root (hero / poster / salon)</option>
      <option value="speakers">Speakers</option>
    </select>
    <label>Custom filename (optional)</label>
    <input type="text" id="uploadName" placeholder="auto-detect from file">
    <label>Alt text</label>
    <textarea id="uploadAlt" rows="2" placeholder="Describe the image..."></textarea>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeUpload()">Cancel</button>
      <button class="btn btn-red" id="uploadBtn" onclick="doUpload()">Upload</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
// API base — relative to admin/
var API = 'api/';
var token = sessionStorage.getItem('tedx_token') || '';
var mediaItems = [];
var selectedKeys = new Set();

// Auth
async function doLogin() {
  var pw = document.getElementById('loginPw').value;
  if (!pw) return;
  try {
    var r = await fetch(API + 'auth.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) });
    var d = await r.json();
    if (r.ok && d.token) { token = d.token; sessionStorage.setItem('tedx_token', token); showApp(); }
    else { document.getElementById('loginErr').style.display = 'block'; }
  } catch(e) { document.getElementById('loginErr').style.display = 'block'; }
}
function doLogout() { token = ''; sessionStorage.removeItem('tedx_token'); document.getElementById('loginScreen').classList.remove('hidden'); document.getElementById('app').classList.remove('show'); }
function showApp() { document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('app').classList.add('show'); loadMedia(); }
if (token) { showApp(); }

function authFetch(url, opts) {
  opts = opts || {};
  if (!opts.headers) opts.headers = {};
  opts.headers['x-admin-token'] = token;
  return fetch(url, opts);
}

async function loadMedia() {
  try {
    var r = await authFetch(API + 'media.php');
    if (r.status === 401) { doLogout(); return; }
    var d = await r.json();
    mediaItems = d.images || [];
    renderGrid();
    updateStats();
  } catch(e) { showToast('Failed to load: ' + e.message, true); }
}

function renderGrid() {
  var g = document.getElementById('grid');
  if (!mediaItems.length) { g.innerHTML = '<div style="text-align:center;padding:4rem;color:#444;grid-column:1/-1">No images found. Upload some!</div>'; return; }
  g.innerHTML = mediaItems.map(function(img) {
    var key = img.folder ? img.folder + '/' + img.filename : img.filename;
    var sel = selectedKeys.has(key) ? ' selected' : '';
    var sizeKb = img.size ? (img.size / 1024).toFixed(0) : '—';
    var src = img.folder ? '../images/' + img.folder + '/' + img.filename : '../images/' + img.filename;
    var tag = img.source === 'generated' ? '<span class="tag tag-gen">Generated</span>' : img.folder === 'speakers' ? '<span class="tag tag-spk">Speaker</span>' : '<span class="tag tag-up">Uploaded</span>';
    var v = img.size || 0;

    if (img.missing) {
      var desc = img.description || '';
      return '<div class="card card-missing" data-key="' + key + '">' +
        '<div class="card-img" style="background:#0d0d0d;flex-direction:column;gap:0.4rem">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
          '<span style="color:#555;font-size:0.65rem;text-align:center;padding:0 0.5rem">' + desc + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-filename" style="color:#888">' + img.filename + ' <span class="tag" style="background:#7f1d1d;color:#fca5a5">Missing</span></div>' +
          '<div class="card-meta"><span>Upload this image via the Upload button</span></div>' +
        '</div></div>';
    }

    return '<div class="card' + sel + '" data-key="' + key + '">' +
      '<div class="card-check" onclick="toggleSelect(event,\'' + key + '\')">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<div class="card-img"><img src="' + src + '?v=' + v + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="placeholder" style="display:none">?</div></div>' +
      '<div class="card-body">' +
        '<div class="card-filename">' + img.filename + ' ' + tag + '</div>' +
        '<div class="card-meta"><span>' + sizeKb + ' KB</span></div>' +
        '<textarea class="card-alt" rows="1" placeholder="Alt text..." data-key="' + key + '" onfocus="this.rows=2" onblur="this.rows=1;saveAlt(this)">' + (img.alt || '') + '</textarea>' +
        '<div class="card-actions">' +
          '<button class="btn btn-outline btn-sm" onclick="compressOne(\'' + key + '\')">Compress</button>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

function updateStats() {
  var total = mediaItems.length;
  var present = mediaItems.filter(function(i){return !i.missing;}).length;
  var missing = mediaItems.filter(function(i){return i.missing;}).length;
  var totalSize = mediaItems.reduce(function(s,i){return s+(i.size||0);}, 0);
  var parts = [present + ' images', (totalSize / 1024 / 1024).toFixed(1) + ' MB'];
  if (missing) parts.push(missing + ' missing');
  document.getElementById('stats').textContent = parts.join(' | ');
  document.getElementById('compressSelBtn').disabled = selectedKeys.size === 0;
}

function toggleSelect(e, key) {
  e.stopPropagation();
  if (selectedKeys.has(key)) selectedKeys.delete(key); else selectedKeys.add(key);
  var card = document.querySelector('.card[data-key="' + key + '"]');
  if (card) card.classList.toggle('selected');
  updateStats();
}

function toggleSelectAll() {
  if (selectedKeys.size === mediaItems.filter(function(i){return !i.missing;}).length) {
    selectedKeys.clear();
    document.querySelectorAll('.card').forEach(function(c){c.classList.remove('selected');});
  } else {
    mediaItems.forEach(function(img) {
      if (!img.missing) {
        var k = img.folder ? img.folder + '/' + img.filename : img.filename;
        selectedKeys.add(k);
      }
    });
    document.querySelectorAll('.card:not(.card-missing)').forEach(function(c){c.classList.add('selected');});
  }
  updateStats();
}

async function saveAlt(el) {
  var key = el.dataset.key;
  var alt = el.value.trim();
  try {
    await authFetch(API + 'metadata.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key: key, alt: alt }) });
  } catch(e) { showToast('Save failed: ' + e.message, true); }
}

async function compressOne(key) {
  var btn = event.target;
  btn.disabled = true; btn.textContent = '...';
  try {
    var r = await authFetch(API + 'compress.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key: key }) });
    var d = await r.json();
    if (d.note) showToast(key + ': already optimized'); else showToast(key + ': ' + d.savings + ' smaller');
    loadMedia();
  } catch(e) { showToast('Error: ' + e.message, true); }
  btn.disabled = false; btn.textContent = 'Compress';
}

async function compressAll() {
  var btn = document.getElementById('compressAllBtn');
  var bar = document.getElementById('compressBar');
  var fill = document.getElementById('compressFill');
  btn.disabled = true; btn.textContent = 'Compressing...';
  bar.style.display = 'block'; fill.style.width = '20%';
  try {
    fill.style.width = '50%';
    var r = await authFetch(API + 'compress-all.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: '{}' });
    var d = await r.json();
    fill.style.width = '100%';
    var saved = d.totalBefore - d.totalAfter;
    showToast('Done! Saved ' + (saved / 1024).toFixed(0) + ' KB across ' + d.results.length + ' images');
    loadMedia();
  } catch(e) { showToast('Error: ' + e.message, true); }
  btn.disabled = false; btn.textContent = 'Compress All';
  setTimeout(function(){ bar.style.display = 'none'; fill.style.width = '0'; }, 2000);
}

async function compressSelected() {
  if (!selectedKeys.size) return;
  var btn = document.getElementById('compressSelBtn');
  var bar = document.getElementById('compressBar');
  var fill = document.getElementById('compressFill');
  btn.disabled = true; btn.textContent = 'Compressing...';
  bar.style.display = 'block';
  var keys = Array.from(selectedKeys);
  var done = 0;
  for (var i = 0; i < keys.length; i++) {
    fill.style.width = ((done / keys.length) * 100) + '%';
    try {
      await authFetch(API + 'compress.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key: keys[i] }) });
    } catch(e) {}
    done++;
  }
  fill.style.width = '100%';
  showToast('Compressed ' + keys.length + ' images');
  selectedKeys.clear();
  loadMedia();
  btn.disabled = false; btn.textContent = 'Compress Selected';
  setTimeout(function(){ bar.style.display = 'none'; fill.style.width = '0'; }, 2000);
}

function openUpload() { document.getElementById('uploadModal').classList.add('open'); }
function closeUpload() { document.getElementById('uploadModal').classList.remove('open'); document.getElementById('uploadPreview').innerHTML = '<span style="color:#444;font-size:0.85rem">Select a file</span>'; }

document.getElementById('uploadFile').onchange = function(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(ev) { document.getElementById('uploadPreview').innerHTML = '<img src="' + ev.target.result + '">'; };
  r.readAsDataURL(f);
  if (!document.getElementById('uploadName').value) {
    document.getElementById('uploadName').value = f.name;
  }
};

async function doUpload() {
  var file = document.getElementById('uploadFile').files[0];
  if (!file) return showToast('Select a file first', true);
  var btn = document.getElementById('uploadBtn');
  btn.disabled = true; btn.textContent = 'Uploading...';
  try {
    var data = await new Promise(function(res, rej) { var r = new FileReader(); r.onload = function(){res(r.result);}; r.onerror = rej; r.readAsDataURL(file); });
    var filename = document.getElementById('uploadName').value || file.name;
    var folder = document.getElementById('uploadFolder').value;
    var alt = document.getElementById('uploadAlt').value;
    var r = await authFetch(API + 'upload.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ data: data, filename: filename, folder: folder, alt: alt }) });
    var d = await r.json();
    if (r.ok) {
      showToast('Uploaded: ' + d.filename + ' (' + d.savings + ' smaller)');
      closeUpload();
      document.getElementById('uploadFile').value = '';
      document.getElementById('uploadName').value = '';
      document.getElementById('uploadAlt').value = '';
      loadMedia();
    } else { showToast('Error: ' + d.error, true); }
  } catch(e) { showToast(e.message, true); }
  btn.disabled = false; btn.textContent = 'Upload';
}

function showToast(msg, err) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (err ? 'err' : 'ok');
  setTimeout(function(){ t.className = 'toast'; }, 3000);
}
</script>
</body></html>
