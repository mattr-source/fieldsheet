// POST /api/generate-clip
//
// Kicks off a "walkthrough clip" job for one listing.
//
// TODAY: this is fully mocked — no video model is called. The response shape
// (jobId + shots[] + estimatedSeconds) is the real contract though, so
// swapping in a real provider later (Runway, Luma, Kling — see project notes)
// means rewriting the body of THIS function only. Nothing on the client
// (fieldsheet.html) needs to change.
//
// LATER: this handler would call the provider's image-to-video API once per
// shot (sending the room photo + a motion prompt derived from `motion`
// below), store the returned provider task ids somewhere durable (a KV
// store, a database row) instead of just base64-encoding them into jobId,
// and still return this same { jobId, shots, estimatedSeconds } shape so
// /api/clip-status can poll the real provider underneath.

const MOTIONS = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};
  const shotsIn = Array.isArray(body.shots) ? body.shots : [];

  const shots = shotsIn.map((s, i) => ({
    room: (s && s.room) || ('Shot ' + (i + 1)),
    motion: MOTIONS[i % MOTIONS.length],
    durationSec: 3
  }));

  const job = {
    listingId: body.listingId || null,
    startedAt: Date.now(),
    shots
  };

  const jobId = Buffer.from(JSON.stringify(job)).toString('base64');

  res.status(200).json({
    jobId,
    shots,
    estimatedSeconds: Math.max(3, shots.length)
  });
};
