// Set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 40, left: 60},
    width = 540 - margin.left - margin.right,
    height = 540 - margin.top - margin.bottom;



// Which type that is visible in the graph, true = visible, false = not visible
var typeVisible = {'wargames': true, 'partygames': true, 'childrensgames': true, 'strategygames': true, 'familygames': true, 'cgs': true, 'thematic': true, 'abstracts': true, 'notype': false};

// For keeping track of filtered categories and mechanics.
filteredCatMech = {}
numBlues = 0
numGreen = 0

// All different axes we want users to be able to use
var axes = ["Rating", "Complexity", "Year", "Rank", "Number of Ratings", "Age", "Max number of Players", "Min number of Players", "Recommended number of Players", "Max Playtime", "Min Playtime"]

var scatterplotloaded = false;

maxRating = 0;
minRating = 10;

var minPlayers = 0;
var maxPlayers = 1000;
var minPlayTime = 0;
var maxPlayTime = 60000;

var minAge = 0;
var maxAge = 25;
var minNumberOfRatings = 0;
var maxNumberOfRatings = 103000;

var numOfGamesDisplayed = 0;
var totalNumberOfGames = 0;

var gamesInPrevList = []

var selectedGame = null;

var xAxisLock = false , yAxisLock = false;
var savedXAxis , savedYAxis;
var currentXAxis = "ratings", currentYAxis = "complexity";
//Read the data
d3.json("cleanedData.json", function(data) {
  data.forEach(function(d) {
    numOfGamesDisplayed +=1;
    totalNumberOfGames +=1;

    if(d.ratings > maxRating) {
      maxRating = parseFloat(d.ratings);
    }
    if(d.ratings < minRating) {
      minRating = parseFloat(d.ratings);
    }
  });

// Read in all categories and mechanics. (For filtering)
d3.json("catmechGroups.json", function(data) {

  // Adds elements that will contain the buttons for category and mechanic filtering
  addCatsMechs(data);

  // Adds checkboxes and labels for all categories and mechanics
  Object.entries(data).forEach(entry => {
    catmechGroup = d3.select("#" + entry[0]);
    entry[1]["list"].forEach(catmech => {
      catmechName = catmech
      if(entry[1]["isCat"]){
        catmech = "cat-"+catmech;
      }
      else{
        catmech = "mech-"+catmech;
      }
      filteredCatMech[catmech] = 0;

      catmechGroup
        .append("button")
        .text(catmechName)
        .attr("class", "catmech-filter-button")
        .attr("id", "c" + catmech)
        .on("click", function() {
            filteredCatMech[catmech] = (filteredCatMech[catmech] + 1) % 4

            // Set color of button
            if(filteredCatMech[catmech] == 0)
              this.style.backgroundColor = "";
              this.style.color = "white";
              if(document.getElementById("d" + catmech) != null){
                document.getElementById("d" + catmech).style.backgroundColor = "";
                document.getElementById("d" + catmech).style.color = "white";
              }
            if(filteredCatMech[catmech] == 1){
              this.style.backgroundColor = "lightgreen";
              this.style.color = "black";
              if(document.getElementById("d" + catmech) != null){
                document.getElementById("d" + catmech).style.backgroundColor = "lightgreen";
                document.getElementById("d" + catmech).style.color = "black";
              }
              numGreen += 1;
            }
            if(filteredCatMech[catmech] == 2){
              this.style.backgroundColor = "cornflowerblue";
              this.style.color = "black";
              if(document.getElementById("d" + catmech) != null){
                document.getElementById("d" + catmech).style.backgroundColor = "cornflowerblue";
                document.getElementById("d" + catmech).style.color = "black";
              }
              numBlues += 1;
              numGreen -=1;
            }
            if(filteredCatMech[catmech] == 3){
              this.style.backgroundColor = "tomato";
              this.style.color = "black";
              if(document.getElementById("d" + catmech) != null){
                document.getElementById("d" + catmech).style.backgroundColor = "tomato";
                document.getElementById("d" + catmech).style.color = "black";
              }
              numBlues -= 1;
            }
            filter()
          });
    });
  });
});

// Add functionality to button that removes filter selections in catmech
d3.select("#clearCatMechButton")
  .on("click", function(){
  //reset all catmech filtering values
  for (let key in filteredCatMech){
    filteredCatMech[key] = 0;
  }

  //reset color on all catmech buttons
  var cat = d3.selectAll(".catmech-filter-button")
    .style("background-color","")
    .style("color", "white");

  d3.selectAll(".boardgameinfo-bubble")
    .style("background-color", "")
    .style("color", "white");


  numGreen = 0;
  numBlues = 0;

  //apply changes to scatter plot
  filter();
  })

// Add button for search filter
d3.select("#search-filter")
  .append("button")
  .text("Filter")
  .attr("id", "search-button")
  .on("click", function(){
    filter();
  });
// When user presses enter after inputing search, filter is called.
d3.select("#search-input").on("change", function(){
  filter();
});

// Add string for num of games displayed in the scatterplot
document.getElementById('current-games-displayed').innerHTML = 'Current number of games displayed: <span style="color:greenyellow;">' + numOfGamesDisplayed + "</span> / <span style='color: slateblue;'>" + totalNumberOfGames + "</span>";

// Filters games shown.
function filter() {
  search = document.getElementById("search-input").value;
  // List that keeps track of what games should be shown
  gamesToShow = [];
  data.forEach(function(d) {
    visible = true

    // if gamename does not include the search, then do NOT SHOW
    if(search != ""){
      if(!(d.name.toLowerCase().includes(search.toLowerCase())))
        visible = false
    }

    // Show game if one of the game types is selected as visible
    var matchedVisibleTypes = 0
    d['type'].forEach(function(type) {
      if(typeVisible[type] == true) {
          matchedVisibleTypes += 1
      }
    })
    if(matchedVisibleTypes == 0) {
        visible = false;
    }

    // Player and playtime filtering
    if(minPlayers > d.maxPlayers || maxPlayers < d.minPlayers) {
        visible = false;
    }
    if(minPlayTime > d.maxPlayTime || maxPlayTime < d.minPlayTime) {
        visible = false;
    }

    // Age filter
    if(d.age < minAge || d.age > maxAge) {
        visible = false;
    }

    // number of ratings filter
    if(d.numRatings < minNumberOfRatings || d.numRatings > maxNumberOfRatings) {
        visible = false;
    }

    // If game is already filtered, then no need to check cats and mechs.
    if(visible){
      catmech = []
      d['cat'].forEach(function(cat) {
        catmech.push(filteredCatMech["cat-"+cat]);
      });
      d['mech'].forEach(function(mech) {
        catmech.push(filteredCatMech["mech-"+mech]);
      });

      // If there is at least 1 green and game does not have any green, then do NOT show.
      if (numGreen > 0){
        hasGreen = false;
        catmech.forEach(function(item) {
          if(item == 1)
            hasGreen = true;
        });
        if(!hasGreen)
          visible = false;
      }

      // If category is red, then do NOT show.
      catmech.forEach(function(item) {
        if(item == 3){
          visible = false;
        }
      });

      // Count how many blues there are for current game.
      i = 0
      catmech.forEach(function(d) {
        if(d == 2)
        i+=1;
      });
      // Count how many blues there are. If blues are not equal to numBlues, then do NOT show.
      if (i != numBlues)
        visible = false;
  }

    // If an axis has rank then do not include games with no rank.
    if(document.getElementById("XAxisSelection").value == "Rank" || document.getElementById("YAxisSelection").value == "Rank") {
      if(isNaN(d.rank)){
        visible = false;
      }
    }
    // If an axis has rank then do not include games with no rank.
    if(document.getElementById("XAxisSelection").value == "Recommended number of Players" || document.getElementById("YAxisSelection").value == "Recommended number of Players") {
      if(isNaN(d.recPlayers)){
        visible = false;
      }
    }

    // If game should be displayed, add it to the list
    if(visible) {
      gamesToShow.push(d)
    }

  });
  numOfGamesDisplayed = gamesToShow.length
  drawCircles(gamesToShow);
  document.getElementById('current-games-displayed').innerHTML = 'Current number of games displayed: <span style="color:greenyellow;">' + numOfGamesDisplayed + "</span> / <span style='color: slateblue;'>" + totalNumberOfGames + "</span>";
}



//if things are added or removed from the main view this calculation has to be adjusted
//the Details view is hard coded as it contains to many parameters to calcualte and still have readable code. 12 comes from padding and border
detailsWidth = Number(d3.select(".infoDiv").style("width").slice(0,-2)) + 12;
var history = d3.select("#prev-game-container");
historyWidth = Number(history.style("width").slice(0, -2)) + Number(history.style("margin-left").slice(0,-2)) + Number(history.style("margin-right").slice(0,-2));
var ledger = d3.select("#color-legend-container");
ledgerWidth= Number(ledger.style("width").slice(0, -2)) + Number(ledger.style("margin-left").slice(0,-2));
windowWidth = window.innerWidth;

scatterWidth = windowWidth-detailsWidth-historyWidth-ledgerWidth;
//to make space for margin
scatterWidth = scatterWidth-10;
if(scatterWidth > width){
  width = scatterWidth;
}


  // Append the svg object to the body of the page
var svg = d3.select("#main-scatterplot")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
  // Its opacity is set to 0: we don't see it by default.
  var tooltip = d3.select("#main-scatterplot")
  .append("div")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("opacity", 1)
  .style("display", "none")
  .attr("class", "tooltip")
  .style("background-color", "rgba(0, 0, 0, 0.8)")
  .style("border", "solid")
  .style("border-color", "white")

  .style("color", "white")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px")

  // add X axis selection
  var XSelection = d3.select("#XAxisSelection").on("change", function() {
    document.getElementById("x-min").value = "";
    document.getElementById("x-max").value = "";
    filter();
    updateChart(false, true, true, false);
  });
  XSelection.selectAll("option").data(axes).enter().append("option").text(function(d) {return d});

  // add Y axis selection
  var YSelection = d3.select("#YAxisSelection").on("change", function() {
    document.getElementById("y-min").value = "";
    document.getElementById("y-max").value = "";
    filter();
    updateChart(false, true, false, true);
  });
  YSelection.selectAll("option").data(axes).enter().append("option").text(function(d) {return d});
  document.getElementById("YAxisSelection").value = "Complexity";

  // Add X axis to svg
  var xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "plotAxis")
    .call(d3.axisBottom(getScaleInfo("XAxisSelection", 0, width)[0]));

  // Add Y axis to svg
  var yAxis = svg.append("g")
    .attr("class", "plotAxis")
    .call(d3.axisLeft(getScaleInfo("YAxisSelection", height, 0)[0]));

  // Add x-axis label
  svg.append("text")
    .attr("id", "x-axis-label")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left - 40)
    .attr("y", height + margin.top + 25)
    .text("Rating").style('fill', 'white');

  // Add y-axis label
  svg.append("text")
    .attr("id", "y-axis-label")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left +15)
    .attr("x", -margin.top - height/2 + 45)
    .text("Complexity").style('fill', 'white');

  svg.append("image")
    .attr("id", "x-axis-lock")
    .attr('xlink:href', './lockicon-white.png')
    .attr('width', 17)
    .attr('height', 17)
    .attr("x", width/2 + margin.left - 35)
    .attr("y", height + margin.top + 10)
    .style("opacity", 0.5)
    .on("click", function() {
      xAxisLock = !xAxisLock;
      if(xAxisLock){
        d3.select("#x-axis-lock").style("opacity", 1);
      } else {
        d3.select("#x-axis-lock").style("opacity", 0.5);
        resetView(true, false);
      }
    })
    .on("mousemove", function(){
      tooltip
      .html("Clicking this lock prevents zooming and panning in the x-direction")
      .style("left", (d3.mouse(d3.select("body").node())[0]+15) + "px")
      .style("top", (d3.mouse(d3.select("body").node())[1]-15) + "px")
    })
    .on("mouseover", function(){
      tooltip
      .style("display", "block")
      .style("border-width", "0")
      .style("background-color", "rgba(0, 0, 0, 0.9)")
      .style("width", "140px")
    })
    .on("mouseleave", function() {
      tooltip
      .transition()
      .duration(100)
      tooltip.style("display", "none")
      .style("border-width", "1")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("width", "");
    });;

  svg.append("image")
    .attr("id", "y-axis-lock")
    .attr('xlink:href', './lockicon-white.png')
    .attr("transform", "rotate(-90)")
    .attr('width', 17)
    .attr('height', 17)
    .attr("y", -margin.left)
    .attr("x", -margin.top - height/2 + 50)
    .style("opacity", 0.5)
    .on("click", function() {
      yAxisLock = !yAxisLock;
      if(yAxisLock) {
        d3.select("#y-axis-lock").style("opacity", 1);
      } else {
        d3.select("#y-axis-lock").style("opacity", 0.5);
        resetView(false, true);
      }
    })
    .on("mousemove", function(){
      tooltip
      .html("Clicking this lock prevents zooming and panning in the y-direction")
      .style("left", (d3.mouse(d3.select("body").node())[0]+15) + "px")
      .style("top", (d3.mouse(d3.select("body").node())[1]-15) + "px")
    })
    .on("mouseover", function(){
      tooltip
      .style("display", "block")
      .style("border-width", "0")
      .style("background-color", "rgba(0, 0, 0, 0.9)")
      .style("width", "140px")
    })
    .on("mouseleave", function() {
      tooltip
      .transition()
      .duration(100)
      tooltip.style("display", "none")
      .style("border-width", "1")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("width", "");
    });

    

