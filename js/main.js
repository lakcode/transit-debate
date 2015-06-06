var data;
var loadingPanel;

var filteredData;

var hashtagList = [];

var filteredByHashtag = false;
var filteredByTime = false;

var HashtagFilter = function() {

	this.values = [];

	this.getTag = function (tagName) {
		for (var i = 0; i < values.length; i++) {
			if(values[i].name == tagName) return values[i];
		}
		return null;
	}

	this.addTag = function (tag) {
		//check if the tag is storedd alredy
		for (var i = 0; i < this.values.length; i++) {
			if(this.values[i].name == tag.name) return this.values[i];
		};
		this.values.push(tag);
		return tag;
	}

	this.removeTag = function (tagName) {
		for (var i = this.values.length-1; i >= 0; i--) {
			if(this.values[i].name == tagName) {
				this.values.splice(i,1);
				return null;
			}
		};
		return null;
	}
}

hashtagFilter = new HashtagFilter();

var initialAnimation;
var initialAnimationIncrement = 0;

var max_community_number = 0;


$( document ).ready(function() {
	loadingPanel = $("#loading");
	showLoading(true);
  	loadDataset();
 	resizeMain();
});

function showLoading(visible) {
    if (visible) {
        loadingPanel.css( "display", "block");
    } else {
        loadingPanel.css( "display", "none");
    }
}


function loadDataset() {
	// d3.json("data/debateD3.json", function(error, json) {
		// data = json;

	d3.json("data/debate.json", function(error, json) {
		

		data = processData(json);

		// console.log(data);


		data.nodes.forEach(function(node) {
		    node.attributes.date = new Date(node.attributes.date);
		});

		data.links.forEach(function(link) {
			//data
		    link.attributes.createdAt = new Date(link.attributes.createdAt);

		    addToHashtagList(link);

		});

		//sorting hashtaglist // descending

		hashtagList.sort(function (a, b) {
			if (a.values.length >= b.values.length) {
				return -1;
			}
			if (a.values.length < b.values.length) {
				return 1;
			}
		})


		filteredData = data;

		buildDatGUI();
		initForceLayout();
		initTimeline();
		updateFilterUI();

		// initialAnimation = setInterval(timerUp, 1000);
		showLoading(false);
	});
}

// function timerUp() {
// 	initialAnimationIncrement++;
//   	filterDateRange = [minPossibleDate,moment(minPossibleDate).add(initialAnimationIncrement,"days").toDate()];
//   	filterByDateRange(filterDateRange);
// }

function addToHashtagList(link) {

    link.attributes.hashtags.forEach(function(hashtag) {

    	var tagListID = -1;

    	for (var i=0; i < hashtagList.length; i++) {	

    		if(hashtag.toLowerCase() == hashtagList[i].name.toLowerCase()) {
    			tagListID = i;
    			break;
    		} else {
		    	tagListID = -1;
	    	}
	    }

	    if(tagListID < 0) {
    		var tag = {
    			name: hashtag,
    			currentCount: 1
    		};
			tag.values = [];
			tag.values.push({
				linkID: link.id,
				linkDate: link.attributes.createdAt
			});
			hashtagList.push(tag);
	    } else {
	    	hashtagList[tagListID].currentCount++;
	    	hashtagList[tagListID].values.push({
	    		linkID: link.id,
				linkDate: link.attributes.createdAt
	    	})
	    }
	    	
    })

}

function vizFilter(type,status) {

	filteredData = data;

	if (filteredByHashtag) {
		filteredData = filterByHashtag();
		updateTimelineFilterByHashtag("tags");
		if(type == "tag" && status == false) filteredByHashtag = false;
		calculateNodeDegree();
	}

	if (filteredByTime) {
		filteredData = filterByDateRange();
		updateTimelineFilterByHashtag();
	}

	updateForceLayout();

	updateFilterUI();

}


function filterByHashtag() {

	var filtered = {};

	var nodes = data.nodes;
	var links = data.links;

	var filteredNodes = [];
	var filteredLinks = [];


	hashtagFilter.values.forEach(function(filter) {
		//links
		links.forEach(function(link) {
			var linkTags = link.attributes.hashtags;
			//link tags
			linkTags.forEach(function(hashtag) {
				//if link tag matches with the filter
				if (filter.name.toLowerCase() == hashtag.toLowerCase()) {
					filteredLinks.push(link);
				}
			})
		});
	})

	//filter nodes based on links
	filteredLinks.forEach(function(link) {

		//filter nodes
		nodes.forEach(function(node) {
			
			if (node.label == link.sourceLabel) {
				addToFilter(node);
			}

			if (node.label == link.targetLabel) {
				addToFilter(node);
			}

		})

	})

	function addToFilter(node) {
		for (var i = 0; i < filteredNodes.length; i++) {
			if(filteredNodes[i].label == node.label) {
				return filteredNodes[i];
			}
		};
		filteredNodes.push(node);
		return node;
	}


	filtered.links = filteredLinks;
	filtered.nodes = filteredNodes;

	return filtered;

}

