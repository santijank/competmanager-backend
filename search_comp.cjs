const fs = require('fs');
const https = require('https');

const token = '5102|I9qEarUgMPOPfuUAiiTAOnRjVRyOpYac7E7sdVOW43d9785d';
const baseUrl = 'https://competmanager-backend-production.up.railway.app/api';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  // Fetch all pages of group 6 competitions
  let allComps = [];
  for (let page = 1; page <= 10; page++) {
    const result = await fetch(`${baseUrl}/competitions?school_group_id=6&per_page=100&page=${page}`);
    if (!result.data || result.data.length === 0) break;
    allComps = allComps.concat(result.data);
    console.log(`Page ${page}: ${result.data.length} items (total so far: ${allComps.length})`);
    if (result.data.length < 100) break;
  }

  console.log(`\nTotal competitions in group 6: ${allComps.length}`);

  // Search for CAREER (not SOFTPOWER)
  const career = allComps.filter(c => c.code && c.code.includes('CAREER') && !c.code.includes('SOFTPOWER'));
  console.log(`\nCAREER competitions (excluding SOFTPOWER): ${career.length}`);
  career.forEach(c => console.log(`  ${c.id} | ${c.code} | ${c.name}`));

  // Search for วัสดุธรรมชาติ or ของใช้จาก
  const natural = allComps.filter(c => c.name && (c.name.includes('วัสดุธรรมชาติ') || c.name.includes('ของใช้จากวัสดุ')));
  console.log(`\nNatural material competitions: ${natural.length}`);
  natural.forEach(c => console.log(`  ${c.id} | ${c.code} | ${c.name}`));

  // Search for anything with ป.4-6 in CAREER category
  const p46 = allComps.filter(c => c.name && c.name.includes('ป.4-6') && c.code && c.code.includes('CAREER'));
  console.log(`\nCAREER ป.4-6 competitions: ${p46.length}`);
  p46.forEach(c => console.log(`  ${c.id} | ${c.code} | ${c.name}`));

  // Also check all with "การงาน" in category
  const career2 = allComps.filter(c => c.code && c.code.startsWith('CAREER_'));
  console.log(`\nCompetitions with code starting CAREER_: ${career2.length}`);
  career2.forEach(c => console.log(`  ${c.id} | ${c.code} | ${c.name}`));
}

main().catch(console.error);