// Init the saved axes to the default
savedXAxis = getScaleInfo("XAxisSelection", 0, width)[0];
savedYAxis = getScaleInfo("YAxisSelection", height, 0)[0];

 // Add a clipPath: everything out of this area won't be drawn (so that points does not go outside the plot when using pan and zoom).
 var clip = svg.append("defs").append("svg:clipPath")
     .attr("id", "clip")
     .append("svg:rect")
     .attr("width", width )
     .attr("height", height )
     .attr("x", 0)
     .attr("y", 0);

 // A function that change this tooltip when the user hover a point.
 // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
 var mouseover = function(d) {
   tooltip
     .style("display", "block")
   mouseOverGame(d)
 }

 var mousemove = function(d) {
   tooltip
     .html(d.name) // what the tooltip displays
     // The mouse gets the coordinates from relative to the body - decide placement of tooltip
     .style("left", (d3.mouse(d3.select("body").node())[0]+20) + "px")
     .style("top", (d3.mouse(d3.select("body").node())[1]-15) + "px")
 }

  // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
  var mouseleave = function(d) {
   tooltip
     .transition()
     .duration(100)
   if(d != selectedGame)
    d3.select("#gameid"+d.id).style("stroke", "none").style("stroke-width", "none")
      
    tooltip.style("display", "none");
 }

  // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
  var zoom = d3.zoom()
    .scaleExtent([.5, 1000])  // This control how much you can unzoom (x0.5) and zoom (x10000)
    .extent([[0, 0], [width, height]])
    .on("zoom", function() {updateChart(true, false, false, false)});

