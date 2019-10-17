module.exports = function(req, res, next) {
  if (!req.user) {
    req.flash('error', 'You must be logged in to view that page!');
    res.redirect('/auth/login');
  } else {
    next();
  }
};
