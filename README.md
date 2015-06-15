# Demo:
http://labs.fluxo.art.br/transit-debate/

# About
Between January and may 2015 Metro Vancouver was immersed in a debate about public investments in transit for the next 30 years. The topic became controversial when Mayor’s Council proposed to increase the sales taxes to fund the project, and a referendum was called to decide about the adoption of this new revenue sources for Metro Vancouver transportation.

Nowadays, part of the public discussions happen online, especially on social platforms, like Twitter. During 30 days, from Feb 11 to March 11, we capture this conversation on Twitter to investigate how digital social media platforms has been used to broadcast information of public interest, as well as promote civic engagement. This visualization maps and explorer public opinion and interactions among people using this platform about the Vancouver Transit Referendum.

#Methodology

##Data Collection

The conversation about the proposed referendum was first anchored with the hashtag #cutcongestion, the mote of the official Mayors’ Council campaign. Drawn from a one-week exploratory analysis using the hashtag above, we thought that this hashtag would be very narrow to account for the interaction of other groups, especially from people that would disagree with the proposed transit plan. To have a broader view of the debate, we added the top most hashtags used with #cutcongestion and between February 11 to March 11 2015 we used Twitter Search API to collect and store almost 100,000 public tweets from about 21,000 profiles using the following hastags:

*#cutcongestion*
Mote of the official Mayors’ Council campaign.
  #transitreferendum
Used as a more general and neutral anchor that quickly replaces the official #cutcongestion mote.
###yes4transit
Mostly used by people in favour of the Mayor’s council plane.
###notranslinktax
Used to protest against the idea to give more money to the regional transit company.
###TransLink
The regional transit company.
###BCpoli
Anchors the political debate in British Columbia, Canada.
###vanpoli
Anchors the political discussions in Vancouver, Canada.
However, a few problems emerged in the analysis process. Tweets contains the hashtag #translink, can refer not only to the local transit service company, but also to other communication and transportation companies around the globe, particularly at UK, Australia, and USA. #vanpoli and #bcpoli are both locally recognized as aggregator terms for the political discussion in Vancouver and British Columbia (Canada), respectively. But the scope of these topics is very broad, covering all ranges of regional political topics (e.g., environment, finances, taxes, heath).

To solve the problem we used #vanpoli and #bcpoli to filter #translink. That is, from these three hashtags, we only keep tweets containing both #vanpoli and #translink, or both #bcpoli and #translink. After removing duplicates that overlaps across the selected hashtags, our dataset was reduced to 8,755 tweets from 2,710 profiles, using 437 different hashtags.

##Visualization

To maps and explorer the network’s structure and user interactions, we examined a subset of the corpus, composed by tweets that connect people (i.e., retweets). We used Gephi to produced a series of visualizations and apply metrics capable of providing dynamic configuration and operation of the network connected to the debate through the selected hashtags. We aimed to identify and understand the nature of the main actors (nodes) according to their position in the network. In this study we considered the following features:

Centrality
Defines the significance of an actor in the network. An actor is central when they directly or indirectly communicate to a large number of people.
Authority
Correspond to the number of links a node receives: the higher the number, the greater its authority.
HUB
Correspond to the number of links a node makes: the higher the number of links, the greater the chances of a node to become a hub
Betweenness Centrality
Defines the ability to intermediate the information flow between different parts of the network.
The next step was the development of this interactive visualization using [D3.js](http://d3js.org) and a few other web based components. Our goal is to encourage more people to explore the dynamic of social media networks and its impacts in the society, as well as ease the process of investigation of network graphs and social media interactions without using specialized tools.