// Resets view of scatterplot
function resetView(resetX, resetY) {
  xAxisLock = false;
  yAxisLock = false;

  if(resetX) {
    document.getElementById("x-min").value = "";
    document.getElementById("x-max").value = "";
  }
  if(resetY){
    document.getElementById("y-min").value = "";
    document.getElementById("y-max").value = "";
  }

  d3.select("#x-axis-lock").style("opacity", 0.5);
  d3.select("#y-axis-lock").style("opacity", 0.5);

  svg.transition()
    .duration(1000)
    .call(zoom.transform, d3.zoomIdentity);
}

  // When resetbutton is pressed, view of scatterplot is reset
  d3.select("#btnResetZoom")
    .on("click", function(){
      resetView(true, true);
  })

// This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zoom
  var zoomRect = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "rgba(128, 128, 128, 0.1)")
      .style("pointer-events", "auto");

 // Create the scatter variable: where both the circles and the brush take place
 var scatter = svg.append('g')
   .attr("clip-path", "url(#clip)");

  // Used to replace all '_' with ' ' (space) in the input string
  function replaceToSpace(word) {
      return word.replace(/_/g, ' ');
  }

var instructions = "Each point in the scatterplot to the left represents a boardgame<br><br><b>Click</b> the points for more details about the games.</br>\n<b>Zoom</b> by scrolling in the plot.</br>\n<b>Pan</b> by dragging the plot with your cursor.</br>\n";

