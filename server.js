const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");

// our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// it works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// require all models
const db = require("./models");

const PORT =  process.env.PORT || 3000;

// initialize Express
const app = express();

// configure middleware

// use morgan logger for logging requests
app.use(logger("dev"));
// parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// make public a static folder
app.use(express.static("public"));

// set up express-handlebars
app.set("views", "./views");
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// connect to the Mongo DB
// if deployed on heroku use the deployed database
// if not deployed use the local mongoHeadlines database
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

// Routes

// ============================================================================
// set up GET route for scraping the livescience website
// ============================================================================
// executed when on click from app
// creates MongoHeadlines database if it does not exist
// adds scraped documents to articles collection in mongoHeadline database
app.get("/scrape", function (req, res) {
  // first, we grab the body of the html with axios
  axios.get("https://www.livescience.com/animals").then(function (response) {
    // next we load the response in to cheerio and save it to $ for a shorthand selector
    // this will allow us to parse the HTML that has come back from livescience web site
    var $ = cheerio.load(response.data);
    // make sure we are getting the desired HTML back
    console.log("JBond Log Data --- HTML data coming back from cheerio load.");
    console.log(response.data);
    // we grab every h2 within a line item and do the following:
    $("li h2").each(function (i, element) {
      // start by saving an empty result object
      var result = {};
      // add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      // ======================= BELOW BEING TRIED
      // check to see if a document with the same title already exists in the collection
      db.Article.find({ title: result.title }, function (err, foundData) {
        if (foundData.length == 0) {
          /// then this article does not already exist so add it
          // ======================= BELOW WORKS
          // create a new Article using the `result` object built from scraping
          db.Article.create(result)
            .then(function (dbArticle) {
              // view the added result in the console to make sure it is working
              console.log("Article added to the mongo database.");
              console.log(dbArticle);
            })
            .catch(function (err) {
              // if an error occurred, log it
              console.log("JBond Log Data --- error on .get - /scrape.");
              console.log(err);
            }); // end db Article create
          // ======================= ABOVE WORKS
        }; // end foundData.length
      }); // end db.Article.find()
      // ======================= ABOVE BEING TRIED
    }); // end li .each
  }); // end axios GET
}); // end app GET

// route for Home 
app.get("/", function (req, res) {
  res.render("index");
});

// route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/delete/:id", function (req, res) {
  // remove the note from the document in the Article collection
  db.Article.update({ _id: req.params.id }, { $unset: { note: 1 } })
    .then(function (data) {
      console.log("Article - " + req.params.id + " - removed.");
    });
  // remove the note document from the Note collection
  db.Note.remove({ _id: req.params.id })
    .then(function (data) {
      console.log("Note REMOVED!");
      res.json(data);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
