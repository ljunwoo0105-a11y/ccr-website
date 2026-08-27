/** Tiny static server (with Range support) for verifying the rendered promo video. */
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const VIEWER = `<!doctype html>
<html>
<head><title>CCR Promo Check</title></head>
<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh">
<video id="v" src="/out/ccr-promo.mp4" style="max-width:100%;max-height:100%" controls preload="auto"></video>
</body>
</html>`;

const MIME: Record<string, string> = {
  mp4: 'video/mp4',
  wav: 'audio/wav',
  html: 'text/html',
};

Bun.serve({
  hostname: '127.0.0.1',
  port: 7399,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/viewer') {
      return new Response(VIEWER, {headers: {'content-type': 'text/html'}});
    }
    if (req.method === 'POST' && url.pathname === '/frame') {
      const name = (url.searchParams.get('name') ?? 'frame').replace(/[^\w-]/g, '');
      const dataUrl = await req.text();
      const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      await Bun.write(`${ROOT}out/frames/${name}.png`, Buffer.from(b64, 'base64'));
      return new Response('ok');
    }
    const file = Bun.file(ROOT + url.pathname.slice(1));
    if (!(await file.exists())) {
      return new Response('not found', {status: 404});
    }
    const ext = url.pathname.split('.').pop() ?? '';
    const type = MIME[ext] ?? 'application/octet-stream';
    const size = file.size;
    const range = req.headers.get('range');
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]);
        const end = m[2] ? Number(m[2]) : size - 1;
        return new Response(file.slice(start, end + 1), {
          status: 206,
          headers: {
            'content-type': type,
            'content-range': `bytes ${start}-${end}/${size}`,
            'accept-ranges': 'bytes',
            'content-length': String(end - start + 1),
          },
        });
      }
    }
    return new Response(file, {
      headers: {'content-type': type, 'accept-ranges': 'bytes', 'content-length': String(size)},
    });
  },
});

console.log('serving on http://localhost:7399');
