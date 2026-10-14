// 앱 껍데기를 저장해 두어 오프라인에서도 열리게 한다(파일 내용은 앱이 IndexedDB에 따로 저장).
const V = 'ka-shell-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('googleapis.com') || url.hostname === 'accounts.google.com') return; // 구글 통신은 건드리지 않음
  if (url.origin === location.origin) {
    // 우리 파일: 인터넷이 되면 최신(cache:'no-store' = 깃허브 페이지의 10분 임시저장을 건너뜀), 안 되면 저장본
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(m => m || caches.match('index.html'))));
  } else {
    // PDF 뷰어 라이브러리 등 외부 정적 파일: 저장본 우선
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; })));
  }
});
