// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  63 프로젝트 — Service Worker
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 범위는 /63/ 안쪽으로 제한된다. 같은 도메인의 다른 앱과 섞이지 않도록
// 캐시 이름에 p63- 접두사를 쓰고, 정리할 때도 그 접두사만 지운다.

const PREFIX = 'p63-';
const CACHE = PREFIX + 'v7';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 앱 구동에 필요한 파일을 미리 담아둔다
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 활성화: 이 앱이 만든 예전 캐시만 지운다
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 화면 자체는 네트워크 우선 — 온라인이면 항상 최신 화면을 본다
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', clone));
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // 나머지는 캐시 우선 — 오프라인에서도 즉시 뜬다
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const network = fetch(req).then(res => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
