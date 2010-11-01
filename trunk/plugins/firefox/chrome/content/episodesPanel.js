/*
TODO
  - time tick marks
  - FF2 poll for EPISODES:done
*/


FBL.ns(function() { with (FBL) {
Firebug.EpisodesModule = extend(Firebug.Module,
	{
		//**************************************
		//Extends module
		shutdown: function() {
			if(Firebug.getPref('defaultPanelName')=='episodes') {
				Firebug.setPref('defaultPanelName','console');
			}
		},

		initContext: function(context) {
			// Record the time that the HTML document has loaded.
			Firebug.episodesFirstByte = Number(new Date());
		},

		// Called when page changes.
		// Putting the onload listener here ensures that the components are downloaded even
		// when the YSlow panel is NOT selected, and even when Firebug is closed (but enabled).
		// Also, it does it late enough that the window is available.
		watchWindow: function(context, win) {
			dprint(9, "watchWindow: enter");
			if ( "undefined" === typeof(context.episodesContext) ) {
				context.episodesContext = new EpisodesContext(undefined, win);
			}

			// Listen for this page to onload so we can record the end time.
			win.addEventListener("load", this.doOnload, false);

			// Listen for this page to unload so we can record the start time for the next page.
			win.addEventListener("beforeunload", this.doUnload, false);
		},

		doOnload: function() {
			dprint(9, "doOnload: enter");
			Firebug.episodesEndTime = Number(new Date());
			FirebugContext.episodesContext.doDefaultEpisodes();
		},

		doUnload: function() {
			dprint(9, "doUnload: enter");
			// TODO - This won't work on the very first page view or if you open in a new tab or window.
			// TODO - This won't work if multiple tabs in the browser window are doing Episodes simulataneously.
			Firebug.episodesStartTime = Number(new Date());  // need to hold it somwhere that persists across pages
		},

		showPanel: function(browser, panel) {
			dprint(9, "showPanel: enter");
		},

		loadedContext: function(context) {
			dprint(9, "loadedContext: enter");
			// Need this for detach to work.
			if ( gLatestEpisodesContext ) {
				context.episodesContext = gLatestEpisodesContext;
			}
		},

		reattachContext: function(context) {
			dprint(9, "reattachContext: enter");
			// Need this for detach to work.
			if ( ! FirebugContext.getPanel("episodes").document.EPISODES ) {
				FirebugContext.getPanel("episodes").document.EPISODES = FirebugContext.getPanel("episodes");
			}
		},

		destroyContext: function(context) {
			dprint(9, "destroyContext: enter");
			// Need this for detach to work.
			gLatestEpisodesContext = undefined;
		}
	}
);


function EpisodesPanel() {}
EpisodesPanel.prototype = extend(Firebug.Panel,
	{
		name: "episodes",
		title: "Episodes",
		searchable: false,
		editable: false,

		// Initialize the panel. This is called every time the browser's HTML document changes.
		initializeNode: function() {
			dprint(9, "EpisodesPanel.initializeNode: enter");
			if ( "undefined" === typeof( FirebugContext.episodesContext ) ) {
				FirebugContext.episodesContext = new EpisodesContext(this, FirebugContext.window);
			}
			else {
				FirebugContext.episodesContext.setPanel(this);
			}

			// Save a pointer back to this EpisodesPanel so we can have callbacks from  inside the panel's document.
			this.document.EPISODES = this;

			this.panelNode.style.backgroundColor = "#FFFFFF";

			var sHtml = 
				'<style>\n' +
				'.hoverline,.hoverline:visited { text-decoration: none; }\n' +
				'.hoverline:hover { text-decoration: underline; }\n' +
				'</style>\n' +
				'<div id=episodesdiv style="padding: 4px; font-size: 11pt;" height=100%>\n' +
				'<a href="javascript:document.EPISODES.openLink(\'http://stevesouders.com/episodes/\')"' +
				' style="text-decoration: underline">Episodes: for timing web pages</a>\n' +
				'</div>\n' +
				'';
			FirebugContext.episodesContext.addButtonView("episodesview", sHtml);
		},

		drawEpisodicTimes: function() {
			dprint(9, "drawEpisodicTimes: enter");

			// If this page doesn't use Episodes, create some default ones.
			
			// Put the episodes in order by start time and duration.
			var starts = FirebugContext.episodesContext.starts;
			var measures = FirebugContext.episodesContext.measures;
			var tFirst, tLast;
			var aEpisodes = new Array(); // in order
			for ( var episodeName in measures ) {
				var episodeStart = starts[episodeName];
				var episodeEnd = starts[episodeName] + measures[episodeName];
				tFirst = ( "undefined" === typeof(tFirst) || tFirst > episodeStart ? episodeStart : tFirst );
				tLast = ( "undefined" === typeof(tLast) || tLast < episodeEnd ? episodeEnd : tLast );

				var index = 0;
				for ( var i = 0; i < aEpisodes.length; i++ ) {
					var curName = aEpisodes[i];
					if ( episodeStart < starts[curName] ||
						 ( episodeStart == starts[curName] && episodeEnd > starts[curName]+measures[curName] ) ) {
						break;
					}
					index++;
				}
				aEpisodes.splice(index, 0, episodeName);
			}

			var div = this.getCurElement("episodesdiv");
			var nPixels = this.context.window.innerWidth-80;
			var PxlPerMs = nPixels / (tLast - tFirst);
			var sHtml = "Episodes:";
			for ( var i = 0; i < aEpisodes.length; i++ ) {
				var episodeName = aEpisodes[i];
				var leftPx = parseInt(PxlPerMs * (starts[episodeName] - tFirst)) + 40;
				var widthPx = parseInt(PxlPerMs * measures[episodeName]);
				sHtml += '<div style="background: #EEE; border: 1px solid; padding-bottom: 2px; font-size: 10pt; position: absolute; left: ' + leftPx + 
					'px; top: ' + (i*30 + 40) + 
					'px; width: ' + widthPx +
					'px; height: 16px;"><nobr>&nbsp;' + episodeName + 
					//' (' + starts[episodeName] + ', ' + measures[episodeName] + ')' +
					//' (' + this.getDebugTime(starts[episodeName]) + ' - ' + this.getDebugTime(starts[episodeName] + measures[episodeName]) + ')' +
					' - ' + measures[episodeName] + 'ms' +
					'</nobr></div>\n';
			}
			div.innerHTML = sHtml;
		},

		getDebugTime: function(epochTime) {
			var date = new Date(epochTime);
			var sTime = date.toLocaleTimeString();
			sTime = sTime.substring(0, sTime.length - 3);  // strip off " PM"
			sTime += "." + date.getMilliseconds();
			return sTime;
		},

		isCompatible: function() {
			dprint(9, "isCompatible: enter");
			return ( 0 < navigator.userAgent.indexOf("Firefox/3") );
		},

		getAllElementsByTagName: function(tagname) {
			// Tricky because you can't push HTML collections.
			var aResults = [];

			// Get all elements for the main document.
			var aElements = FirebugContext.window.document.getElementsByTagName(tagname);
			for ( var i = 0; i < aElements.length; i++ ) {
				aResults.push(aElements[i]);
			}

			// Get all elements for frames.
			if ( FirebugContext.window.frames ) {
				for ( var f = 0; f < FirebugContext.window.frames.length; f++ ) {
					var aElements = FirebugContext.window.frames[f].document.getElementsByTagName(tagname);
					for ( var i = 0; i < aElements.length; i++ ) {
						aResults.push(aElements[i]);
					}
				}
			}

			return aResults;
		},

		show: function() {
			dprint(9, "EpisodesPanel:show");
			if ( "undefined" === typeof(FirebugContext.episodesContext) ) {
				return;
			}

			gLatestEpisodesContext = FirebugContext.episodesContext; // need to save this to make detach work
			FirebugContext.episodesContext.show();
		},

		openLink: function(url) {
			if (ggGetPref("browser.link.open_external") == 3) {
				gBrowser.selectedTab = gBrowser.addTab(url);
			}
			else {
				FirebugChrome.window.open(url, "_blank");
			}
		},

		// Wrapper around getting an element from the current Button View.
		getCurElement: function(sId) {
			return FirebugContext.episodesContext.getViewElementById(sId);
		},

		// Convert < and > to &lt; and &gt;
		escapeHtml: function(html) {
			var result = html;
			result = result.replace(new RegExp("<", "g"), "&lt;");
			result = result.replace(new RegExp(">", "g"), "&gt;");
			return result;
		},

		printObject: function(obj) {
			var msg = "";
			for ( var key in obj ) {
				try {
					if ( "function" == typeof(obj[key]) ) {
						msg += key + " = [function]\n";
					}
					else {
						msg += key + " = " + obj[key] + "\n";
					}
				}
				catch (err) {
					// Probably security restrictions accessing this key.
					msg += key + " - ERROR: unable to access\n";
				}
				if ( msg.length > 400 ) {
					alert(msg);
					msg = "";
				}
			}
			alert(msg);
		}
	}
);


Firebug.registerModule(Firebug.EpisodesModule);
Firebug.registerPanel(EpisodesPanel);

}});
