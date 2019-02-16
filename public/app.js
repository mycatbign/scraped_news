// Grab the articles as a json
// we will execute this on start up to display what is in the database already
$.getJSON("/articles", function (data) {
  // for each one
  for (var i = 0; i < data.length; i++) {
    // display the apropos information on the page
    var articleSummary = "";
    articleSummary = articleSummary + "<p data-id='" + data[i]._id + "'>";
    articleSummary = articleSummary + "<strong>" + data[i].title + "</strong></p>";
    articleSummary = articleSummary + "<a class='" + "btn btn-success'";
    articleSummary = articleSummary + "href='" + "https://www.livescience.com" + data[i].link;
    articleSummary = articleSummary + "'" + ">Read the above article</a>";
    $("#articles").append(articleSummary);
  }
});

// whenever someone clicks a p tag
$(document).on("click", "p", function () {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // with that done, add the note information to the page
    .then(function (data) {
      console.log(data);
      // the title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // an input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // a textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // a button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
      // a button to delete the existing note from the database
      $("#notes").append("<button data-id='" + data._id + "' id='deletenote'>Delete Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// when you click the save note button
$(document).on("click", "#savenote", function () {
  // grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  // run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // value taken from title input
      title: $("#titleinput").val(),
      // value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // with that done
    .then(function (data) {
      // log the response
      console.log(data);
      // empty the notes section
      $("#notes").empty();
    });
  // also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

// when you click the delete note button
$(document).on("click", "#deletenote", function () {
  // grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  // run a POST request to change the note, replacing whats there now with blanks
  $.ajax({
    method: "POST",
    url: "/delete/" + thisId
  })
    // With that done
    .then(function (data) {
      // log the response
      console.log(data);
      // empty the notes section
      $("#notes").empty();
    });
  // remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

// when you click the Home button refresh the site
$(document).on("click", "#scrapeHome", function () {
  // we take the user back to the home page
  console.log("Home button clicked");
  // run a GET request to update the page 
  $.ajax({
    method: "GET",
    url: "/"
  })
    .then(function (data) {
      // Log the response
      console.log("Display Home page.");
    });
});

// when you click the Scrape More Articles button
$(document).on("click", "#scrapeArticles", function () {
  // scrape the site for more aarticles
  console.log("Scrape button clicked");
  // run a GET request to update the page 
  $.ajax({
    method: "GET",
    url: "/scrape"
  })
    .then(function (data) {
      console.log("Scrape button completed.");
    });
});