document.getElementById("info-title").innerHTML = "Instructions";
document.getElementById("info-information").innerHTML = instructions;

function createRangeSlider(sliderType, minvalue, maxvalue, numOfTicks, step, sliderWidth, sliderHeight, sliderColor) {

    var sliderElements = []
    for(var i = minvalue; i <= maxvalue; i++) {
            sliderElements.push(i);
        }
    var rangeSlider = d3
    .sliderBottom()
    .min(d3.min(sliderElements))
    .max(d3.max(sliderElements))
    .width(sliderWidth)
    .ticks(numOfTicks)
    .step(step)
    .default([minvalue, maxvalue])
    .handle(
      d3
        .symbol()
        .type(d3.symbolCircle)
        .size(150)()
    )
    .fill(sliderColor)
    .on('onchange', val => {
      var values = val.map(d3.format('1'));
      var valueBottom = parseInt(values[0]);
      var valueTop = parseInt(values[1]);

      if(sliderType === 'numberOfPlayers-rangeslider') {
          if(valueTop == maxvalue) {
              valueTop = 1000;
          }

          minPlayers = valueBottom;
          maxPlayers = valueTop;
      }
      else if(sliderType == 'playTime-rangeslider') {
          if(valueTop == maxvalue) {
              valueTop = 60000;
          }

          minPlayTime = valueBottom;
          maxPlayTime = valueTop;
      }

      else if(sliderType == 'age-rangeslider') {
          minAge = valueBottom;
          maxAge = valueTop;
      }

      else if(sliderType == 'num-of-ratings-rangeslider') {

          if(valueTop == maxvalue) {
              valueTop = 103000;
          }

          minNumberOfRatings = valueBottom;
          maxNumberOfRatings = valueTop;
      }

      filter();
    });

  var gRangeSlider = d3
    .select('#' + sliderType)
    .append('svg')
    .attr('width', sliderWidth + 60)
    .attr('height', sliderHeight)
    .attr('fill', 'white')
    .append('g')
    .attr('transform', 'translate(30,20)')
    .call(rangeSlider);
}

// create the sliders
createRangeSlider('numberOfPlayers-rangeslider', 0, 50, 5, 1, 200, 55, 'rgba(255, 255, 255, 0.5)');
createRangeSlider('playTime-rangeslider', 0, 600, 5, 1, 200, 55, 'rgba(255, 255, 255, 0.5)');
createRangeSlider('age-rangeslider', minAge, maxAge, 5, 1, 200, 55, 'rgba(255, 255, 255, 0.5)');
createRangeSlider('num-of-ratings-rangeslider', 0, 20000, 5, 1, 200, 55, 'rgba(255, 255, 255, 0.5)');

  // Add all circles (position etc.) as well as which interactions that triggers when interacting with them
