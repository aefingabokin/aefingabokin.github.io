import { readLocal, applyAppearance } from './settings.js';
// Útlitið sett strax úr símanum, áður en Firebase hleðst, svo skjárinn blikki ekki
applyAppearance(readLocal());

import { createFirebaseStore } from './store.js';
import { startApp } from './ui.js';

createFirebaseStore()
  .then(startApp)
  .catch(err => {
    console.error(err);
    document.body.dataset.gate = 'error';
    document.getElementById('view').innerHTML =
      '<div class="gate glass"><h1>Náði ekki að ræsa appið</h1><p>Athugaðu netsambandið og reyndu aftur.</p>' +
      '<button class="cta" onclick="location.reload()">Reyna aftur</button></div>';
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
