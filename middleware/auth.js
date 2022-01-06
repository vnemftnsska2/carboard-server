const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const userToken = req.cookies.jwt_auth;
  jwt.verify(userToken, process.env.JWT_TOKEN, (err, decoded) => {
    
  });
}

module.exports = { auth };