export async function sendRealtimeBroadcast(
  supabaseUrl: string,
  serviceRoleKey: string,
  topic: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const url = `${supabaseUrl.replace(/\/$/, '')}/realtime/v1/api/broadcast`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic,
            event,
            payload,
            private: false,
          },
        ],
      }),
    });

    if (!res.ok && res.status !== 202) {
      const text = await res.text().catch(() => '');
      console.error(
        `[realtime-broadcast] ${res.status} on topic="${topic}" event="${event}": ${text}`,
      );
    }
  } catch (err) {
    console.error(
      `[realtime-broadcast] failed on topic="${topic}" event="${event}":`,
      err,
    );
  }
}
