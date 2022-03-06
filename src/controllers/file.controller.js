const fs = require("fs");

function getImage(req, res) {
  const filename = req.params.filename;
  fs.readFile(`uploads/${filename}`, (err, rows) => {
    if (!err) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(rows);
    }
  });
}

module.exports = { getImage };
