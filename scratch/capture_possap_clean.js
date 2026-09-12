const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const res = await fetch('http://127.0.0.1:9224/json/new?https://possap.gov.ng', { method: 'PUT' });
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

    console.log('Waiting 5s for page and carousel to fully load...');
    await sleep(5000);

    // Click cookie consent button and remove modals/overlays cleanly
    const cleaned = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Remove cookie bar or click OK
          const okBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === 'Ok');
          okBtns.forEach(b => b.click());

          // Clean up any remaining cookie banner or modals
          const banners = document.querySelectorAll('.cookie-consent, #cookieConsent, .cookie-banner, .alert-cookie, .cc-window, [aria-label*="cookie" i]');
          banners.forEach(b => b.remove());

          // If there is any fixed container at bottom with text including Terms of Use
          Array.from(document.querySelectorAll('div')).forEach(el => {
            const style = window.getComputedStyle(el);
            if ((style.position === 'fixed' || style.position === 'sticky') && (style.bottom === '0px' || parseInt(style.bottom) < 50)) {
              if (el.innerText && el.innerText.includes('Terms of Use')) {
                el.remove();
              }
            }
          });

          // Ensure termsModal is removed
          document.querySelector('#termsModal')?.remove();
          document.querySelector('.terms-modal')?.remove();
          document.querySelector('.modal-backdrop')?.remove();
          document.body.classList.remove('modal-open');
          document.body.style.overflow = 'hidden';

          return true;
        })()
      `
    });
    console.log('Cleaned DOM elements:', cleaned);
    await sleep(1000);

    // 1. Capture Hero Viewport (1440x850 or 1440x900)
    console.log('Capturing clean hero screenshot (PNG)...');
    const heroScreenshot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 850,
        scale: 1
      }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-hero.png'),
      Buffer.from(heroScreenshot.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-hero.png');

    // Also save JPG version
    const heroJpg = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 850,
        scale: 1
      }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-hero.jpg'),
      Buffer.from(heroJpg.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-hero.jpg');

    // 2. Scroll to Services / How it Works section and capture
    console.log('Capturing services / how it works section...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 700);` });
    await sleep(1200);

    const servicesScreenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 850,
        scale: 1
      }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-services.jpg'),
      Buffer.from(servicesScreenshot.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-services.jpg');

    // 3. Scroll down further to see Service categories or verification
    console.log('Capturing service categories section...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 1500);` });
    await sleep(1200);

    const categoriesScreenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 850,
        scale: 1
      }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/possap-website-portal.jpg'),
      Buffer.from(categoriesScreenshot.data, 'base64')
    );
    console.log('Saved assets/images/possap-website-portal.jpg');

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chromeProcess.kill();
    console.log('Done.');
  }
}

run();
