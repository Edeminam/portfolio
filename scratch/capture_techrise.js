const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const res = await fetch('http://127.0.0.1:9234/json/new?https://techrisedti.org', { method: 'PUT' });
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

    console.log('Waiting for page load and assets...');
    await sleep(5000);

    // 1. Capture Hero Section
    console.log('Capturing TechRise Hero (1440x850)...');
    const heroShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-hero.png'),
      Buffer.from(heroShot.data, 'base64')
    );
    // Also save as project-techrise.jpg for backward compatibility / thumbnails
    const heroJpg = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/project-techrise.jpg'),
      Buffer.from(heroJpg.data, 'base64')
    );
    console.log('Saved techrise-hero.png and updated project-techrise.jpg');

    // 2. Locate and Capture "Start A Skill (SAS)" section
    const sasCoords = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = Array.from(document.querySelectorAll('h2, section, div')).find(e => e.innerText && e.innerText.includes('Start A') && e.innerText.includes('Skill'));
        if (el) {
          const r = el.closest('section') || el.parentElement;
          const rect = r.getBoundingClientRect();
          return { top: Math.round(rect.top + window.scrollY) };
        }
        return { top: 900 };
      })()`
    });
    const sasTop = sasCoords.result.value ? sasCoords.result.value.top : 900;
    console.log('Scrolling to SAS section at', sasTop);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${sasTop});` });
    await sleep(1200);

    const programsShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: sasTop, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-programs.png'),
      Buffer.from(programsShot.data, 'base64')
    );
    console.log('Saved techrise-programs.png');

    // 3. Locate and Capture "Driven by Purpose. Built for Africa." (Mission & Vision)
    const missionCoords = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('mission') || document.getElementById('about') || Array.from(document.querySelectorAll('h2')).find(e => e.innerText && e.innerText.includes('Driven by Purpose'));
        if (el) {
          const r = el.closest('section') || el.parentElement;
          const rect = r.getBoundingClientRect();
          return { top: Math.round(rect.top + window.scrollY) };
        }
        return { top: 1800 };
      })()`
    });
    const missionTop = missionCoords.result.value ? missionCoords.result.value.top : 1800;
    console.log('Scrolling to Mission section at', missionTop);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${missionTop});` });
    await sleep(1200);

    const missionShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: missionTop, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-mission.png'),
      Buffer.from(missionShot.data, 'base64')
    );
    console.log('Saved techrise-mission.png');

    // 4. Locate and Capture Community Stories / Testimonials
    const storiesCoords = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('stories') || Array.from(document.querySelectorAll('h2')).find(e => e.innerText && e.innerText.includes('community'));
        if (el) {
          const r = el.closest('section') || el.parentElement;
          const rect = r.getBoundingClientRect();
          return { top: Math.round(rect.top + window.scrollY) };
        }
        return { top: 3200 };
      })()`
    });
    const storiesTop = storiesCoords.result.value ? storiesCoords.result.value.top : 3200;
    console.log('Scrolling to Stories section at', storiesTop);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${storiesTop});` });
    await sleep(1200);

    const communityShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: storiesTop, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-community.png'),
      Buffer.from(communityShot.data, 'base64')
    );
    console.log('Saved techrise-community.png');

    // 5. Navigate to Scholarships page and capture
    console.log('Navigating to scholarships page...');
    await send('Page.navigate', { url: 'https://techrisedti.org/scholarships.html' });
    await sleep(4000);

    const scholarshipsShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-scholarships.png'),
      Buffer.from(scholarshipsShot.data, 'base64')
    );
    console.log('Saved techrise-scholarships.png');

    ws.close();
  } catch (err) {
    console.error('Error during TechRise capture:', err);
  } finally {
    chromeProcess.kill();
    console.log('Finished TechRise capture.');
  }
}

run();
