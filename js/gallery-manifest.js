/* Use a same-origin snapshot for local previews and as a production fallback. */
(function () {
  'use strict';

  function readManifest(url) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);
    return fetch(url, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('Image list unavailable');
        return response.json();
      })
      .then(function (data) {
        var images = data && (data.images || data);
        if (!Array.isArray(images) || !images.length ||
            !images.every(function (name) {
              return typeof name === 'string' && /^[^/\\]+\.(jpe?g|png|webp)$/i.test(name);
            })) {
          throw new Error('Invalid or empty image list');
        }
        return data;
      })
      .finally(function () { clearTimeout(timeout); });
  }

  window.loadGalleryManifest = function (base) {
    var local = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) !== -1;
    if (local) return readManifest('manifest.json');
    return readManifest(base + '/manifest.json?t=' + Date.now())
      .catch(function () { return readManifest('manifest.json'); });
  };

  window.showGalleryLoadError = function (container) {
    container.classList.remove('hidden');
    container.replaceChildren();
    var message = document.createElement('div');
    message.setAttribute('role', 'alert');
    message.style.cssText = 'color:#eee;text-align:center;padding:24px;font:18px/1.6 system-ui;max-width:480px';
    var text = document.createElement('p');
    text.textContent = 'The photographs could not be loaded. Please try again.';
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.style.cssText = 'margin:16px;padding:12px 20px;font:inherit;cursor:pointer';
    retry.addEventListener('click', function () { location.reload(); });
    var home = document.createElement('a');
    home.href = '../index.html';
    home.textContent = 'Back to home';
    home.style.color = '#d6b9ec';
    message.append(text, retry, home);
    container.append(message);
  };
})();
