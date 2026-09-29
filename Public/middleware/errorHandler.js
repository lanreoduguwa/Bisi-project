module.exports = (err, req, res, next) => {
  console.error(err);
  const client = err.name === 'MulterError' || /^Only /.test(err.message || '');
  res.status(client ? 400 : 500).json({ error: client ? err.message : 'Server error' });
};
