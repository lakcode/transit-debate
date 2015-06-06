//vars
var nodesData;
var linksData;

var force;
var node;
var link;

//size
var svg;
var networkContainerWidth = 600;
var networkContainerHeight = 580;
var graphInfo;

var defaultSize = 3;
var minRadius = 1;
var maxRadius = 10;

var defaultLinkWidth = 1;
var minLinkWidth = 1;
var maxLinkWidth = 5;


var NetworkControllerObject = function() {

  this.layout = "network";
  this.gravity = 3;
  this.charge = -120;
  this.linkDistance = 2;
  this.friction = 0.9;
  this.useCommunityDetection = false;
  this.useCollisionDetection = false;

  this.showNode = true;
  this.nodeTimePersistent = false;
  this.nodeScaleFactor = 1;
  this.nodeSize = "inDegree";
  this.nodeColor = "community";

  this.showNodeTitle = false;
  this.nodeTitleSize = "default";
  this.nodeTitleColor = "default";

  this.showLink = true;
  this.linkWidth = "weight";
  this.linkColor = "community";
  this.linkStrength = 1;

};

var networkControllerObject;

//load data
function initForceLayout() {


  // define force layout
  force = d3.layout.force()
    .charge(networkControllerObject.charge)
    .linkDistance(networkControllerObject.linkDistance)
    .gravity(networkControllerObject.gravity)
    .linkStrength(networkControllerObject.linkStrength)
    .friction(networkControllerObject.friction)
    .size([networkContainerWidth, networkContainerHeight]);

  // define svg
  svg = d3.select("#network").select("#graph").append("svg")
    .attr("width", networkContainerWidth)
    .attr("height", networkContainerHeight);

  graphInfo = d3.select("#graphInfo");

  updateForceLayout();

}

function updateForceLayout() {

 /// save data
  nodesData = filteredData.nodes;
  linksData = filteredData.links;

  graphInfo.text("nodes: " + nodesData.length + " | " + "links:" + linksData.length);
    

  //force data
  force.nodes(nodesData)
    .links(linksData)

  communityDetection()

  displayLinks();

  displayNodes();

  var clusterNest;

  force
    .charge(networkControllerObject.charge)
    .linkDistance(networkControllerObject.linkDistance)
    .gravity(networkControllerObject.gravity)
    .linkStrength(networkControllerObject.linkStrength)
    .friction(networkControllerObject.friction)


  if (networkControllerObject.layout == "network") {

    force.links(linksData)
  
  } else {

    force.links([])

      clusterNest = d3.nest()
          .key(function(d) { return d.community; })
          .entries(nodesData);
  }

  //iterations
  force.on("tick", function(e) {

    if (networkControllerObject.layout == "network") {

      if (networkControllerObject.showLink) {
        link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      }


      if (networkControllerObject.showNode) {
        var circle = node.selectAll(".circle")

        if(networkControllerObject.useCollisionDetection) {
          // if(e.alpha < 0.01) 
            circle.each(collide(e.alpha))
        }

        circle.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
      }


       //title position // dy - displace to show just below the node
      if(networkControllerObject.showNodeTitle) {
      
        var title = node.selectAll(".nodeTitle")
        title.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });

        if (networkControllerObject.showNode) {
            title.attr("dy", function(d) { 
              var node = d3.select(this.parentNode);
              var r = node.select(".circle").attr("r");
              return Number(r)+8;
            })
        }
      
      }

      

    } else if (networkControllerObject.layout == "cluster") {

      //for multi foci -- group separation
      // Push different nodes in different directions for clustering.
      var k = 40 * e.alpha;
      nodesData.forEach(function(o, i) {
        for (n=0; n < clusterNest.length; n ++) {
          if (o.community == clusterNest[n].key) {
              o.x += k * Math.cos(Number(clusterNest[n].key));
              o.y += k * Math.sin(Number(clusterNest[n].key));
              break;
          }
        }

      });

      if (networkControllerObject.showNode) {
        var circle = node.selectAll(".circle");


        if(networkControllerObject.useCollisionDetection) {
          // if(e.alpha < 0.01) 
            circle.each(collide(e.alpha))
        }
        
        circle.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
      }

      //title position // dy - displace to show just below the node
      if(networkControllerObject.showNodeTitle) {

        var title = node.selectAll(".nodeTitle")
        title.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });

        if (networkControllerObject.showNode) {
            title.attr("dy", function(d) { 
              var node = d3.select(this.parentNode);
              var r = node.select(".circle").attr("r");
              return Number(r)+8;
            })
        }
      
      }

    }


  });

};

