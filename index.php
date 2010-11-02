<!doctype html>
<html>
<head>
<title>Episodes</title>
<meta charset="UTF-8">

<script>
var EPISODES = EPISODES || {};
EPISODES.q = []; // command queue
EPISODES.mark = function(mn, mt) { EPISODES.q.push( ["mark", mn, mt || new Date().getTime()] ); };
EPISODES.measure = function(en, st, en) { EPISODES.q.push( ["measure", en, st, en || new Date().getTime()] ); };
EPISODES.done = function(callback) { EPISODES.q.push( ["done", callback] ); };
EPISODES.mark("firstbyte");
(function() {
    var epjs = document.createElement("script"); epjs.type = "text/javascript"; epjs.async = true;
    epjs.src = "episodes.js";
    var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(epjs, s);
})();
</script>

<script>
function installXPI(href)
{
    if (typeof(InstallTrigger) != 'undefined') {
        var xpi = {'episodes': href};
        InstallTrigger.install(xpi);
    }
    else {
        alert("You must be using Firefox.");
    }
}
</script>

<style>
BODY { font-family: arial; width: 900px; }
</style>
</head>
<body>

<div style="float: right; font-size: 0.9em;">
<nobr>
<a href="http://groups.google.com/group/episodes/topics">contact us</a>
&nbsp;|&nbsp;
<a href="http://code.google.com/p/episodes/source/checkout">code</a>
&nbsp;|&nbsp;
<a href="http://code.google.com/p/episodes/issues/list">bugs</a>
</nobr>
</div>
<h1>Web Episodes</h1>

<p style="margin-bottom: 0;">
<i>Episodes</i> is a framework for timing web pages.
It has three key concepts:
<ul>
  <li> it supports measuring Web 2.0 applications
  <li> measurements are made using JavaScript events so there can be multiple listeners
  <li> its designed to be an industry standard for web developers, web metrics service providers, tool developers, and browser developers
</ul>

<p>
Examples:
</p>
<ul>
  <li> <a href="ex1.html">example 1</a> - a simple example using default settings
</ul>

<p>
To illustrate how there can be multiple consumers of Episodes, use the 
<a href="episodes.xpi" onclick="installXPI('episodes.xpi'); return false;">Episodes Firefox add-on</a> 
to view episodic timing information from any page that uses Episodes.
</p>

</body>

</html>
