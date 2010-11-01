
EpisodesContext = function(panel, win) {
    dprint(9, "EpisodesContext: enter");
	// do this right away!
	if ( win ) {
		this.setWindow(win);
	}

	if ( panel ) {
		this.setPanel(panel);
	}

	this.initEpisodes();
};


EpisodesContext.prototype.initEpisodes = function() {
    dprint(9, "EpisodesContext.prototype.initEpisodes: enter");
	this.marks = {};
	this.measures = {};
	this.starts = {};
	this.retryCount = 0;
	this.bDrawEpisodes = false;
	this.bHasEpisodes = false;

	if ( ! this.isCompatible() ) {
		// We have to poll for data since we won't get events.
		this.pollForEpisodes();
	}
	else {
		// For compatible browsers we set up an event listener just once in the constructor.
	}
};


EpisodesContext.prototype.handleEpisode = function(e) {
    dprint(9, "EpisodesContext.prototype.handleEpisode: enter");
	var message = e.data;
	var aParts = message.split(':');
	if ( "EPISODES" === aParts[0] ) {
		var action = aParts[1];
		if ( "init" === action ) {
			// example: window.postMessage("EPISODES:init")
			this.initEpisodes();
		}
		else if ( "mark" === action ) {
			// example: window.postMessage("EPISODES:mark:<markName>:[epochtime]")
			var markName = aParts[2];
			this.marks[markName] = aParts[3] || Number(new Date());
		}
		else if ( "measure" === action ) {
			// example: window.postMessage("EPISODES:measure:<episodeName>:[markName|starttime]:[markName|endtime]", "*")
			var endTime = ( "undefined" === typeof(aParts[4]) ? Number(new Date()) : 
							( "undefined" != typeof(this.marks[aParts[4]]) ? this.marks[aParts[4]] : aParts[4] ) );
			var episodeName = aParts[2];
			// If no markName is specified, assume it's the same as the episode name.
			var markName = ( "undefined" != typeof(aParts[3]) ? aParts[3] : episodeName );
			if ( "starttime" === markName && "undefined" === typeof(this.marks["starttime"]) ) {
				// special case - It's hard for web pages to record the time the previous page unloaded.
				// If this web page didn't track that, we'll do it.
				this.marks["starttime"] = Firebug.episodesStartTime; // this gets set in EpisodesModule.watchWindow
			}
			else if ( "firstbyte" === markName && "undefined" === typeof(this.marks["firstbyte"]) ) {
				// special case - It's hard for web pages to record the arrival of the HTML document.
				// If this web page didn't track that, we'll do it.
				this.marks["firstbyte"] = Firebug.episodesFirstByte; // this gets set in EpisodesModule.initContext
			}
				
			// If the markName doesn't exist, assume it's an actual time measurement.
			var startTime = ( "undefined" != typeof(this.marks[markName]) ? this.marks[markName] : ( ("" + markName) === parseInt(markName) ? markName : undefined ) );
			if ( startTime ) {
				this.measures[episodeName] = parseInt(endTime - startTime);
				this.starts[episodeName] = parseInt(startTime);
				this.bHasEpisodes = true;
			}
		}
		else if ( "done" === action ) {
			try {
				FirebugContext.getPanel("episodes").drawEpisodicTimes();
			}
			catch(e) {
				// In FF3 there's a race condition where the episodes are done before the panel is created.
				this.bDrawEpisodes = true;
			}
		}
	}

};


// For pages that didn't implement any Episodes.
EpisodesContext.prototype.doDefaultEpisodes = function() {
    dprint(9, "EpisodesContext.prototype.doDefaultEpisodes: enter");

	// Only do default Episodes if NO real Episodes have occurred.
	if ( "undefined" === typeof(FirebugContext.window.EPISODES) && !this.bHasEpisodes ) {
		// We always have three times: unload, firstbyte, and endtime
		this.handleEpisode( { data: "EPISODES:mark:starttime:" + Firebug.episodesStartTime } ); // this gets set in EpisodesModule.doUnload
		this.handleEpisode( { data: "EPISODES:mark:firstbyte:" + Firebug.episodesFirstByte } ); // this gets set in EpisodesModule.initContext
		this.handleEpisode( { data: "EPISODES:mark:endtime:" + Firebug.episodesEndTime } ); // this gets set in EpisodesModule.doOnload

		this.handleEpisode( { data: "EPISODES:measure:totaltime:starttime:endtime" } );
		this.handleEpisode( { data: "EPISODES:measure:backend:starttime:firstbyte" } );
		this.handleEpisode( { data: "EPISODES:measure:frontend:firstbyte:endtime" } );

		// TODO - could strive to end the loop in pollForEpisodes

		FirebugContext.getPanel("episodes").drawEpisodicTimes();
	}
};