// Resolve collisions between nodes.
function collide(alpha) {
  var padding = maxRadius*0.5; // separation between nodes
  var quadtree = d3.geom.quadtree(nodesData);
 
  return function(d) {
    
    var r = d.radius + maxRadius + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

function communityDetection() {

  var nodesData = filteredData.nodes;
  var linksData = filteredData.links;

  if(networkControllerObject.useCommunityDetection) {

    var original_node_data = d3.entries(filteredData.nodes);

    var nodesIndex = [];
    nodesData.forEach(function(d) {
      nodesIndex.push(d.index);
    });

    var edgesData = [];
    linksData.forEach(function(d) {
      var edge = {
        source: d.source.index,
        target: d.target.index,
        weight: d.weight
      }
      edgesData.push(edge);
    });

    var partition = {};
    nodesData.forEach(function(d) {
      partition[d.index] = d.attributes.modularityClass;
    });

    var community = jLouvain().nodes(nodesIndex).edges(edgesData);

    var community_assignment_result = community();
    var node_ids = Object.keys(community_assignment_result);

    max_community_number = 0;

    nodesData.forEach(function(d) {
      if(community_assignment_result[d.index]) {
        d.community = community_assignment_result[d.index]
        max_community_number = max_community_number < community_assignment_result[d.index] ? community_assignment_result[d.index]: max_community_number;
      }
      
    })

  } else {

    nodesData.forEach(function(d) {
      d.community = d.attributes.modularityClass;
    });

  }

}

function displayNodes() {

  // if (networkControllerObject.showNode) {

    //remove all
    nodesData = [];

    node = svg.selectAll(".node")
      .data(nodesData);

    node.exit().remove();

    //put all
    nodesData = filteredData.nodes;
    force.nodes(nodesData)
    
    node = svg.selectAll(".node")
      .data(nodesData);

    node.enter()
      .append("g")
        .attr("class", "node"); 

    if (networkControllerObject.showNode) {
      var circle = node.append("circle")
          .attr("class", "circle");

      circle.on("mouseover", function(d) {
        var nodeDatum = d3.select(this).datum();
        highlightEgo(nodeDatum.index);
      });

      circle.on("mouseout", function(d) {
        highlightEgo(-1)
      });

      circle.on("dblclick", function(d) {
        showNodeInfo(d);
        //force.stop();
      });

      circle.call(force.drag);

      updateNodeSize();
      updateNodeColor();

    }
    

    if(networkControllerObject.showNodeTitle) {

      node.append("text")
        .attr("class", "nodeTitle")
        .attr("text-anchor","middle")
        .text(function(d) { return d.label ;});

      updateNodeTitleColor();
      updateNodeTitleSize();
    }

    node.exit().remove();



    node.append("title")
      .text(function(d) { 
        return d.label 
          + "\n" + moment(d.attributes.date).format("DD MMM YYYY hh:mm")
          + "\nInDegree: " + d.attributes.inDegree
          + "\nOutDegree: " + d.attributes.outDegree;
      });

  force.start();

}

function displayLinks() {

  if (networkControllerObject.showLink) {

    linksData = filteredData.links;
    force.links(linksData)

    //draw visual objects - links first
    link = svg.selectAll(".link")
      .data(linksData);

    link.exit().remove();

    link.enter().append("line")
      .attr("class", "link");

    updateLinkColor();
    updateLinkWidth();

  } else {

    linkData = [];

    link = svg.selectAll(".link")
      .data(linkData);
    link.exit().remove();

  }

}

function updateNodeSize(transition) {

  var node = svg.selectAll(".circle")

  if (transition) {
    node = node.transition()
      .duration(1000);
  }

  if (networkControllerObject.nodeSize == "default") {
    defaultSize = 3;
    node.attr("r", function(d) {
      d.radius = defaultSize * networkControllerObject.nodeScaleFactor;
      return defaultSize * networkControllerObject.nodeScaleFactor;
    })

  } else {
    var scale = d3.scale.linear()
      .domain([0, d3.max(nodesData, function(d,i) { return d.attributes[networkControllerObject.nodeSize]; })])
      .range([minRadius, maxRadius]);

    node.attr("r", function(d,i) {
      d.radius = scale(d.attributes[networkControllerObject.nodeSize] * networkControllerObject.nodeScaleFactor)
      return scale(d.attributes[networkControllerObject.nodeSize] * networkControllerObject.nodeScaleFactor); 
    })
  }

  if(networkControllerObject.showNodeTitle) {
    updateNodeTitleSize(true);
  }

}

function updateNodeTitleSize(transition) {

  if(networkControllerObject.showNodeTitle) {

    var node = svg.selectAll(".node")

    if (transition) {
      node = node.transition()
        .duration(1000);
    }

    if (networkControllerObject.nodeTitleSize == "default") {
      node.attr("font-size", "0.5em")
    } else {
      var scale = d3.scale.linear()
        .domain([0.5, d3.max(nodesData, function(d,i) { return d.attributes[networkControllerObject.nodeSize]; })])
        .range([minRadius, maxRadius]);

      node.attr("font-size", function(d,i) {
        return scale(d.attributes[networkControllerObject.nodeSize])/6 + "em";
      })
    }

  }

}

function updateNodeColor(transition) {

  

  var node = svg.selectAll(".node");
  var link = svg.selectAll(".link");

  if (transition) {
    node = node.transition()
      .duration(1000);
    link = link.transition()
      .duration(1000);
  }

  if (networkControllerObject.nodeColor == "default") {

    node.style("fill", "#333")
    node.style("stroke", d3.rgb("#333").darker(0.4));

    link.style("stroke", "#999");

  } else if (networkControllerObject.nodeColor == "community") {

    if(networkControllerObject.useCommunityDetection) {

      var color = d3.scale.category20().domain(d3.range([0,max_community_number]));

      node.style("fill", function(d) { return color(d.community); })
      node.style("stroke", function(d) { return d3.rgb(color(d.community)).darker(0.4); });

      if (networkControllerObject.linkColor == "community") {
        link.style("stroke", function(d) {
          return color(d.source.community); 
        });
      } else {
        link.style("stroke", "#999")
      }


    } else {

      node.style("fill", function(d) { return d3.rgb(d.color); })

      node.style("stroke", function(d) { return d3.rgb(d.color).darker(0.4); });

      if (networkControllerObject.linkColor == "community") {
        link.style("stroke", function(d) { return d3.rgb(d.color); });
      } else {
        link.style("stroke", "#999")
      }

    }

  } else {
    var scale = d3.scale.linear()
      .domain([0, d3.max(nodesData, function(d,i) { return d.attributes[networkControllerObject.nodeColor]; })])
      .range([255, 1]);

    node.style("fill", function(d) { 
      return d3.rgb(
          scale(d.attributes[networkControllerObject.nodeColor]),
          scale(d.attributes[networkControllerObject.nodeColor]),
          scale(d.attributes[networkControllerObject.nodeColor])
        ); 
    })

    node.style("stroke", function(d) {
      return d3.rgb(
          scale(d.attributes[networkControllerObject.nodeColor]),
          scale(d.attributes[networkControllerObject.nodeColor]),
          scale(d.attributes[networkControllerObject.nodeColor]))
        .darker(0.4);

      });
    
    link.style("stroke", "#999");

  }

  if(networkControllerObject.showNodeTitle) {
    var title = node.selectAll(".nodeTitle")
      .attr("fill", "inherit")
      .attr("stroke-width","0px");
  }

}

function updateNodeTitleColor(transition) {

  if(networkControllerObject.showNodeTitle) {

    var title = node.selectAll(".nodeTitle")

    if (transition) {
      title = title.transition()
        .duration(1000);
    }

    if (networkControllerObject.nodeTitleColor == "default") {

      title.style("fill", "#333");

    } else if (networkControllerObject.nodeTitleColor == "community") {

      // title.style("fill", "inherit");
      title.style("fill", function(d) { return d3.rgb(d.color); })

    }

  }

}

function updateLinkWidth(transition) {

  var link = svg.selectAll(".link")

  if (transition) {
    link = link.transition()
      .duration(1000);
  }

  if (networkControllerObject.linkWidth == "default") {
    link.style("stroke-width", defaultLinkWidth)
  } else {
    var scale = d3.scale.linear()
      .domain([0, d3.max(linksData, function(d) { return d.weight; })])
      .range([minLinkWidth, maxLinkWidth]);

    link.style("stroke-width", function(d) { return scale(d.weight); })
  }

}

function updateLinkColor(transition) {

  var link = svg.selectAll(".link")

  if (transition) {
    link = link.transition()
      .duration(1000);
  }

  if (networkControllerObject.linkColor == "default") {
    link.style("stroke", "#999")
  } else {
    link.style("stroke", function(d) { return d3.rgb(d.color); });
  }

}

function highlightEgo(nodeIndex) {

  if (nodeIndex == -1) {

    svg.selectAll(".node")
      .style("opacity", 1);

    svg.selectAll(".link")
      .style("stroke-opacity", 0.2);

  } else {

    var adjacentNodes = [];

    
    svg.selectAll(".link")
      .style("stroke-opacity", function(d) {
        if (d.source.index == nodeIndex || d.target.index == nodeIndex) {
          return 0.6;
        } else {
          return 0.05;
        }
      })
      .each(function(d) {

        if (d.source.index == nodeIndex) {
          adjacentNodes.push(d.target.index);
        }

        if (d.target.index == nodeIndex) {
          adjacentNodes.push(d.source.index);
        }

      });

      svg.selectAll(".node")
      .style("opacity", function(d) {
        if (d.index == nodeIndex) {
          return 1;
        } else {

          var nodeOpacity = 0.1;
         
          for (var a = 0; a < adjacentNodes.length; a++) {
            if (d.index == adjacentNodes[a]) {
              nodeOpacity =  0.6;
              break;
            }
          }

          return nodeOpacity;
          
        }
      });

  }
  
}

function highlightTweet(linkID, sourceID, targetID) {

  if (linkID == -1) {

    svg.selectAll(".node")
      .style("opacity", 1);

    svg.selectAll(".link")
      .style("stroke-opacity", 0.2);

  } else {

    svg.selectAll(".node")
      .style("opacity", function(d) {
        if (d.index == sourceID || d.index == targetID) {
          return 1;
        } else {
          return 0.2;
        }
      });

    svg.selectAll(".link")
      .style("stroke-opacity", function(d) {
        if (d.id == linkID) {
          return 0.6;
        } else {
          return 0.05;
        }
      });

  }
  
}

function showNodeInfo(nodeInfo) {
  // console.log(nodeInfo)  

  //displays

  var panel = d3.select("#nodeinfo")
    .append("div")
      .attr("class","panel panel-default")
      .attr("id","nodeInfo"+nodeInfo.index)
      .on("mouseover", function(d) {
        highlightEgo(nodeInfo.index);
      })
      .on("mouseout", function(d) {
        highlightEgo(-1);
      });
    
  var head = panel
    .append("div")
      .attr("class","panel-heading")
      .attr("data-toggle","collapse")
      .attr("data-target","#collapse"+nodeInfo.index)
      

  head.append("h3")
    .attr("class","panel-title")
    .text(nodeInfo.label)
  .append("button")
    .attr("type", "button")
    .attr("class","close")
  .append("span")
    .attr("class", "glyphicon glyphicon-remove")
    .style("font-size","0.7em")
    .on("click", function(d) {
      highlightEgo(-1);
      var thisPanel = d3.select(this.parentNode.parentNode.parentNode.parentNode);
      thisPanel.remove();
    });

  var body = panel
    .append("div")
      .attr("class","panel-body collapse in")
      .attr("id","collapse"+nodeInfo.index);

  body.append("div")
      .html("<b>Description:</b> "
        + nodeInfo.attributes.userDescription[nodeInfo.attributes.userDescription.length-1].description
      );

  body.append("div")
    .html("<b>First Retweet:</b> "
     + moment(nodeInfo.attributes.date).format("DD MMM YYYY HH:mm:ss"));

  body.append("div")
    .html("<b>Modularity Class:</b> "
     + nodeInfo.attributes.modularityClass);

  body.append("div")
    .html("<b>InDegree:</b> "
     + nodeInfo.attributes.inDegree)
     // + "[" + nodeInfo.attributes.inDegreeLinks.length + "]"
     // );

  body.append("div")
    .html("<b>OutDegree:</b> "
     + nodeInfo.attributes.outDegree);
     // + "[" + nodeInfo.attributes.outDegreeLinks.length + "]"
     // );

}

function buildDatGUI() {

  networkControllerObject = new NetworkControllerObject();
  
  ////////// DAT
  var networkGUI = new dat.GUI();
  
  //controller actions
  var folderFL = networkGUI.addFolder('Force Layout');
  var layoutControl = folderFL.add(networkControllerObject, 'layout', ["network","cluster"]);
  var gravityControl = folderFL.add(networkControllerObject, 'gravity', 0, 4).step(0.1).listen();
  var chargeControl = folderFL.add(networkControllerObject, 'charge', -1500, 0).step(10).listen();
  var linkDistanceControl = folderFL.add(networkControllerObject, 'linkDistance', 0, 200).step(2).listen();
  var frictionControl = folderFL.add(networkControllerObject, 'friction', 0, 1).step(0.1).listen();
  var useCommunityDetectionControl = folderFL.add(networkControllerObject, 'useCommunityDetection');
  var useCollisionDetectionControl = folderFL.add(networkControllerObject, 'useCollisionDetection');

  var folderNodes = networkGUI.addFolder('Nodes');
  var showNodeControl = folderNodes.add(networkControllerObject, 'showNode');
  var nodeTimePersistentControl = folderNodes.add(networkControllerObject, 'nodeTimePersistent');
  var showNodeScaleFactorControl = folderNodes.add(networkControllerObject, 'nodeScaleFactor', 1, 5);
  var nodeSizeControl = folderNodes.add(networkControllerObject, 'nodeSize', ["inDegree","outDegree","betweennessCentrality","closenessCentrality","default"]);
  var nodeColorControl = folderNodes.add(networkControllerObject, 'nodeColor', ["community","inDegree","outDegree","betweennessCentrality","closenessCentrality","default"]);
  
  var showNodeTitleControl = folderNodes.add(networkControllerObject, 'showNodeTitle');
  var nodeTitleSizeControl = folderNodes.add(networkControllerObject, 'nodeTitleSize', ["default","inherit"]);
  var nodeTitleColorControl = folderNodes.add(networkControllerObject, 'nodeTitleColor', ["default","community"]).listen();
  
  var folderLinks = networkGUI.addFolder('Link');
  var showLinkControl = folderLinks.add(networkControllerObject, 'showLink').listen();
  var linkWidthControl = folderLinks.add(networkControllerObject, 'linkWidth', ["weight","default"]);
  var linkColorControl = folderLinks.add(networkControllerObject, 'linkColor', ["community","default"]);
  var linkStrengthControl = folderLinks.add(networkControllerObject, 'linkStrength', ["equal","byLinkWeight"]);


  networkGUI.close();

  layoutControl.onChange(function(value) {
    if (value == "network") {
      networkControllerObject.showLink = true;
      networkControllerObject.gravity = 3;
      networkControllerObject.friction = 0.9;

    } else if (value == "cluster") {
      networkControllerObject.showLink = false;
      networkControllerObject.gravity = 0.7;
      networkControllerObject.friction = 0.1;

    }

    updateForceLayout();
  });
  
  gravityControl.onChange(function(value) {
    force.gravity(value);
    force.start();
  });

  chargeControl.onFinishChange(function(value) {
    force.charge(value);
    force.start();
  });

  linkDistanceControl.onFinishChange(function(value) {
    force.linkDistance(value);
    force.start();
  });

  frictionControl.onFinishChange(function(value) {
    force.friction(value);
    force.start();
  });

  useCommunityDetectionControl.onFinishChange(function(value) {
    updateForceLayout();
  });

  useCollisionDetectionControl.onFinishChange(function(value) {
    updateForceLayout();
  });

  showNodeControl.onChange(function(value) {
    updateForceLayout();
  });

  nodeTimePersistentControl.onChange(function(value) {
    vizFilter();
  });

  showNodeScaleFactorControl.onChange(function(value) {
    // updateNodeSize(true);
    maxRadius = 10*value;
    updateForceLayout()
  });

  nodeSizeControl.onChange(function(value) {
    updateNodeSize(true);
  });

  nodeColorControl.onChange(function(value) {
    updateNodeColor(true);
  });

  showNodeTitleControl.onChange(function(value) {
    updateForceLayout();
  });

  nodeTitleColorControl.onChange(function(value) {
    updateNodeTitleColor(true);
  });

  nodeTitleSizeControl.onChange(function(value) {
    updateNodeTitleSize(true);
  });

  showLinkControl.onChange(function(value) {
    updateForceLayout();
  });

  linkWidthControl.onChange(function(value) {
    updateLinkWidth(true);
  });

  linkColorControl.onChange(function(value) {
    updateLinkColor(true);
  });

  linkStrengthControl.onFinishChange(function(value) {
    if (value == "equal") {
      force.linkStrength(0.1);
    } else {
      var scale = d3.scale.linear()
        .domain([0, d3.max(linksData, function(d) { return d.weight; })])
        .range([0.1, 1]);

      force.linkStrength(function(link) {
        return scale(link.weight);
      })

    }
    
    force.start();

  });

  $(window).resize(function() {
    resizeForce();
  });

  resizeForce()

}

function resizeForce() {
  var width = window.innerWidth, height = window.innerHeight;
  networkContainerWidth = width - $("#side").width() - 10;
  networkContainerHeight = height - $("#timeline").height();
  if (svg) svg.attr("width", networkContainerWidth).attr("height", networkContainerHeight);
  if (force) force.size([networkContainerWidth, networkContainerHeight]).resume();
}