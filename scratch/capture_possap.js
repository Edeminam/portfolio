const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    // Create new tab with target URL
    const res = await fetch('http://127.0.0.1:9222/json/new?https://possap.gov.ng', { method: 'PUT' });
    const target = await res.json();
    console.log('Opened target:', target.webSocketDebuggerUrl);

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

    console.log('Waiting for page load and rendering...');
    await sleep(4000);

    // Remove terms modal and hide scrollbars
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('#termsModal')?.remove();
        document.querySelector('.terms-modal')?.remove();
        document.body.style.overflow = 'hidden';
      `
    });

    await sleep(500);

    // 1. Capture Hero Viewport (1440x900)
    console.log('Capturing hero screenshot...');
    const heroScreenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-hero.jpg'),
      Buffer.from(heroScreenshot.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-hero.jpg');

    // Scroll to "How Does It Work" and Services section
    await send('Runtime.evaluate', {
      expression: `
        window.scrollTo(0, 650);
      `
    });
    await sleep(1000);

    console.log('Capturing services section...');
    const servicesScreenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-services.jpg'),
      Buffer.from(servicesScreenshot.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-services.jpg');

    // Scroll back to top
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await sleep(500);

    // Capture Full Page
    console.log('Capturing full page screenshot...');
    const layoutMetrics = await send('Page.getLayoutMetrics');
    const height = Math.min(layoutMetrics.contentSize.height, 4000);

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(1000);

    const fullScreenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 88,
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: height,
        scale: 1
      }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-landing.jpg'),
      Buffer.from(fullScreenshot.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-landing.jpg');

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chromeProcess.kill();
    console.log('Chrome process exited.');
  }
}

run();
