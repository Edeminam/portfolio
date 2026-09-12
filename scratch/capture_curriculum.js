const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let res, target;
  for (let i = 0; i < 15; i++) {
    await sleep(800);
    try {
      res = await fetch('http://127.0.0.1:9240/json/new?about:blank', { method: 'PUT' });
      if (res.ok) {
        target = await res.json();
        break;
      }
    } catch (e) {}
  }
  if (!target) {
    chromeProcess.kill();
    throw new Error('Could not connect to Chrome debugging port');
  }

  try {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    console.log('Navigating to Ship & Found curriculum section...');
    await send('Page.navigate', { url: 'https://www.devdesignhq.com/bootcamps/ship-and-found' });
    await sleep(3500);

    // Scroll directly into curriculum header
    await send('Runtime.evaluate', {
      expression: `
        const el = Array.from(document.querySelectorAll('h2, h3')).find(e => e.innerText.includes('Curriculum'));
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        } else {
          window.scrollTo(0, 750);
        }
      `
    });
    await sleep(1500);

    const shotCurriculum = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 900, scale: 1 }
    });
    const outDir = path.join(__dirname, '../assets/images');
    fs.writeFileSync(path.join(outDir, 'devdesign-curriculum.png'), Buffer.from(shotCurriculum.data, 'base64'));
    console.log('Updated devdesign-curriculum.png');

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
