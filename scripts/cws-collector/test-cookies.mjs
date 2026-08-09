import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const envCookie = process.env.CWS_COOKIE.replace(/^["']|["']$/g, '');
const allCookies = envCookie.split(';').map(c => c.trim()).filter(c=>c);
const allNames = allCookies.map(c => c.split('=')[0]);

async function testCookies(namesToKeep) {
  const cookieStr = allCookies.filter(c => namesToKeep.includes(c.split('=')[0])).join('; ');
  const res = await fetch('https://chrome.google.com/webstore/devconsole', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Cookie': cookieStr
    }
  });
  if (res.url.includes('accounts.google.com')) {
    return false;
  }
  return true;
}

(async () => {
  const base = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', '__Secure-1PSID', '__Secure-3PSID', '__Secure-1PAPISID', '__Secure-3PAPISID', 'OSID', '__Secure-OSID', 'AEC'];
  console.log('Base 12:', await testCookies(base));
  console.log('Base + S:', await testCookies([...base, 'S']));
  console.log('Base + __Secure-STRP:', await testCookies([...base, '__Secure-STRP']));
  console.log('Base + NID:', await testCookies([...base, 'NID']));
  console.log('Base + SIDTS:', await testCookies([...base, '__Secure-1PSIDTS', '__Secure-3PSIDTS']));
  console.log('Base + SIDTS + OSID:', await testCookies([...base, '__Secure-1PSIDTS', '__Secure-3PSIDTS', 'OSID', '__Secure-OSID']));
})();
