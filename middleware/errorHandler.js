// Central error handler — must be registered last, after every route.
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  // Bad file type/size or a validation-style error gets its message shown to the
  // customer; anything else is an unexpected server error and stays generic.
  const isClientError = err.name === 'MulterError' || /^Only /.test(err.message || '');
  res.status(isClientError ? 400 : 500).json({ error: isClientError ? err.message : 'Server error' });
};