var scriptMap = {
  'mail.google.com' : 'goprivate-gmail.js',
  'twitter.com' : 'goprivate-twitter.js'
};

var scriptIds = {
  'mail.google.com' : 'gmail',
  'twitter.com' : 'twitter'
};

var cssMap = {
  'twitter.com' : 'shh-chrome-twitter.css'
};

var scriptEnabled = function(sHost) {
  return prefManager.getBoolPref('extensions.secretsocial.enable_' + scriptIds[sHost]);
};

var loadScript = function(scriptName, context) {
  loader.loadSubScript("chrome://secretsocial/content/" + scriptName, context, "UTF-8");
};

var loadCss = function(cssName, context) {
  var link = context.document.createElement('link');
  link.type = "text/css";
  link.href = "chrome://secretsocial/skin/" + cssName;
  link.rel = "stylesheet";
  context.document.head.appendChild(link);
};

window.addEventListener('load', function () {
  gBrowser.addEventListener('DOMContentLoaded', function (evt) {
    if (evt.originalTarget instanceof HTMLDocument) {
      var win = evt.originalTarget.defaultView;
      if (win.frameElement) {
        return;
      };
      var loc = win.location;
      if (typeof scriptMap[loc.host] !== 'undefined' && scriptEnabled(loc.host)) {
        loadScript(scriptMap[loc.host], win);
      }
      if (typeof cssMap[loc.host] !== 'undefined' && scriptEnabled(loc.host)) {
        loadCss(cssMap[loc.host], win);
      }
    }
  }, true);
}, false);

var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
  .getService(Ci.mozIJSSubScriptLoader);
var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
  .getService(Components.interfaces.nsIPrefBranch);
