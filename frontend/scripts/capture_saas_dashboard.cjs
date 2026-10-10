const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173/signin...');
  await page.goto('http://localhost:5173/signin', { waitUntil: 'networkidle2' });

  // Click on "Super Admin" demo card
  console.log('Finding Super Admin demo card...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Super Admin'));
    if (btn) btn.click();
  });

  console.log('Waiting for SaaS dashboard navigation & toast auto-dismiss...');
  await new Promise(r => setTimeout(r, 5500));

  const currentUrl = page.url();
  console.log('Current URL is:', currentUrl);

  const outputPath = path.resolve(__dirname, '../public/saas-admin-dashboard.png');
  console.log('Capturing screenshot to:', outputPath);
  await page.screenshot({ path: outputPath, fullPage: false });

  console.log('Screenshot successfully captured at:', outputPath);
  await browser.close();
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
