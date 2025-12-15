let gsiLoadedPromise;
let gapiLoadedPromise;

export function loadGoogleIdentity() {
  if (!gsiLoadedPromise) {
    gsiLoadedPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return gsiLoadedPromise;
}

export function loadGapiClient() {
  if (!gapiLoadedPromise) {
    gapiLoadedPromise = new Promise((resolve, reject) => {
      if (window.gapi?.load) return resolve();
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return gapiLoadedPromise;
}