function drawCircles(gamesToShow) {

  circles = scatter.selectAll("circle")
    .data(gamesToShow, function(d) {
      return d.id;
    });

  // Remove circles that are no longer present
  circles.exit()
    .transition()
    .remove();

  // Draw new circles
  circles.enter()
    .append("circle")
    .attr("cx", function (d) {
      var x = savedXAxis(d[currentXAxis]);
      if(isNaN(x)){
        return -1;
      }
      return x;
    })
    .attr("cy", function (d) {
      var y = savedYAxis(d[currentYAxis]);
      if(isNaN(y)){
        return -1;
      }
      return y;
    })
    .attr("r", 3.2)
    .style("fill", function (d) { return typeColor(d.type[0]);})
    .attr("id", function(d) {return "gameid" + d.id})
    .on('click', function (d) {
      addToPrevList(d);
      try {
          markSelected(d);
      }
      catch(e) {}
      displayGameInfo(d);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

    scatterplotloaded = true;
    if(selectedGame != null) {
      try {
        markSelected(selectedGame)
      }
      catch(e) {}
    }
}
// Call function in the beginning so we see the games when page is loaded.
 filter();
 // drawCircles(data);

   // Add the action so that we can zoom when scrooling or double click on the scatterplot
   svg.call(zoom).on("dblclick.zoom", null);

   // Create the 'container'/svg for the color legend
   const colorLegendsvg = d3.select("#color-legend")
     .append("svg")
       .attr("width", 180)
       .attr("height", 180);

   var typeLegendG = colorLegendsvg.append("g");

   // x and y positons for circles in legend for the scatterplot
   var legendCircleXposition = 20;
   var typeLegendData = [{type: 'wargames', ypos: 10, xpos: legendCircleXposition}, {type: 'partygames', ypos: 30, xpos: legendCircleXposition}, {type: 'childrensgames', ypos: 50, xpos: legendCircleXposition}, {type: 'strategygames', ypos: 70, xpos: legendCircleXposition}, {type: 'familygames', ypos: 90, xpos: legendCircleXposition}, {type: 'cgs', ypos: 110, xpos: legendCircleXposition}, {type: 'thematic', ypos: 130, xpos: legendCircleXposition}, {type: 'abstracts', ypos: 150, xpos: legendCircleXposition}, {type: 'notype', ypos: 170, xpos: legendCircleXposition}];

   // Fill the legend with its element as well as calls actions on what happens when interacting/clicking on the legend
   typeLegendG
     .selectAll("circle")
       .data(typeLegendData)
       .enter()
       .append("circle")
       .attr("cx", legendCircleXposition)
         .attr("cy", function(element) { return element.ypos - 1; })
         .attr("r", 6)
         .style("fill", function (element) { if(element.type != "notype") {return typeColor(element.type)} else {return "rgba(255, 255, 255, 0)"}})
         .style("stroke-width", 2)
         .style("stroke", function (element) { return typeColor(element.type) })
         .style("cursor", "pointer")
         .attr("id", function(element) {return "legendCircle" + element.type})
       .on("click", function(element) {typeFilter(element.type, typeColor(element.type))});

   // Filter on board game types
   function typeFilter(gametype, typecolor) {

    // If visible and clicked on it becomes non-visible, we fill the circle with white to display that this type is no longer shown in the plot
      if(typeVisible[gametype] == true) {
          typeVisible[gametype] = false;
          d3.select("#legendCircle" + gametype).style("fill", "rgba(255, 255, 255, 0)");
      }

    // If non-visible and clicked on it becomes visible, we fill the circle with color.
      else {
        typeVisible[gametype] = true;
        d3.select("#legendCircle" + gametype).style("fill", typecolor);
      }
      filter();
   }

   // Add text to legend
   typeLegendData.forEach((element) => {
     typeLegendG.append("text").style('fill', 'white').attr("id", "legendText" + element.type).attr("x", element.xpos + 10).attr("y", element.ypos).text(niceTypeText(element.type)).style("font-size", "13px").attr("alignment-baseline","middle");
   });

   // Function to show/not show all types -> for the buttons in the legend
   function clearAllTypes(bool) {
     for (let key in typeVisible) {
       var fill = false;

       if(bool === true) {
           typeVisible[key] = false;
           d3.select("#legendCircle" + key).style("fill", "rgba(255, 255, 255, 0)");
       }

       else {
           typeVisible[key] = true;
           fill = true;
       }

      if(fill == true) {
          typeLegendData.forEach(function(t) {
              d3.select("#legendCircle" + t.type).style("fill", typeColor(t.type));
           })
      }

     }
     filter();
    }

    // Add 'click' actions to buttons in legend
    document.getElementById("btnClearAllType").onclick = function(){clearAllTypes(true)};
    document.getElementById("btnMarkAllType").onclick = function(){clearAllTypes(false)};

    d3.selectAll(".axis-min-max").on("change", function(){
      defaultMinMax = false;
      updateChart(false, false, false, false);
    });

  // A function that updates the chart when the user zoom and thus new boundaries are available
  function updateChart(hasZoomed, reset, resetX, resetY) {
    var scaleInfoX = getScaleInfo("XAxisSelection", 0, width)
    var scaleInfoY = getScaleInfo("YAxisSelection", height, 0)


    if(hasZoomed){
      // If x is locked now, no change.
      if(xAxisLock) {
        var newX = savedXAxis;
      // Otherwise just scale it based on current event
      } else {
        var newX = d3.event.transform.rescaleX(scaleInfoX[0]);
      }

      // If y is locked now, no change.
      if(yAxisLock) {
        var newY = savedYAxis;
      // Otherwise just scale it based on current event
      } else {
        var newY = d3.event.transform.rescaleY(scaleInfoY[0]);
      }

    } else {
      if(reset) {
        resetView(resetX, resetY)
        newX = scaleInfoX[0]
        newY = scaleInfoY[0]
      } else {
        newX = scaleInfoX[0]
        newY = scaleInfoY[0]
      }
    }

    savedXAxis = newX;
    savedYAxis = newY;
    currentXAxis = scaleInfoX[1];
    currentYAxis = scaleInfoY[1];

    // update axes with new boundaries
    xAxis.call(d3.axisBottom(newX));
    yAxis.call(d3.axisLeft(newY));

   if(hasZoomed) {
      // update circle position
      scatter
      .selectAll("circle")
      .attr('cx', function(d) {
        var x = newX(d[scaleInfoX[1]])
        if(isNaN(x)){
          d3.select("#gameid"+d.id).remove();
          return -1;
        }
        else return x;
      })
      .attr('cy', function(d) {
        var y = newY(d[scaleInfoY[1]]);
        if(isNaN(y)) {
          d3.select("#gameid"+d.id).remove();
          return -1;
        }
        else return y;
      });
    } else {
      // update circle position
      scatter
      .selectAll("circle")
      .transition()
      .duration(1000)
      .attr('cx', function(d) {
        var x = newX(d[scaleInfoX[1]])
        if(isNaN(x)){
          d3.select("#gameid"+d.id).remove();
          return -1;
        }
        else return x;
      })
      .attr('cy', function(d) {
        var y = newY(d[scaleInfoY[1]]);
        if(isNaN(y)) {
          d3.select("#gameid"+d.id).remove();
          return -1;
        }
        else return y;
      });
    }
   }

  // Function to show info about a board game when a point in the scatterplot is clicked
  function displayGameInfo(d) {
    document.getElementById("info-about-boardgame").style.display = "block";
    document.getElementById("info-div").style.display = "none";

    var playTimeString = d.minPlayTime + "-" + d.maxPlayTime;
    var numberOfPlayersString = d.minPlayers + "-" + d.maxPlayers;

    if(d.maxPlayTime == d.minPlayTime) {
        playTimeString = d.maxPlayTime;
    }

    if(d.minPlayers == d.maxPlayers) {
        numberOfPlayersString = d.maxPlayers;
    }

    document.getElementById("cross-display").onclick = function(){
        document.getElementById("info-about-boardgame").style.display = "none";
        document.getElementById("info-div").style.display = "block";
        // reset mark in scatterplot
        if(selectedGame != null){
          document.getElementById("gameid"+selectedGame.id).style.stroke = "none";
          document.getElementById("gameid"+selectedGame.id).style.strokewidth = "none";
          document.getElementById("prev-game-"+selectedGame.id).classList.remove("selectedGame");
          selectedGame = null;
        }
    };

    document.getElementById("title-boardgame").innerHTML = d.name + '<sup style="font-size: 15px;"> (' + d.year + ')</sup>';
    document.getElementById("complexity-display").innerHTML = d.complexity + "<sub>/5</sub>";
    document.getElementById("rating-display").innerHTML = d.ratings + "<sub>/10</sub>";


    var span = document.getElementById('num-of-rating-display');
    span.innerText = span.textContent = 'Number of ratings: ' + d.numRatings;

    document.getElementById("rank-display").innerHTML = d.rank;

    if(d.rank === "Not Ranked") {
      document.getElementById("rank-display").style.fontSize = "14px";
    }
    else {
      document.getElementById("rank-display").style.fontSize = "20px";
    }

    document.getElementById("players-display").innerHTML = numberOfPlayersString + '<p class="recPlayersText">(' + d.recPlayers + " Recomended)</p>";
    document.getElementById("playtime-display").innerHTML = playTimeString + " min";
    document.getElementById("age-display").innerHTML = d.age + " years";

    var designerArray = d.designer;
    var designerString = "";

    designerString = designerArray[0];

    for(var i = 1; i < designerArray.length; i++) {
      if(i === designerArray.length - 1) {
        designerString += " & " + designerArray[i];
      }

      else {
        designerString += ", " + designerArray[i];
      }
    }

    document.getElementById("gameDesigner-display").innerHTML = designerString; //Fix this more pretty plz
    document.getElementById("image-display").src = d.image;

    var cats = d3.select("#cat-display").selectAll("div").data(d.cat, function(d){return d});
    cats.exit().remove();
    cats
      .enter()
      .append("div")
      .classed("boardgameinfo-bubble", true)
      .attr("id", function(d){ return "dcat-" + d})
      .text(function(d){return d;})
      .style("background-color", function(d){
        var c = filteredCatMech["cat-"+d];
        return c == 0 && "" || c == 1 && "lightgreen" || c == 2 && "cornflowerblue" || c == 3 && "tomato";
      })
      .style("color", function(d){
        var c = filteredCatMech["cat-"+d];
        return c == 0 && "white" || "black";
      })
      .on("click", function(d){
        filteredCatMech["cat-"+d] = (filteredCatMech["cat-"+d] + 1) % 4

        switch (filteredCatMech["cat-"+d]){
          case 0:
            document.getElementById("ccat-"+d).style.backgroundColor = "";
            document.getElementById("ccat-"+d).style.color = "white";
            document.getElementById("dcat-"+d).style.backgroundColor = "";
            document.getElementById("dcat-"+d).style.color = "white";
            break;
          case 1:
            document.getElementById("ccat-"+d).style.backgroundColor = "lightgreen";
            document.getElementById("ccat-"+d).style.color = "black";
            document.getElementById("dcat-"+d).style.backgroundColor = "lightgreen";
            document.getElementById("dcat-"+d).style.color = "black";
            numGreen += 1;
            break;
          case 2:
            document.getElementById("ccat-"+d).style.backgroundColor = "cornflowerblue";
            document.getElementById("ccat-"+d).style.color = "black";
            document.getElementById("dcat-"+d).style.backgroundColor = "cornflowerblue";
            document.getElementById("dcat-"+d).style.color = "black";
            numGreen -= 1;
            numBlues += 1;
            break;
          case 3:
            document.getElementById("ccat-"+d).style.backgroundColor = "tomato";
            document.getElementById("ccat-"+d).style.color = "black";
            document.getElementById("dcat-"+d).style.backgroundColor = "tomato";
            document.getElementById("dcat-"+d).style.color = "black";
            numBlues -= 1;
            break;
        }
        filter();
      });

    var mechs = d3.select("#mech-display").selectAll("div").data(d.mech, function(d){return d});
    mechs.exit().remove();
    mechs
      .enter()
      .append("div")
      .classed("boardgameinfo-bubble", true)
      .style("background-color", function(d){
        var c = filteredCatMech["mech-"+d];
        return c == 0 && "" || c == 1 && "lightgreen" || c == 2 && "cornflowerblue" || c == 3 && "tomato";
      })
      .style("color", function(d){
        var c = filteredCatMech["mech-"+d];
        return c == 0 && "white" || "black";
      })
      .attr("id", function(d){ return "dmech-" + d})
      .text(function(d){return d;})
      .on("click", function(d){
        filteredCatMech["mech-"+d] = (filteredCatMech["mech-"+d] + 1) % 4

        switch (filteredCatMech["mech-"+d]){
          case 0:
            document.getElementById("cmech-"+d).style.backgroundColor = "";
            document.getElementById("cmech-"+d).style.color = "white";
            document.getElementById("dmech-"+d).style.backgroundColor = "";
            document.getElementById("dmech-"+d).style.color = "white";
            break;
          case 1:
            document.getElementById("cmech-"+d).style.backgroundColor = "lightgreen";
            document.getElementById("cmech-"+d).style.color = "black";
            document.getElementById("dmech-"+d).style.backgroundColor = "lightgreen";
            document.getElementById("dmech-"+d).style.color = "black";
            numGreen += 1;
            break;
          case 2:
            document.getElementById("cmech-"+d).style.backgroundColor = "cornflowerblue";
            document.getElementById("cmech-"+d).style.color = "black";
            document.getElementById("dmech-"+d).style.backgroundColor = "cornflowerblue";
            document.getElementById("dmech-"+d).style.color = "black";
            numGreen -= 1;
            numBlues += 1;
            break;
          case 3:
            document.getElementById("cmech-"+d).style.backgroundColor = "tomato";
            document.getElementById("cmech-"+d).style.color = "black";
            document.getElementById("dmech-"+d).style.backgroundColor = "tomato";
            document.getElementById("dmech-"+d).style.color = "black";
            numBlues -= 1;
            break;
        }
        filter();
      });

    document.getElementById("link-display").innerHTML = "<a href='https://boardgamegeek.com/boardgame/" + d.id + "'> Link to the game page at boardgamegeek.com</a>"

    // changeBubbleColor(typeColor(d.type[0]));

    typeString = ""
    d.type.forEach( type => {
        // var bgcolor = typeColor(type);
        // typeString += '<div class="boardgameinfo-bubble" style="background-color: ' + bgcolor +'; color: white;">' + niceTypeText(type) +'</div>';
        typeString += '<div class="boardgameinfo-type-bubble">' + niceTypeText(type) +'</div>';
    })

    document.getElementById("type-display").innerHTML = typeString;
  };

  // Function that handles the previously watched games list
  function addToPrevList(game) {

    function addGame() {
      var btn = document.createElement("button");
      btn.id = "prev-game-"+ game.id;
      var list =  document.getElementById("previous-game-list");
      list.insertBefore(btn, list.childNodes[0]);

      d3.select("#prev-game-"+game.id)
      .attr("class", "prevGame")
      .text(function() {
        if(game.name.length < 15)
          return game.name;

        return game.name.substring(0,15) + "...";
      })
      .on("click", function() {
        try {
          markSelected(game)
        }
        catch(e) {}
        displayGameInfo(game);
      })
      .on("mouseover", function() {mouseOverGame(game)})
      .on("mouseleave", function() {
        if(game != selectedGame)
          d3.select("#gameid"+game.id).style("stroke", "none").style("stroke-width", "none")
      });
    }

    // If user clicks same game again, nothing happens
    if(gamesInPrevList[gamesInPrevList.length-1] == game)
      return;

    var pos = gamesInPrevList.indexOf(game);
    // If game is already in the history, just move it
    if(pos != -1) {
      gamesInPrevList.splice(pos, 1);
      gamesInPrevList.push(game);
      document.getElementById("prev-game-"+game.id).remove();
      addGame();
    } else {
          // If user has looked at 15, then we keep total of games in list at 15
      if(gamesInPrevList.length == 15) {
        gamesInPrevList.shift();
        document.getElementById("previous-game-list").lastChild.remove();
      }
      gamesInPrevList.push(game);
      addGame();
  }
}


});

