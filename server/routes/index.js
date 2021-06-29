const fs = require('fs');
const path = require('path');

module.exports = (app, server) => {
  // API routes
  fs.readdirSync(__dirname + '/api/').forEach((file) => {
    require(`./api/${file.substr(0, file.indexOf('.'))}`)(app, server);
  });

  app.get("/", (req, res) => {
    return res.send("Wikiroyale is up and running!");
  });

};