import type { CDPSession } from '@playwright/test';
/** Inspect only the owned local worker. Protocol failure cannot become a zero sample. */
export async function mapWorkerHeap(session: CDPSession): Promise<number> {
  const result = await session.send('Target.getTargets');
  const workers = result.targetInfos.filter(
    (t: { type: string; url: string }) =>
      t.type === 'worker' && t.url.includes('/assets/maplibre-gl-worker-'),
  );
  if (workers.length !== 1) throw new Error('Expected one owned map worker');
  const attached = await session.send('Target.attachToTarget', {
    targetId:
      workers.at(0)?.targetId ??
      (() => {
        throw new Error('Worker target unavailable');
      })(),
    flatten: false,
  });
  try {
    return await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => {
        session.off('Target.receivedMessageFromTarget', receive);
        reject(new Error('Worker heap measurement timed out'));
      }, 5000);
      const receive = (event: { sessionId: string; message: string }) => {
        if (event.sessionId !== attached.sessionId) return;
        const response = JSON.parse(event.message);
        if (response.id !== 741) return;
        clearTimeout(timer);
        session.off('Target.receivedMessageFromTarget', receive);
        const bytes = response.result?.usedSize;
        if (!Number.isFinite(bytes) || bytes <= 0)
          reject(new Error('Worker heap measurement unavailable'));
        else resolve(bytes);
      };
      session.on('Target.receivedMessageFromTarget', receive);
      void session
        .send('Target.sendMessageToTarget', {
          sessionId: attached.sessionId,
          message: JSON.stringify({ id: 741, method: 'Runtime.getHeapUsage' }),
        })
        .catch(() => {
          clearTimeout(timer);
          session.off('Target.receivedMessageFromTarget', receive);
          reject(new Error('Worker heap measurement unavailable'));
        });
    });
  } finally {
    await session.send('Target.detachFromTarget', {
      sessionId: attached.sessionId,
    });
  }
}
export async function mapWorkerCount(session: CDPSession): Promise<number> {
  const targets = await session.send('Target.getTargets');
  return targets.targetInfos.filter((t: { type: string }) =>
    ['worker', 'shared_worker', 'service_worker'].includes(t.type),
  ).length;
}
