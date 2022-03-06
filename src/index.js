const App = require("./app");

const main = async () => {
  console.log("start index.main");
  const app = new App();
  await app.listen();
};

main();