function niceTypeText(type) {

  var niceText = {'wargames' : 'Wargames', 'partygames' : 'Party Games','childrensgames' : "Children's Games", 'strategygames' : 'Strategy Games', 'familygames' : 'Family Games', 'cgs' : 'Customizable Games', 'thematic' : 'Thematic Games', 'abstracts' : 'Abstract Strategy Games', 'notype' : 'No Type'};

  return niceText[type]
}

// Function to decice color for each boardgame type
function typeColor(d){
  var baseColors = {'wargames' : '#ff7f00',
  'partygames' : '#984ea3',
  'childrensgames' : '#449c41',
  'strategygames' : '#e41a1c',
  'familygames' : '#f781bf',
  'cgs' : '#0CEEFF',
  'thematic' : '#377eb8',
  'abstracts' : '#aac423',
  'notype' : '#999999'};

  return baseColors[d];
}

function showCategories() {
    var categoryDiv = document.getElementById("Categories");
    var mechanicsDiv = document.getElementById("Mechanics");
    var button = document.getElementById("selectCatMechButton");
    var title = document.getElementById("cat-mech-Title");

    if (categoryDiv.style.display === "none") {
        categoryDiv.style.display = "flex";
        mechanicsDiv.style.display = "none";
        button.innerHTML =  "Show Mechanics";
        title.innerHTML = 'Right now viewing: <b style="color: greenyellow;">Categories</b>'
    }

    else {
    mechanicsDiv.style.display = "flex";
    categoryDiv.style.display = "none";
    button.innerHTML =  "Show Categories";
    title.innerHTML = 'Right now viewing: <b style="color: greenyellow;">Mechanics</b>'
  }
}


