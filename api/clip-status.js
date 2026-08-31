// GET /api/clip-status?jobId=...
//
// Reports progress on a job created by /api/generate-clip.
//
// TODAY: the "job" is just a base64-encoded timestamp — progress is
// simulated by comparing Date.now() to when the job was created. No real
// rendering happens here; the client renders the actual walkthrough video
// itself (canvas + MediaRecorder) once this reports 'complete'.
//
// LATER: jobId would be a real provider task id (or a key into a store of
// them); this handler would poll that provider's status endpoint for each
// shot and return 'complete' with real per-shot clip URLs once every shot
// is done, still under this same { status, progress, shots } shape — at
// which point the client would stitch those real clips together (e.g. via
// a server-side ffmpeg function) instead of animating static photos.

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Use GET' });
    return;
  }

  const jobId = req.query && req.query.jobId;
  if (!jobId) {
    res.status(400).json({ error: 'Missing jobId' });
    return;
  }

  let job;
  try {
    job = JSON.parse(Buffer.from(jobId, 'base64').toString('utf8'));
  } catch (e) {
    res.status(400).json({ error: 'Invalid jobId' });
    return;
  }

  const elapsed = Date.now() - (job.startedAt || 0);

  if (elapsed < 1200) {
    res.status(200).json({ status: 'queued' });
    return;
  }
  if (elapsed < 3200) {
    const progress = Math.min(90, Math.round(((elapsed - 1200) / 2000) * 90));
    res.status(200).json({ status: 'processing', progress });
    return;
  }

  res.status(200).json({ status: 'complete', source: 'mock', shots: job.shots || [] });
};
