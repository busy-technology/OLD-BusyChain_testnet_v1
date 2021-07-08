const mongoose = require("mongoose");
const config = require("./config");
const restify = require("restify"),
  server = restify.createServer({
    name: "Busy chaincode API",
    version: "1.0.0",
  }),
  cors = require("./cors");

server.pre(cors);

server.use(restify.plugins.throttle({ burst: 100, rate: 20, ip: true }));

server.use(
  restify.plugins.bodyParser({
    mapParams: false,
    maxBodySize: 1024 * 1024 * 2,
    // requestBodyOnGet: true,
    urlencoded: { extended: false },
  })
);

server.use(restify.plugins.queryParser({ mapParams: false }));

server.listen(config.PORT, () => {
  mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err);
});

db.once("open", () => {
  require("./app/routes")(server);
  console.log(`Server started on port ${config.PORT}`);
});