// Only for non-compatible browsers.
EpisodesContext.prototype.pollForEpisodes = function() {
    //painful dprint(9, "EpisodesContext.prototype.pollForEpisodes: enter");
	this.retryCount++;
	if ( 40 < this.retryCount ) {
		// TODO - might want to improve this to give up earlier
		return; // give up
	}
	else if ( "undefined" === typeof(FirebugContext.window.EPISODES) || !FirebugContext.window.EPISODES.done ) {
		// EPISODES doesn't exist or it's not done yet
		var self = this;
		setTimeout(function() { self.pollForEpisodes(); }, 500);
	}
	else { 
		// done
		this.starts = FirebugContext.window.EPISODES.getStarts();
		this.measures = FirebugContext.window.EPISODES.getMeasures();
		FirebugContext.getPanel("episodes").drawEpisodicTimes();
	}
};


EpisodesContext.prototype.isCompatible = function() {
    dprint(9, "EpisodesContext.prototype.isCompatible: enter");
	return ( 0 < navigator.userAgent.indexOf("Firefox/3") );
};


EpisodesContext.prototype.setPanel = function(panel) {
    dprint(9, "EpisodesContext.prototype.setPanel: enter");
	this.buttonViews = {};
	this.panel = panel;
	this.initDiv();
};


EpisodesContext.prototype.setWindow = function(win) {
    dprint(9, "EpisodesContext.prototype.setWindow: enter");
	if ( this.isCompatible() ) {
		var self = this; // need to create a variable that will be in the "closure" of the event listener callback function
		win.addEventListener("message", function(e) { self.handleEpisode(e); }, false);
	}
	else {
		// For non-compatible browsers we poll for data in initEpisodes.
	}
};


EpisodesContext.prototype.initDiv = function() {
    dprint(9, "EpisodesContext.prototype.initDiv: enter");
	var elem = this.panel.document.createElement("div");
	elem.style.display = "block";
	this.panel.panelNode.appendChild(elem);
	this.viewNode = elem;
};


EpisodesContext.prototype.show = function() {
    dprint(9, "EpisodesContext.prototype.show: enter");
	// Display the view for the currently selected button.
	this.showButtonView("episodesview");

	if ( this.bDrawEpisodes ) {
		this.bDrawEpisodes = false;
		FirebugContext.getPanel("episodes").drawEpisodicTimes();
	}
};


EpisodesContext.prototype.addButtonView = function(sButtonId, sHtml) {
    dprint(9, "EpisodesContext.prototype.addButtonView: enter");
	var btnView = this.getButtonView(sButtonId);
	if ( ! btnView ) {
		btnView = this.panel.document.createElement("div");
		btnView.style.display = "none";
		this.viewNode.appendChild(btnView);
		this.buttonViews[sButtonId] = btnView;
	}

	btnView.innerHTML = sHtml;
	this.showButtonView(sButtonId);
};


EpisodesContext.prototype.getButtonView = function(sButtonId) {
    dprint(9, "EpisodesContext.prototype.getButtonView: enter");
	return ( this.buttonViews.hasOwnProperty(sButtonId) ? this.buttonViews[sButtonId] : undefined );
};


EpisodesContext.prototype.showButtonView = function(sButtonId) {
    dprint(9, "EpisodesContext.prototype.showButtonView: enter");
	var btnView = this.getButtonView(sButtonId);

	if ( ! btnView ) {
		eprint("ERROR: EpisodesContext.showButtonView: Couldn't find ButtonView named '" + sButtonId + "'.");
		return false;
	}

	// Hide all the other button views.
	for ( var sId in this.buttonViews ) {
		if ( this.buttonViews.hasOwnProperty(sId) && sId != sButtonId ) {
			this.buttonViews[sId].style.display = "none";
		}
	}

	btnView.style.display = "block";
	this.curButtonId = sButtonId;
	return true;
};


EpisodesContext.prototype.getCurButtonView = function() {
    dprint(9, "EpisodesContext.prototype.getCurButtonView: enter");
	return this.getButtonView(this.curButtonId);
};


EpisodesContext.prototype.getViewElementById = function(sId) {
    dprint(9, "EpisodesContext.prototype.getViewElementById: enter");
	var aElements = this.getCurButtonView().getElementsByTagName("*");
	for ( var i = 0; i < aElements.length; i++ ) {
		var elem = aElements[i];
		if ( sId == elem.id ) {
			return elem;
		}
	}

	eprint("ERROR: getCurElement: Unable to find element '" + sId + "'.");
	return undefined;
};