function filterByDateRange() {

	var filterd = {};

	var nodes = filteredData.nodes;
	var links = filteredData.links;

	var filteredNodes = [];
	var filteredLinks = [];
	var minDate = moment(filterDateRange[0]);
	var maxDate = moment(filterDateRange[1]);

	//filter links
	links.forEach(function(link) {
		var linkDate = moment(link.attributes.createdAt);
		if (linkDate.isBetween(minDate, maxDate)) {
			filteredLinks.push(link);
		}
	})

	//filter nodes based on links
	filteredLinks.forEach(function(link) {

		//filter nodes
		nodes.forEach(function(node) {
			
			if (node.label == link.sourceLabel) {
				addToFilter(node);
			}

			if (node.label == link.targetLabel) {
				addToFilter(node);
			}

		})

	})

	function addToFilter(node) {

		for (var i = 0; i < filteredNodes.length; i++) {
			if(filteredNodes[i].label == node.label) {
				return filteredNodes[i];
			}
		};

		filteredNodes.push(node);
		return node;
	}

	//filter hashtags
	hashtagList.forEach(function(tag) {
		tag.currentCount = 0;

		tag.values.forEach(function(link) {
			var tagDate = moment(link.linkDate);

			if (tagDate.isBetween(minDate, maxDate)) {
				tag.currentCount++;
			}
		})
	})

	hashtagList.sort(function (a, b) {
		if (a.currentCount >= b.currentCount) {
			return -1;
		}
		if (a.currentCount < b.currentCount) {
			return 1;
		}
	})

	if (networkControllerObject.nodeTimePersistent) {
		filterd.nodes = filteredData.nodes;
	} else {
		filterd.nodes = filteredNodes;
	}

	filterd.links = filteredLinks;

	return filterd;

}

function calculateNodeDegree() {

	var nodes = filteredData.nodes;
	var links = filteredData.links;

	nodes.forEach(function(node) {

		var currentInDegree = 0;
		var currentOutDegree = 0;

		links.forEach(function(link) {

			node.attributes.inDegreeLinks.forEach(function(IDL) {
				if (IDL.id == link.id) {
					// currentInDegree++;
					currentInDegree += link.weight;
				}
			});
			
			node.attributes.outDegreeLinks.forEach(function(ODL) {
				if (ODL.id == link.id) {
					// currentOutDegree++;
					currentOutDegree += link.weight;
				}
			});

		})

		node.attributes.inDegree = currentInDegree;
		node.attributes.outDegree = currentOutDegree;

	})

}


// ---- HASHTAG FILTER

function updateFilterUI() {

	var tagList = d3.select("#tagList");

		//remove all
	var tags = tagList.selectAll(".tag")
		.data([]);

	tags.exit().remove();
	
	var tags = tagList.selectAll(".tag")
		.data(hashtagList);

	tags.enter().append("a")
        .attr("class", "tag list-group-item")
        .text(function(d) { return d.name; })
      .append("span")
      	.attr("class","badge")
      	.text(function(d) { return d.currentCount; });

    tags.on("click", function(d) {
    	var tag = d3.select(this).datum();
    	hashtagFilter.addTag(tag)
    	updateHashtagSpace();
    	filteredByHashtag = true;
    	vizFilter();

    	//filterByHashtag();
    	//updateFilterByHashtag();

    	
     });

    tags.exit().remove();

}

function updateHashtagSpace() {

	var filterSpace = d3.select("#filterSpace");

	var well = filterSpace.selectAll(".well");

	if (well[0].length == 0) {

		well.data([1]).enter().append("div")
			.attr("class","well well-sm")
		  .append("div");

		well = filterSpace.selectAll(".well");
	} else {

		if (hashtagFilter.values == 0) {
			well.remove();
			vizFilter("tag",false);
			return;
		}
	};

	//remove all
	var activeFilterSpace = well.selectAll(".activeFilter")
		.data([]);

	activeFilterSpace.exit().remove();
	
	//add
	var activeFilterSpace = well.selectAll(".activeFilter")
		.data(hashtagFilter.values);

	activeFilterSpace.enter().append("div")
	  	.attr("class","activeFilter")
	  .append("span")
        .attr("class", "label label-primary")
        .text(function(d) { return d.name; })
      .append("span")
      	.attr("class", "glyphicon glyphicon-remove")
      	.on("click", function(d) {
	    	var tag = d3.select(this).datum();
	    	hashtagFilter.removeTag(tag.name);
	    	updateHashtagSpace();
	    	vizFilter();
	    	// filterByHashtag();
	     });

    activeFilterSpace.exit().remove();

}

// ---- RESIZE

$(window).resize(function() {
	resizeMain();
});

function resizeMain() {
	width = window.innerWidth;
	height = window.innerHeight;
	
	$("#lists").height(height-$("#lists").position().top);
}