// If one want to change the color of the bubbles displayerd in the detail on demand-view
function changeBubbleColor(color) {
    var upperBubble = document.getElementsByClassName("div-crr-display");
    for (var i = 0; i < upperBubble.length; i++) {
      upperBubble[i].style.backgroundColor = color;
      upperBubble[i].style.color = "white";
    }

    var otherBubbles = document.getElementsByClassName("boardgameinfo-bubble");
    for (var i = 0; i < otherBubbles.length; i++) {
      otherBubbles[i].style.backgroundColor = color;
      otherBubbles[i].style.color = "white";
    }

}




function addCatsMechs(catmechInfo) {

  var categories = d3.select("#Categories");
  var mechanics = d3.select("#Mechanics");

  Object.entries(catmechInfo).forEach(entry=>{

    // If it is a category it belongs amongst the categories, otherwise the mechanics.
    if(entry[1]["isCat"]) {
      var group = categories
      .append("div")
      .attr("class", "catmech-group");
    } else {
      var group = mechanics
      .append("div")
      .attr("class", "catmech-group");
    }

    // Add Button that shows/hides filter options for group
    group
      .append("button")
      .attr("class", "collapsible")
      .text(entry[1]["label"])
      .on("click", function() {
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + 25 + "px";
        };
      });

    // add div that we set display = none / block
    group
      .append("div")
      .attr("class", "collapsible-content")
      // This is the div that will hold all buttons
        .append("div").attr("id", entry[0]).attr("class", "catmech-content")

  });
}

