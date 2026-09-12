const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function createCdpClient(port = 9245) {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
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
      res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      if (res.ok) {
        target = await res.json();
        break;
      }
    } catch (e) {}
  }
  if (!target) {
    chromeProcess.kill();
    throw new Error(`Could not connect to Chrome debugging port ${port}`);
  }

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

  return { chromeProcess, ws, send };
}

async function captureUrl({ send, url, outPath, jpegPath, width = 1440, height = 900, scale = 2, waitFor = 4000, scrollY = 0, isMobile = false }) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: isMobile
  });

  if (isMobile) {
    await send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
  }

  console.log(`Navigating to ${url} (${width}x${height}${isMobile ? ' mobile' : ''})...`);
  await send('Page.navigate', { url });

  await new Promise(resolve => {
    const l = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        send.ws?.removeEventListener?.('message', l);
        resolve();
      }
    };
    send.ws?.addEventListener?.('message', l);
    setTimeout(resolve, 6000); // fallback timeout
  });

  await sleep(waitFor);

  if (scrollY > 0) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`
    });
    await sleep(1500);
  }

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width, height, scale: 1 }
  });
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`Saved PNG: ${path.basename(outPath)}`);

  if (jpegPath) {
    const shotJpeg = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width, height, scale: 1 }
    });
    fs.writeFileSync(jpegPath, Buffer.from(shotJpeg.data, 'base64'));
    console.log(`Saved JPEG: ${path.basename(jpegPath)}`);
  }
}

async function main() {
  const outDir = path.join(__dirname, '../assets/images');
  const { chromeProcess, ws, send } = await createCdpClient(9245);
  send.ws = ws;

  try {
    // ═══════════════════════════════════════════════════
    // 1. WORKNATION (https://worknation.africa)
    // ═══════════════════════════════════════════════════
    console.log('\n--- CAPTURING WORKNATION ---');
    await captureUrl({
      send,
      url: 'https://worknation.africa/',
      outPath: path.join(outDir, 'worknation-hero.png'),
      jpegPath: path.join(outDir, 'project-worknation.jpg'),
      waitFor: 4500
    });

    await captureUrl({
      send,
      url: 'https://worknation.africa/jobs',
      outPath: path.join(outDir, 'worknation-jobs.png'),
      waitFor: 4000
    });

    await captureUrl({
      send,
      url: 'https://worknation.africa/register/talent',
      outPath: path.join(outDir, 'worknation-talent.png'),
      waitFor: 4000
    });

    await captureUrl({
      send,
      url: 'https://worknation.africa/login',
      outPath: path.join(outDir, 'worknation-login.png'),
      waitFor: 3500
    });

    // ═══════════════════════════════════════════════════
    // 2. MYKA (https://myka.ng) — WEB & MOBILE
    // ═══════════════════════════════════════════════════
    console.log('\n--- CAPTURING MYKA (WEB) ---');
    await captureUrl({
      send,
      url: 'https://myka.ng/',
      outPath: path.join(outDir, 'myka-hero.png'),
      jpegPath: path.join(outDir, 'project-myka.jpg'),
      waitFor: 4500
    });

    await captureUrl({
      send,
      url: 'https://myka.ng/about',
      outPath: path.join(outDir, 'myka-about.png'),
      waitFor: 4000
    });

    await captureUrl({
      send,
      url: 'https://myka.ng/corporate',
      outPath: path.join(outDir, 'myka-corporate.png'),
      waitFor: 4000
    });

    console.log('\n--- CAPTURING MYKA (MOBILE) ---');
    await captureUrl({
      send,
      url: 'https://myka.ng/',
      outPath: path.join(outDir, 'myka-mobile-hero.png'),
      width: 390,
      height: 844,
      scale: 3,
      isMobile: true,
      waitFor: 4000
    });

    await captureUrl({
      send,
      url: 'https://myka.ng/about',
      outPath: path.join(outDir, 'myka-mobile-about.png'),
      width: 390,
      height: 844,
      scale: 3,
      isMobile: true,
      waitFor: 4000
    });

    await captureUrl({
      send,
      url: 'https://myka.ng/corporate',
      outPath: path.join(outDir, 'myka-mobile-corporate.png'),
      width: 390,
      height: 844,
      scale: 3,
      isMobile: true,
      waitFor: 4000
    });

    // ═══════════════════════════════════════════════════
    // 3. VERONICA ANTHONY FOUNDATION (veronicaanthonyfoundation.org)
    // ═══════════════════════════════════════════════════
    console.log('\n--- CAPTURING VERONICA ANTHONY FOUNDATION ---');
    await captureUrl({
      send,
      url: 'https://veronicaanthonyfoundation.org/',
      outPath: path.join(outDir, 'vaf-hero.png'),
      jpegPath: path.join(outDir, 'project-vaf.jpg'),
      width: 1440,
      height: 900,
      scale: 2,
      isMobile: false,
      waitFor: 4500
    });

    await captureUrl({
      send,
      url: 'https://veronicaanthonyfoundation.org/',
      outPath: path.join(outDir, 'vaf-programs.png'),
      width: 1440,
      height: 900,
      scale: 2,
      isMobile: false,
      scrollY: 900,
      waitFor: 3000
    });

    await captureUrl({
      send,
      url: 'https://veronicaanthonyfoundation.org/',
      outPath: path.join(outDir, 'vaf-impact.png'),
      width: 1440,
      height: 900,
      scale: 2,
      isMobile: false,
      scrollY: 1850,
      waitFor: 3000
    });

    await captureUrl({
      send,
      url: 'https://veronicaanthonyfoundation.org/',
      outPath: path.join(outDir, 'vaf-events.png'),
      width: 1440,
      height: 900,
      scale: 2,
      isMobile: false,
      scrollY: 2800,
      waitFor: 3000
    });

    console.log('\nALL 3 PROJECTS CAPTURED SUCCESSFULLY!');
    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
