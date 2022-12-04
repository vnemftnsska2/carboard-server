require('dotenv').config()
const path = require('path')
const App = require("./src/app");

//Setting
global.clientPath = path.join(__dirname, '/client');
global.clientIndex = path.join(__dirname, '/client/index.html');

const main = async () => {
  const app = new App();
  await app.listen();
  console.log('************************************************');
  console.log(`************  Carboard SERVER START ************`);
  console.log('************************************************');
};

main();
