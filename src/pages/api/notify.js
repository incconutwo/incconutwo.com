import { cache } from '../../utils/apiCache.js';

export const prerender = false;

export async function POST({ request }) {
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // 1. Rate-Limit Protection: Limit phone notifications to 1 every 30 seconds globally
    const lastNotifyTime = cache.get('last_ntfy_sent');
    if (lastNotifyTime) {
      return new Response(JSON.stringify({ 
        error: 'A notification was recently sent. Please wait 30 seconds before sending another.' 
      }), { status: 429, headers });
    }

    const body = await request.json().catch(() => ({}));
    let { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'Message content is required' }), { status: 400, headers });
    }

    // 2. Sanitize & Truncate message length to 500 characters max
    message = message.trim().slice(0, 500);

    const topic = import.meta.env.NTFY_TOPIC || 'my-site-alerts-98x21q';

    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': 'New Custom Website Alert',
        'Priority': 'high',
        'Tags': 'bell,incoming_letter'
      }
    });

    if (response.ok) {
      // Set 30-second rate-limit cooldown
      cache.set('last_ntfy_sent', Date.now(), 30);
      return new Response(JSON.stringify({ success: true, message: 'Notification sent successfully' }), { status: 200, headers });
    } else {
      throw new Error(`ntfy returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send notification via ntfy:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), { status: 500, headers });
  }
}
