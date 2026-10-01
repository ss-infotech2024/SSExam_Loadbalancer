// It creates a test student (if missing), then makes N logins at the same time.

const USERS = Number(process.argv[2]) || 60;
const BASE = process.argv[3] || "http://localhost:5000";

const email = "loadtest@test.com";
const password = "Test@1234";

async function main() {
  console.log(`Server: ${BASE}`);

  // 1. Check server is running
  try {
    await fetch(BASE + "/");
  } catch {
    console.log("\nCannot reach the server. Start it first with: npm start");
    process.exit(1);
  }

  // 2. Create test student (ignore error if it already exists)
  const reg = await fetch(BASE + "/api/auth/student/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Load Test",
      email,
      password,
      department: "MCA",
    }),
  });
  if (reg.status === 201 || reg.status === 200) {
    console.log("Test student created.");
  } else {
    const msg = await reg.json().catch(() => ({}));
    console.log(`Register response (${reg.status}): ${msg.message || ""}`);
  }

  // 3. One normal login first, to make sure the account works
  const check = await fetch(BASE + "/api/auth/student/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (check.status !== 200) {
    console.log(`\nSingle login failed (status ${check.status}). Fix this before load testing.`);
    process.exit(1);
  }
  console.log("Single login works.\n");

  // 4. Fire all logins at the same moment
  console.log(`Sending ${USERS} logins at the same time...`);
  const start = Date.now();

  const results = await Promise.all(
    Array.from({ length: USERS }, async () => {
      const t = Date.now();
      try {
        const res = await fetch(BASE + "/api/auth/student/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(30000),
        });
        return { ok: res.status === 200, status: res.status, ms: Date.now() - t };
      } catch (e) {
        return { ok: false, status: "error/timeout", ms: Date.now() - t };
      }
    })
  );

  const total = Date.now() - start;
  const success = results.filter((r) => r.ok).length;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const slowest = times[times.length - 1];

  console.log("\n========== RESULT ==========");
  console.log(`Students logging in at once : ${USERS}`);
  console.log(`Successful logins           : ${success}`);
  console.log(`Failed logins               : ${USERS - success}`);
  console.log(`Average wait                : ${(avg / 1000).toFixed(1)} seconds`);
  console.log(`Slowest wait                : ${(slowest / 1000).toFixed(1)} seconds`);
  console.log(`Total time for everyone     : ${(total / 1000).toFixed(1)} seconds`);
  console.log("============================");

  if (success < USERS) {
    console.log("RESULT: FAIL - some students could not log in.");
  } else if (slowest > 10000) {
    console.log("RESULT: WORKS BUT SLOW - some students waited more than 10 seconds.");
  } else {
    console.log("RESULT: PASS - all students logged in quickly.");
  }
}

main();
