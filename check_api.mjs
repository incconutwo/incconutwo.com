import fetch from 'node-fetch'; // Wait, native fetch is in node 18+

async function check() {
  try {
    const res = await fetch('http://localhost:4321/api/lichess/stats');
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", text);
  } catch (e) {
    console.error("FETCH ERROR:", e);
  }
}
check();