// Functions that marks the currently selected game in the scatterplot
function markSelected(game) {
  // Remove previous selection
  if(selectedGame != null) {
    d3.select("#gameid"+selectedGame.id)
    .style("stroke", "none")
    .style("stroke-width", "none");
    d3.select("#prev-game-"+selectedGame.id).classed("selectedGame", false);
  }

  // Mark the new game as selected
  selectedGame = game;
  d3.select("#gameid"+game.id)
    .style("stroke", "#FEFEF7")
    .style("stroke-width", "2px");
  // To move the circle in front
  var circle = document.getElementById("gameid"+game.id);
  var cont = circle.parentNode;
  cont.removeChild(circle);
  cont.appendChild(circle);
  d3.select("#prev-game-"+game.id).classed("selectedGame", true);
}

// Handles marking when hovering over a game
function mouseOverGame(game) {
  if (game != selectedGame){
    d3.select("#gameid"+game.id).style("stroke", "#FEFEF7").style("stroke-width", "1px")
   }
}

// function that provides scale. Also changes axis labels.
function getScaleInfo(axis, start, end) {
  var axisName = document.getElementById(axis).value;
  switch(axisName) {
    case "Rating":
      var min = 3.4, max = 8.7, type = "ratings";
      break;
    case "Complexity":
      var min = 0.9, max = 5.1, type = "complexity";
      break;
    case "Year":
      var min = -4000 , max = 2030, type = "year";
      break;
    case "Rank":
      var min = -500, max = 22000, type = "rank";
      break;
    case "Number of Ratings":
      var min = -500, max = 110000, type = "numRatings";
      break;
    case "Age":
      var min = -5, max = 50, type = "age";
      break;
    case "Max number of Players":
      var min = -5, max = 110, type = "maxPlayers";
      break;
    case "Min number of Players":
      var min = -5, max = 15, type = "minPlayers";
      break;
    case "Recommended number of Players":
      var min = -5, max = 25, type = "recPlayers";
      break;
    case "Max Playtime":
      var min = -2000, max = 70000, type= "maxPlayTime";
      break;
    case "Min Playtime":
      var min = -2000, max = 70000, type = "minPlayTime";
      break;
  }

  if(axis == "XAxisSelection") {
    d3.select("#x-axis-label").text(axisName)
    var minX = parseFloat(document.getElementById("x-min").value);
    var maxX = parseFloat(document.getElementById("x-max").value);
    if(!isNaN(minX)){
      min = minX;
    }
    if(!isNaN(maxX)){
      max = maxX;
    }
  }
  if(axis == "YAxisSelection") {
    d3.select("#y-axis-label").text(axisName)
    var minY = parseFloat(document.getElementById("y-min").value);
    var maxY = parseFloat(document.getElementById("y-max").value);
    if(!isNaN(minY)){
      min = minY;
    }
    if(!isNaN(maxY)){
      max = maxY;
    }
  }

  x = d3.scaleLinear().domain([min, max]).range([start, end]);

  return [x, type];
}

function displayPage() {

    if(scatterplotloaded == false) {
        setTimeout(displayPage, 2000);
    }

    else {

        document.getElementById("the-loading-screen").style.display = "none";
        document.getElementById("div-all-items").style.animation = "content-fade-in 3s 1";
        document.getElementById("div-all-items").style.display = "block";
    }
}
