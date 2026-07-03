export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry', detail: err.detail });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'Referenced record not found', detail: err.detail });
  }
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}
