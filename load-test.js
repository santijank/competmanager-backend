/**
 * Load Test Script - CompetManager
 * จำลอง 200 users เข้าใช้งานพร้อมกัน
 *
 * วิธีใช้: node load-test.js
 */

const BASE_URL = 'https://competmanager-backend-production.up.railway.app';

// Endpoints ที่ users จะเรียกใช้ (จำลองการใช้งานจริง)
const PUBLIC_ENDPOINTS = [
    { path: '/api/public/dashboard/overview', name: 'Dashboard Overview' },
    { path: '/api/public/dashboard/groups', name: 'Dashboard Groups' },
    { path: '/api/results/public', name: 'Results Public' },
    { path: '/api/schedules/public', name: 'Schedules Public' },
    { path: '/api/announcements/public?active_only=true&limit=50', name: 'Announcements' },
    { path: '/api/public/competitions', name: 'Competitions List' },
];

const AUTH_ENDPOINTS = [
    { path: '/api/online-users', name: 'Online Users' },
    { path: '/api/health', name: 'Health Check' },
];

// สถิติ
const stats = {
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: 0,
    errors: {},
    endpointStats: {},
    statusCodes: {},
};

function updateEndpointStats(name, time, success, statusCode) {
    if (!stats.endpointStats[name]) {
        stats.endpointStats[name] = {
            count: 0, success: 0, failed: 0,
            totalTime: 0, minTime: Infinity, maxTime: 0,
        };
    }
    const ep = stats.endpointStats[name];
    ep.count++;
    ep.totalTime += time;
    if (time < ep.minTime) ep.minTime = time;
    if (time > ep.maxTime) ep.maxTime = time;
    if (success) ep.success++;
    else ep.failed++;

    stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;
}

async function makeRequest(url, name) {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeout);

        const elapsed = Date.now() - start;

        stats.totalRequests++;
        stats.totalTime += elapsed;
        if (elapsed < stats.minTime) stats.minTime = elapsed;
        if (elapsed > stats.maxTime) stats.maxTime = elapsed;

        if (response.ok) {
            stats.successRequests++;
            updateEndpointStats(name, elapsed, true, response.status);
        } else {
            stats.failedRequests++;
            updateEndpointStats(name, elapsed, false, response.status);
            const errKey = `${response.status} ${name}`;
            stats.errors[errKey] = (stats.errors[errKey] || 0) + 1;
        }

        return { success: response.ok, time: elapsed, status: response.status };
    } catch (err) {
        const elapsed = Date.now() - start;
        stats.totalRequests++;
        stats.failedRequests++;
        stats.totalTime += elapsed;

        const errKey = err.name === 'AbortError' ? `TIMEOUT ${name}` : `${err.code || err.message} ${name}`;
        stats.errors[errKey] = (stats.errors[errKey] || 0) + 1;
        updateEndpointStats(name, elapsed, false, 'ERR');

        return { success: false, time: elapsed, error: err.message };
    }
}

// จำลอง user 1 คน เข้าหน้าแรก (public)
async function simulatePublicUser(userId) {
    // User เข้าหน้าแรก → เรียก 4-5 endpoints พร้อมกัน
    const endpoints = PUBLIC_ENDPOINTS.slice(0, 4 + Math.floor(Math.random() * 2));
    const promises = endpoints.map(ep =>
        makeRequest(`${BASE_URL}${ep.path}`, ep.name)
    );
    return Promise.all(promises);
}

// จำลอง user 1 คน ที่ login แล้ว (auth)
async function simulateAuthUser(userId) {
    // User login → เรียก online-users + dashboard
    const endpoints = [
        ...AUTH_ENDPOINTS,
        PUBLIC_ENDPOINTS[0], // dashboard overview
        PUBLIC_ENDPOINTS[1], // dashboard groups
    ];
    const promises = endpoints.map(ep =>
        makeRequest(`${BASE_URL}${ep.path}`, ep.name)
    );
    return Promise.all(promises);
}

function printProgress(current, total, startTime) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = Math.round((current / total) * 100);
    process.stdout.write(`\r  [${'\u2588'.repeat(Math.floor(pct / 5))}${'\u2591'.repeat(20 - Math.floor(pct / 5))}] ${pct}% (${current}/${total} users) ${elapsed}s`);
}

