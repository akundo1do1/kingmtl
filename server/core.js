const serverless = require("serverless-http");
const express = require("express");
const {
  Pagination,
  Homepage,
  Robots,
  ads,
  PlaceHolder,
  PostApi,
  Post,
  err404,
  Contact,
  Copyright,
  Dmca,
  Privacy,
  Feed,
  SitemapXML,
} = require("./controllers");
const app = express();
app.use(express.static("assets"));
app.disable("x-powered-by");

app.get("/", Homepage);
app.get("/ping", (req, res) => {
  res.header("Content-Type", "text/plain");
  res.write("ok");
  res.send();
});
app.get("/p/contact", Contact);
app.get("/p/copyright", Copyright);
app.get("/p/dmca", Dmca);
app.get("/p/privacy", Privacy);
app.get("/robots.txt", Robots);
app.get("/ads.txt", ads);
app.get("/feed", Feed);
app.get("/sitemap.xml", SitemapXML);
app.get("/page/:id(\\d+)", Pagination);
app.get("/img/placeholder.svg", PlaceHolder);
app.post("/api/:query", PostApi);
app.get("/:query", Post);
app.all("*", err404);

module.exports = app;
module.exports.handler = serverless(app);
