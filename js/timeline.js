var tweets;

var minPossibleDate;
var maxPossibleDate;

var filterDateRange;



function initTimeline() {

  tweets = data.links;

    // Various formatters.
  var formatNumber = d3.format(",d"),
      formatChange = d3.format("+,d"),
      formatDate = d3.time.format("%B %d, %Y"),
      formatTime = d3.time.format("%I:%M %p");

  //sort by date
  function sortByDateAscending(a, b) {
    // Dates will be cast to numbers automagically:
    return a.attributes.createdAt - b.attributes.createdAt;
  }

 tweets = tweets.sort(sortByDateAscending);


  //grouping by date
  var nestByDate = d3.nest()
    .key(function(d) { return d3.time.day(d.attributes.createdAt); })
    //.entries(tweets);


  // // Create the crossfilter for the relevant dimensions and groups.
  var tweetCrossFilter = crossfilter(tweets);
  var all = tweetCrossFilter.groupAll();
  var date = tweetCrossFilter.dimension(function(d) { return d.attributes.createdAt; });
  var dates = date.group(d3.time.day);
  var hour = tweetCrossFilter.dimension(function(d) { return d.attributes.createdAt.getHours() + d.attributes.createdAt.getMinutes() / 60; });
  var hours = hour.group(Math.floor);

  var dateTag = tweetCrossFilter.dimension(function(d) { return d.attributes.createdAt; });
  var datesTags = date.group(d3.time.day);

  var dateTagForChart = tweetCrossFilter.dimension(function(d) { return d.attributes.createdAt; });
  var datesTagsForChart = date.group(d3.time.day);

  //define date ranges

  minPossibleDate = moment(d3.min(tweets, function(d) { return d.attributes.createdAt; } ) ).startOf("day").toDate();
  maxPossibleDate = moment(d3.max(tweets, function(d) { return d.attributes.createdAt; } ) ).endOf("day").toDate();

  // filterDateRange = [minPossibleDate,maxPossibleDate];
  filterDateRange = [minPossibleDate,moment(minPossibleDate).add(3,"days").toDate()];
  filteredByTime = true;
  

  //charts
  var maxTimelineWidth = $("#timeline").innerWidth() - 20;

  var charts = [

    barChart()
        .dimension(date)
        .group(dates)
        .round(d3.time.day.round)
      .x(d3.time.scale()
        .domain([minPossibleDate,maxPossibleDate])
        .rangeRound([0, maxTimelineWidth]))
        .filter(filterDateRange)
  ];

  window.updateTimelineFilterByHashtag = function(type) {

    var filteredTweets = filteredData.links;

    function sortByDateAscending(a, b) {
      // Dates will be cast to numbers automagically:
      return a.attributes.createdAt - b.attributes.createdAt;
    }

    filteredTweets = filteredTweets.sort(sortByDateAscending);

    var filteredTweetCrossFilter = crossfilter(filteredTweets);
    dateTag = filteredTweetCrossFilter.dimension(function(d) { return d.attributes.createdAt; });
    datesTags = dateTag.group(d3.time.day);


    if(type == "tags") {
      
      var filteredTweetCrossFilterByTag = crossfilter(filteredTweets);
      dateTagForChart = filteredTweetCrossFilterByTag.dimension(function(d) { return d.attributes.createdAt; });
      datesTagsForChart = dateTag.group(d3.time.day);

    }

     renderAll();

  }

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { 
        chart.on("brush", renderAll)
             .on("brushend", renderAll);
        });

  // Render the initial lists.
  var list = d3.selectAll(".list")
      .data([tweetList]);

  // renderAll();
  vizFilter();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
    list.each(render);
    d3.select("#active").text(formatNumber(all.value()));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
    filterDateRange = [minPossibleDate,maxPossibleDate];
    vizFilter();
  };

  function tweetList(div) {
    var tweetsByDate = nestByDate.entries(dateTag.top(Infinity));

    div.each(function() {
      var date = d3.select(this).selectAll(".date")
          .data(tweetsByDate, function(d) { return d.key; });

      date.enter().append("div")
          .attr("class", "date")
        .append("div")
          .attr("class", "day")
          .text(function(d) { return formatDate(d.values[0].attributes.createdAt); });

      // date.style("position","relative")
      //       .style("top","2000px")
      //     .transition()
      //       .style("top","0px")
      //       .duration(1500)
      //       .delay(function(d,i) { return i*100;});
          

      date.exit().remove();

      var tweet = date.order().selectAll(".tweet")
          .data(function(d) { return d.values; });

      // tweet.style("position","relative")
      //       .style("left","-270px")
      //     .transition()
      //       .style("left","0px")
      //       .duration(700)
      //       .delay(function(d,i) { return 1500+ (i*100);});

      var tweetEnter = tweet.enter().append("div")
          .attr("class", "tweet");

      tweetEnter.on("mouseover", function(d) {
        var tweetDatum = d3.select(this).datum();
        highlightTweet(tweetDatum.id, tweetDatum.source.index, tweetDatum.target.index);
      });

      tweetEnter.on("mouseout", function(d) {
        highlightTweet(-1);
      });

      tweetEnter.append("div")
          .attr("class", "time")
          .text(function(d) { return formatTime(d.attributes.createdAt); });

      tweetEnter.append("div")
          .attr("class", "source")
          .text(function(d) { return d.sourceLabel; })

      tweetEnter.append("div")
          .attr("class", "retweet")
          .append("span").attr("class","glyphicon glyphicon-retweet")

      tweetEnter.append("div")
          .attr("class", "target")
          .text(function(d) { return d.targetLabel; });

      tweetEnter.append("div")
          .attr("class", "text")
          .text(function(d) { return d.attributes.text; });

      tweet.exit().remove();

      tweet.order();
    });
  }

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 5, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([65, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;


    function chart(div) {

      x.rangeRound([0, maxTimelineWidth]);
      
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);
      

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        var svg = div.select(".svgTimeline");
        var axisX = g.selectAll(".axis");

        var gBrush;

        // Create the skeletal chart.
        if (g.empty()) {

          div.append("div")
              .attr("class", "title")
              .text("Reweets per day")

          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          svg = div.append("svg")
              .attr("class","svgTimeline")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
          g = svg.append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground","filtered"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")")

          g.selectAll(".filtered.bar")
              // .attr("clip-path", "url(#clip-" + id + ")");
              .datum(datesTagsForChart.all());

          axisX = g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis.ticks(dates.size()));

          // Initialize the brush component with pretty resize handles.
          gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);

        } else { 

          //update

            svg.attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom);

            if((width/(dates.size()*1.5)) < 25) {
              axisX.call(axis.ticks(dates.size()/2));
            } else {
              axisX.call(axis.ticks(dates.size()));
            }

            

            // gBrush.selectAll("rect").attr("height", height);
            // gBrush.selectAll(".resize").append("path").attr("d", resizePath);

           brushDirty = true;
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));

              if (round) {
                g.select(".brush") 
                    .call(brush.extent(extent = extent.map(round)))
                  .selectAll(".resize")
                    .style("display", null);
              }
          }
        }

        g.selectAll(".filtered.bar").datum(datesTagsForChart.all());
        g.selectAll(".bar").attr("d", barPath);

      });

      function barPath(groups) {
        var pWidth = width/(dates.size()*1.5);
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key) + pWidth/5, ",", height, "V", y(d.value), "h"+pWidth+"V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);

    filterDateRange = extent;

    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();

        filterDateRange = [minPossibleDate,maxPossibleDate];
      }
      filteredByTime = true;

      vizFilter();
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }

  
  $(window).resize(function() {
    resizeTimeline();
  });

  resizeTimeline();

  function resizeTimeline() {
    var width = window.innerWidth
    var height = window.innerHeight - 5;
    maxTimelineWidth = $("#timeline").innerWidth() - 20;
    renderAll();
    
  }

};

