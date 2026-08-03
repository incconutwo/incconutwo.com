export const prerender = false;

export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600'
  };

  return new Response(JSON.stringify({ disabled: true, hr: 0, ts: 0 }), { status: 200, headers });
}
