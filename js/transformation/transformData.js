// $.getJSON("debate.json", function(debate){

// 	var data = processData(debate)
// 	// printJson(data);
// });

function processData(data) {

	processLinks(data);
	processNodes(data);

	return data;
}

function processLinks(data) {

	data.links.forEach(function(link) {

		if (!link.sourceLabel) link.sourceLabel = link.source;
		if (!link.targetLabel) link.targetLabel = link.target;

		if (link.id) link.id = Number(link.id);

		if (link.attributes.Text) {
			link.attributes.text = link.attributes.Text;
			delete link.attributes.Text;
		}

		if (link.attributes.Weight) {
			link.weight = Number(link.attributes.Weight);
			delete link.attributes.Weight;
		}

		if (link.attributes["User Followers"]) {
			link.attributes.userFollowers = Number(link.attributes["User Followers"]);
			delete link.attributes["User Followers"];
		}

		if (link.attributes.Hashtags) {
			var hashtag = link.attributes.Hashtags.split("; ");
			link.attributes.hashtags = [];
			link.attributes.hashtags = hashtag;
			delete link.attributes.Hashtags;
		}

		if (link.attributes["User Description"]) {
			link.attributes.userDescription = link.attributes["User Description"];
			delete link.attributes["User Description"];
		}


		if (link.attributes["Created At"]) {
			link.attributes.createdAt = new Date(link.attributes["Created At"]);
			delete link.attributes["Created At"];
		}

		if (link.attributes["Created At Date"]) delete link.attributes["Created At Date"];

		if (link.attributes["Rt Count"]) {
			link.attributes.rtCount = Number(link.attributes["Rt Count"]);
			delete link.attributes["Rt Count"];
		}

	});

	// console.log("links done");
};

function processNodes(data) {

	var index = 0;

	data.nodes.forEach(function(node) {

		node.index = index;
		index++;

		node._x = node.x;
		node._y = node.y;
		
		delete node.x;
		delete node.y;

		if (node.attributes["Betweenness Centrality"]) {
			node.attributes.betweennessCentrality = Number(node.attributes["Betweenness Centrality"]);
			delete node.attributes["Betweenness Centrality"];
		}

		if (node.attributes["Modularity Class"]) {
			node.community = Number(node.attributes["Modularity Class"]);
			node.attributes.modularityClass = Number(node.attributes["Modularity Class"]);
			delete node.attributes["Modularity Class"];
		}

		if (node.attributes["Eccentricity"]) {
			node.attributes.eccentricity = Number(node.attributes["Eccentricity"]);
			delete node.attributes["Eccentricity"];
		}

		if (node.attributes["Closeness Centrality"]) {
			node.attributes.closenessCentrality = Number(node.attributes["Closeness Centrality"]);
			delete node.attributes["Closeness Centrality"];
		}

		node.attributes.inDegree = 0;
		node.attributes.outDegree = 0;

		processNodeLinkRelationship(data,node);

		if (!node.attributes.userDescription) {
			node.attributes.userDescription = [{
					description: "null",
					date: "null"
				}];
		}

	});

// console.log("nodes done");

}

function processNodeLinkRelationship(data,node) {

	node.attributes.outDegreeLinks = [];
	node.attributes.inDegreeLinks = [];

	data.links.forEach(function(link) {

		if (node.label == link.sourceLabel) {
			link.source = node.index;

			addDateToNode(node,link);

			node.attributes.outDegreeLinks.push({
				id: link.id,
				date: link.attributes.createdAt,
			});

			// node.attributes.outDegree++;
			node.attributes.outDegree += link.weight;

			addUserDescription(node,link);
			delete link.attributes.userDescription; //delete user description from link
			
		}

		if (node.label == link.targetLabel) {
			link.target = node.index;

			addDateToNode(node,link);
			
			node.attributes.inDegreeLinks.push({
				id: link.id,
				date: link.attributes.createdAt
			});

			// node.attributes.inDegree++;
			node.attributes.inDegree += link.weight;

		}		

	});

	node.attributes.inDegreeTotal = node.attributes.inDegree;
	node.attributes.outDegreeTotal = node.attributes.outDegree;

}

function addUserDescription(node,link) {

	//if node does not have user description yet
	if (!node.attributes.userDescription) {

		//if user description is not set
		if (!link.attributes.userDescription) {

			//save null
			node.attributes.userDescription = [{
					description: "null",
					date: link.attributes.createdAt
				}];

		} else {

			//save user description
			node.attributes.userDescription = [{
					description: link.attributes.userDescription,
					date: link.attributes.createdAt
				}];
		}

	} else {

		// test if it is the same description
		for (var i=0; i < node.attributes.userDescription.length; i++) {
			if (node.attributes.userDescription[i].description == link.attributes.userDescription) {
				break;
			} else {
				//save new user description
				node.attributes.userDescription.push({
					description: link.attributes.userDescription,
					date: link.attributes.createdAt
				});
			}
		}
		
		
	}

}

function addDateToNode(node,link) {

	if (!node.attributes.date) {
		node.attributes.date = link.attributes.createdAt;
	} else {

		var nodeDate = moment(node.attributes.date);
		var linkDate = moment(link.attributes.createdAt);

		if (linkDate.isBefore(nodeDate)) {
			node.attributes.date = link.attributes.createdAt;
		}
	}

}

function printJson(data) {
	var str = JSON.stringify(data, null, 2); // spacing level = 2
	// console.log("end");
	$('#data').append(str);

}



