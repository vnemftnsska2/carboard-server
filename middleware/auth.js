const { verify } = require('jsonwebtoken');

const checkAuth = (req, res, next) => {
  const userToken = req.cookies.jwt_auth;
  verify(userToken, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      res.status(401).json({error: 'Auth Error From authChecker'});
    }
    next();
  });
}

module.exports = { checkAuth };