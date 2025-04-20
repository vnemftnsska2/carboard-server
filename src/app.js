require('dotenv').config()
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const history = require('connect-history-api-fallback');
const passport = require('passport');
const passportConf = require('./middleware/passport');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const dbInfo = require('./database/info');

//Router
const AppRouter = require("./routes/app.routes");
const FileRouter = require("./routes/file.routes");
const TaskRouter = require("./routes/task.routes");
const CategoryRouter = require("./routes/category.routes");
const BrandRouter = require("./routes/brand.routes");
const ProductRouter = require("./routes/product.routes");
const DashboardRouter = require('./routes/dashboard.routes');
const SalesRouter = require('./routes/sales.routes');
const WorkerRouter = require("./routes/worker.routes");

class App {
  constructor() {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
  }

  settings() {
    this.app.set("port", this.port || process.env.PORT || 3030);
  }

  middlewares() {
    this.app.use(morgan("dev"));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use("uploads", express.static("uploads"));
    this.app.use(cors({
      origin: [
        'http://localhost:3030',
        'http://localhost:5173',
        'http://tintlab2.cafe24app.com',
      ], credentials: true,
      optionSuccessStatus: 200,
    }));

    //Login(PASSPORT)
    passportConf();
    this.app.use(session({
      resave: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: null,
      },

      saveUninitialized: false,
      key: 'CAR_BOARD',
      secret: 'rudalsdlvkdlxld!',
      store: new MySQLStore(dbInfo),
    }));
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  routes() {
    this.app.use("/api", AppRouter);
    this.app.use("/api", TaskRouter);
    this.app.use("/api", DashboardRouter);
    this.app.use("/api", SalesRouter);
    this.app.use("/api", CategoryRouter);
    this.app.use("/api", BrandRouter);
    this.app.use("/api", ProductRouter);
    this.app.use("/api", WorkerRouter);
    this.app.use(FileRouter);

    //SPA-Router 404Error 방지
    this.app.use(history())
    this.app.use(express.static(global.clientPath));
    this.app.use(express.static(global.clientIndex));
  }

  async listen() {
    const port = this.app.get("port");
    await this.app.listen(port);
    console.log("Tinting-Diary API Server On Port", port);
  }
}

module.exports = App;
