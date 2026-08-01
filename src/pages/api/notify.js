export const prerender = false;

export async function POST({ request }) {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json().catch(() => ({}));
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'Message content is required' }), { status: 400, headers });
    }

    const topic = import.meta.env.NTFY_TOPIC || 'my-site-alerts-98x21q';

    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: message.trim(),
      headers: {
        'Title': 'New Custom Website Alert',
        'Priority': 'high',
        'Tags': 'bell,incoming_letter'
      }
    });

    if (response.ok) {
      console.log('✅ Notification sent successfully to ntfy');
      return new Response(JSON.stringify({ success: true, message: 'Notification sent successfully' }), { status: 200, headers });
    } else {
      throw new Error(`ntfy returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send notification via ntfy:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), { status: 500, headers });
  }
}