function printReport(testName, duration) {
    const avgTime = stats.totalRequests > 0 ? (stats.totalTime / stats.totalRequests).toFixed(0) : 0;
    const rps = (stats.totalRequests / (duration / 1000)).toFixed(1);

    console.log('\n');
    console.log('='.repeat(70));
    console.log(`  LOAD TEST REPORT: ${testName}`);
    console.log('='.repeat(70));
    console.log(`  Duration:          ${(duration / 1000).toFixed(1)}s`);
    console.log(`  Total Requests:    ${stats.totalRequests}`);
    console.log(`  Requests/sec:      ${rps}`);
    console.log(`  Success:           ${stats.successRequests} (${(stats.successRequests / stats.totalRequests * 100).toFixed(1)}%)`);
    console.log(`  Failed:            ${stats.failedRequests} (${(stats.failedRequests / stats.totalRequests * 100).toFixed(1)}%)`);
    console.log('-'.repeat(70));
    console.log('  Response Times:');
    console.log(`    Min:             ${stats.minTime}ms`);
    console.log(`    Avg:             ${avgTime}ms`);
    console.log(`    Max:             ${stats.maxTime}ms`);
    console.log('-'.repeat(70));
    console.log('  Status Codes:');
    Object.entries(stats.statusCodes).sort().forEach(([code, count]) => {
        console.log(`    ${code}:             ${count}`);
    });

    console.log('-'.repeat(70));
    console.log('  Endpoint Performance:');
    console.log(`  ${'Endpoint'.padEnd(25)} ${'Req'.padStart(5)} ${'OK'.padStart(5)} ${'Fail'.padStart(5)} ${'Avg(ms)'.padStart(8)} ${'Max(ms)'.padStart(8)}`);
    Object.entries(stats.endpointStats)
        .sort((a, b) => b[1].totalTime / b[1].count - a[1].totalTime / a[1].count)
        .forEach(([name, ep]) => {
            const avg = (ep.totalTime / ep.count).toFixed(0);
            console.log(`  ${name.padEnd(25)} ${String(ep.count).padStart(5)} ${String(ep.success).padStart(5)} ${String(ep.failed).padStart(5)} ${String(avg).padStart(8)} ${String(ep.maxTime).padStart(8)}`);
        });

    if (Object.keys(stats.errors).length > 0) {
        console.log('-'.repeat(70));
        console.log('  Errors:');
        Object.entries(stats.errors).sort((a, b) => b[1] - a[1]).forEach(([err, count]) => {
            console.log(`    ${err}: ${count}`);
        });
    }

    console.log('='.repeat(70));

    // Verdict
    const successRate = (stats.successRequests / stats.totalRequests * 100);
    const avgMs = parseInt(avgTime);
    console.log('\n  VERDICT:');
    if (successRate >= 99 && avgMs < 2000) {
        console.log('  \u2705 PASS - ระบบรองรับ 200 users ได้ดี');
    } else if (successRate >= 95 && avgMs < 5000) {
        console.log('  \u26a0\ufe0f  WARNING - ระบบรองรับได้แต่มีความช้าบ้าง');
    } else {
        console.log('  \u274c FAIL - ระบบมีปัญหาในการรองรับ 200 users');
    }
    console.log(`     Success Rate: ${successRate.toFixed(1)}% | Avg Response: ${avgMs}ms | RPS: ${rps}`);
    console.log('');
}

async function runLoadTest() {
    const TOTAL_USERS = 200;
    const BATCH_SIZE = 20; // ส่งทีละ 20 users (ป้องกัน connection limit)
    const BATCHES = TOTAL_USERS / BATCH_SIZE;

    console.log('');
    console.log('='.repeat(70));
    console.log('  CompetManager Load Test');
    console.log('='.repeat(70));
    console.log(`  Target:    ${BASE_URL}`);
    console.log(`  Users:     ${TOTAL_USERS} concurrent users`);
    console.log(`  Batch:     ${BATCH_SIZE} users/batch x ${BATCHES} batches`);
    console.log(`  Endpoints: ${PUBLIC_ENDPOINTS.length + AUTH_ENDPOINTS.length} endpoints`);
    console.log('='.repeat(70));

    // Warmup
    console.log('\n  Phase 1: Warmup (5 requests)...');
    for (let i = 0; i < 5; i++) {
        await makeRequest(`${BASE_URL}/api/health`, 'Health Check');
    }
    // Reset stats after warmup
    Object.assign(stats, {
        totalRequests: 0, successRequests: 0, failedRequests: 0,
        totalTime: 0, minTime: Infinity, maxTime: 0,
        errors: {}, endpointStats: {}, statusCodes: {},
    });

    console.log('  Phase 2: Load Test (200 users)...');
    const startTime = Date.now();
    let completedUsers = 0;

    for (let batch = 0; batch < BATCHES; batch++) {
        const promises = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            const userId = batch * BATCH_SIZE + i + 1;
            // 70% public users, 30% auth users
            if (Math.random() < 0.7) {
                promises.push(simulatePublicUser(userId));
            } else {
                promises.push(simulateAuthUser(userId));
            }
        }

        await Promise.all(promises);
        completedUsers += BATCH_SIZE;
        printProgress(completedUsers, TOTAL_USERS, startTime);

        // เว้น 500ms ระหว่าง batch (จำลองการมาถึงแบบ staggered)
        if (batch < BATCHES - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    const duration = Date.now() - startTime;
    printReport('200 Concurrent Users', duration);
}

// Run
runLoadTest().catch(console.error);
