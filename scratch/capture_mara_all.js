const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9241',
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
      res = await fetch('http://127.0.0.1:9241/json/new?about:blank', { method: 'PUT' });
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

    const pagesToCapture = [
      {
        url: 'https://mara-events.com/',
        filename: 'mara-hero.png',
        jpegFilename: 'project-mara.jpg',
        waitFor: 4000
      },
      {
        url: 'https://mara-events.com/gallery.html',
        filename: 'mara-gallery.png',
        waitFor: 3500
      },
      {
        url: 'https://mara-events.com/training.html',
        filename: 'mara-training.png',
        waitFor: 3500
      },
      {
        url: 'https://mara-events.com/vendors.html',
        filename: 'mara-vendors.png',
        waitFor: 3500
      },
      {
        url: 'https://mara-events.com/webinar.html',
        filename: 'mara-webinar.png',
        waitFor: 3500
      }
    ];

    const outDir = path.join(__dirname, '../assets/images');

    for (const item of pagesToCapture) {
      console.log(`Navigating to ${item.url}...`);
      await send('Page.navigate', { url: item.url });

      await new Promise(resolve => {
        const l = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Page.loadEventFired') {
            ws.removeEventListener('message', l);
            resolve();
          }
        };
        ws.addEventListener('message', l);
      });

      console.log(`Waiting ${item.waitFor}ms for animations and fonts to settle...`);
      await sleep(item.waitFor);

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 1440,
          height: 900,
          scale: 1
        }
      });

      const outPath = path.join(outDir, item.filename);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot to ${outPath}`);

      if (item.jpegFilename) {
        const shotJpeg = await send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 92,
          clip: {
            x: 0,
            y: 0,
            width: 1440,
            height: 900,
            scale: 1
          }
        });
        const outJpegPath = path.join(outDir, item.jpegFilename);
        fs.writeFileSync(outJpegPath, Buffer.from(shotJpeg.data, 'base64'));
        console.log(`Saved JPEG screenshot to ${outJpegPath}`);
      }
    }

    console.log('All Mara Events screenshots captured successfully!');
    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
