const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9237',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let res, target;
  for (let i = 0; i < 10; i++) {
    await sleep(800);
    try {
      res = await fetch('http://127.0.0.1:9237/json/new?https://techrisedti.org', { method: 'PUT' });
      if (res.ok) {
        target = await res.json();
        break;
      }
    } catch (e) {}
  }
  if (!target) throw new Error('Could not connect to Chrome debugging port');
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

    await new Promise(resolve => {
      const l = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', l);
          resolve();
        }
      };
      ws.addEventListener('message', l);
      setTimeout(resolve, 8000);
    });

    await sleep(2500);

    // Prepare page: remove loader & reveal all elements
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('page-loader')?.remove();
        document.body.classList.remove('loading');
        document.getElementById('cursor')?.remove();
        document.getElementById('cursor-follower')?.remove();

        document.querySelectorAll('.reveal-up').forEach(el => {
          el.classList.add('visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        document.querySelectorAll('.blur-word').forEach(el => {
          el.classList.add('revealed');
          el.style.filter = 'none';
          el.style.opacity = '1';
        });
      })()`
    });

    await sleep(1000);

    // 1. Capture Hero (1440x850)
    console.log('Capturing techrise-hero.png...');
    const heroShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-hero.png'),
      Buffer.from(heroShot.data, 'base64')
    );
    // Also save project-techrise.jpg
    const heroJpg = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/project-techrise.jpg'),
      Buffer.from(heroJpg.data, 'base64')
    );
    console.log('Saved techrise-hero.png and project-techrise.jpg');

    // 2. Locate Start A Skill (SAS)
    const sasInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(e => e.innerText && e.innerText.includes('Start A'));
        const sec = h2 ? (h2.closest('section') || h2.parentElement) : null;
        if (sec) {
          const r = sec.getBoundingClientRect();
          return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
        }
        return { top: 920, height: 850 };
      })()`,
      returnByValue: true
    });
    const sasTop = (sasInfo.result && sasInfo.result.value && sasInfo.result.value.top) || 920;
    console.log('Scrolling to SAS at', sasTop);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${sasTop});` });
    await sleep(1200);
    // Re-trigger reveal on scrolled section
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelectorAll('.reveal-up').forEach(el => {
          el.classList.add('visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      })()`
    });
    await sleep(500);

    const programsShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: sasTop, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-programs.png'),
      Buffer.from(programsShot.data, 'base64')
    );
    console.log('Saved techrise-programs.png');

    // 3. Locate Mission & Vision ("Driven by Purpose")
    const missionInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(e => e.innerText && e.innerText.includes('Driven by Purpose'));
        const sec = h2 ? (h2.closest('section') || h2.parentElement) : null;
        if (sec) {
          const r = sec.getBoundingClientRect();
          return { top: Math.round(r.top + window.scrollY) };
        }
        return { top: 2200 };
      })()`,
      returnByValue: true
    });
    const missionTop = (missionInfo.result && missionInfo.result.value && missionInfo.result.value.top) || 2200;
    console.log('Scrolling to Mission at', missionTop);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${missionTop});` });
    await sleep(1200);
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelectorAll('.reveal-up').forEach(el => {
          el.classList.add('visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      })()`
    });
    await sleep(500);

    const missionShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: missionTop, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-mission.png'),
      Buffer.from(missionShot.data, 'base64')
    );
    console.log('Saved techrise-mission.png');

    // 4. Locate Community Stories ("From our community")
    const storiesInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(e => e.innerText && e.innerText.includes('community'));
        const sec = h2 ? (h2.closest('section') || h2.parentElement) : null;
        if (sec) {
          const r = sec.getBoundingClientRect();
          return { top: Math.round(r.top + window.scrollY) };
        }
        return { top: 3800 };
      })()`,
      returnByValue: true
    });
    const storiesTop = (storiesInfo.result && storiesInfo.result.value && storiesInfo.result.value.top) || 3800;
    console.log('Scrolling to Stories at', storiesTop);
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${storiesTop});` });
    await sleep(1200);
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelectorAll('.reveal-up').forEach(el => {
          el.classList.add('visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      })()`
    });
    await sleep(500);

    const communityShot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: storiesTop, width: 1440, height: 850, scale: 1 }
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../assets/images/techrise-community.png'),
      Buffer.from(communityShot.data, 'base64')
    );
    console.log('Saved techrise-community.png');

    // 5. Navigate to Scholarships page
    console.log('Navigating to scholarships.html...');
    await send('Page.navigate', { url: 'https://techrisedti.org/scholarships.html' });
    await sleep(3500);

    await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('page-loader')?.remove();
        document.body.classList.remove('loading');
        document.getElementById('cursor')?.remove();
        document.getElementById('cursor-follower')?.remove();

        document.querySelectorAll('.reveal-up').forEach(el => {
          el.classList.add('visible');
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      })()`
    });
    await sleep(1000);

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
    console.log('Done.');
  }
}

run();
