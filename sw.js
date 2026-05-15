// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  나의 일기장 — Service Worker
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CACHE_NAME = 'diary-app-v1';

// 앱 실행에 필요한 핵심 파일들
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 오래된 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // GAS API 호출은 캐시하지 않음 (항상 최신 데이터)
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        // 성공적인 GET 요청만 캐시에 추가
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
