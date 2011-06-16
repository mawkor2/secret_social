(function(){
  var icon = chrome.extension.getURL("images/secretsocial-16.png");
  var shhURL = 'https://shh.sh/new';

  var goToSecretSocial = function() {
    var topic = document.getElementsByClassName('mentionsTextarea')[0].value;
    var shhFinalUrl = shhURL + '?topic=' + topic;
    document.location.href = shhFinalUrl;
  };

  var shhMessageTemplate = '<a class="ss-message-placed uiTooltip\
    MessagingShareOption" rel="async" href="#" target="_new"><span\
    class="uiTooltipWrap top left lefttop"><span class="uiTooltipText\
    uiTooltipNoWrap">Go Private</span></span></a>';

  var setupShareSSTopic = function() {
    var privacyWidget, pageletComposer = null;
    whenReady({
      cb: function() {
       if (!pageletComposer.innerHTML.toString().match('ss-placed-pc')) {
          var parentUL = privacyWidget.parentNode;
          var shareNode = parentUL.children[1];
          var ssButton = shareNode.cloneNode(true);
          ssButton.setAttribute('class', 
            ssButton.getAttribute('class') + ' ss-placed-pc');
          ssButton.firstChild.firstChild.value = 'Private Chat';
          ssButton.firstChild.firstChild.setAttribute('type', null);
          ssButton.firstChild.style.backgroundImage = 'url(' + icon + ')';
          ssButton.firstChild.style.backgroundRepeat = 'no-repeat';
          ssButton.firstChild.style.backgroundPosition = '2px 4px';
          ssButton.firstChild.style.paddingLeft = '21px';
          ssButton.firstChild.style.width = '83px';
          ssButton.addEventListener('click', goToSecretSocial, false);
          parentUL.insertBefore(ssButton, shareNode);
        }
      },
      condition: function() {
        pageletComposer = document.getElementById('pagelet_composer');
        if (!pageletComposer) {
          pageletComposer = document.getElementById('profile_stream_composer');
        }
        if (pageletComposer && 
           pageletComposer.getElementsByClassName('privacyWidget') &&
            pageletComposer.
              getElementsByClassName('privacyWidget').length > 0 &&        
            (privacyWidget = pageletComposer.
              getElementsByClassName('privacyWidget')[0])) {
          return true;
        };
        return false;
      }
    })();
  };

  var setupHovercardSSLink = function() {
    var aTarget = window.event.target;
    if (aTarget.getAttribute('data-hovercard')) {
      checkForSSLink(aTarget);
    };
  };

  var messagingComposer = null;
  var messagingLink = null;
  var messagingAnchor = null;

  var setupMessagingComposerButton = function(messagingComposerRef) {
    messagingComposer = messagingComposerRef;
    var placedElement = messagingComposer.
      getElementsByClassName('ss-message-placed');
    if (placedElement.length > 0) {
      return;
    };
    var linkUL = messagingComposer.
      getElementsByClassName('MessagingAttachmentLinks')[0];
    //var sendButton = messagingComposer.parentNode.parentNode.getElementsByClassName('uiButtonConfirm')[0].firstChild;
    var newLI = linkUL.firstChild.cloneNode();
    newLI.innerHTML = shhMessageTemplate;
    newLI.firstChild.style.backgroundImage = 'url(' + icon + ')';
    newLI.style.marginLeft = '5px';
    linkUL.appendChild(newLI);
    newLI.firstChild.addEventListener('mouseover', function(evt){ 
      setMessagingSSLink(); }, true);
    newLI.firstChild.addEventListener('click', function(evt){
      // kind of silly
      window.open(evt.target.href,"ss-window");
    }, true);
    messagingAnchor = newLI.firstChild;
  };

  var setMessagingSSLink = function() {
    var message = encodeURIComponent(messagingComposer.
      getElementsByClassName('MessagingComposerFullTextArea')[0].value);
    var query = (message) ? ['topic=' + encodeURIComponent(message)] : [];
    messagingLink = shhURL + query;
    // uncomment when ss landing pg supports fb ids
    /*
    var friendElements = document.getElementsByClassName('uiToken');
    var fbIds = [];
    for (var idx = 0; idx < friendElements.length; idx++) {
      var friendElement = friendElements[idx];
      fbIds.push(friendElement.getElementsByTagName('input')[0].value);
    }; 
    if (fbIds.length > 0) {
      query.push("invite=" + fbIds.join(','));  
    }
    */
    var sQuery = (query.length > 0) ? '?' + query.join('&') : '';
    messagingLink = shhURL + sQuery;
    messagingAnchor.href = messagingLink;
  };

  var checkForSSLink = function(aTarget) {
    var hoverCard, actionLinks, actionUL;
    whenReady({
      cb: function() {
        if (!actionUL.innerHTML.toString().match('ss-placed-hc')) {
          var sendMessageLI = actionUL.firstChild;
          sendMessageLI.addEventListener('click', whenReady({
            cb: setupMessagingComposerButton,
            condition: function() {
              var messagingComposerNX = document.
                getElementsByClassName("MessagingComposer");
              if (messagingComposerNX.length > 0) {
                return messagingComposerNX[0];
              }
              return false;
            }
          }), true);
        };
      },
      condition: function() {
        if (document.getElementsByClassName('HovercardOverlay').length > 0 &&
           (hoverCard = document.getElementsByClassName('HovercardOverlay')[0]) 
             && 
           (actionLinks = hoverCard.getElementsByClassName('pvs')[0]) &&
           (actionUL = actionLinks.firstChild)) {
          return true;
        }
        return false;
      }
    })();
  };

  /** Pass in 
    * {elemId, evt, cb, pollInterval, retryCount}
    *
  */
  var attachWhenReady = function(conf) {
    var interval = 0, retries = 0, elem;
    if (!conf.pollInterval) {
      conf.pollInterval = 100;
    };
    if (!conf.retryCount) {
      conf.retryCount = 15;
    };
    interval = setInterval(function() {
      var elem = false;
      if (elem = document.getElementById(conf.elemId)) {
        clearInterval(interval);
        elem.addEventListener(conf.evt, conf.cb, true);
      }
      else {
        retries++;
        if (retries === conf.retryCount) {
          clearInterval(interval);
        }
      };
    }, conf.pollInterval);
  };

  var whenReady = function(obj) {
    return function() {
      var interval = 0, 
          retries = 0, 
          retryCount = 30, 
          pollInterval = 100, 
          cbArgs = [], 
          conditionArgs = [], 
          retVal, 
          cb = obj.cb;
      if (obj.retryCount) { retryCount = obj.retryCount; };
      if (obj.pollInterval) { pollInterval = obj.pollInterval; };
      if (obj.cbArgs) { cbArgs = obj.cbArgs; };
      if (obj.conditionArgs) { conditionArgs = obj.conditionArgs; };
      var condition = curry(obj.condition, {}, obj.conditionArgs);
      interval = setInterval(function() {
        if (retVal = condition()) {
          clearInterval(interval);
          return cb(retVal);
        };
        if (++retries === retryCount) {
          clearInterval(interval);
          return false;
        };
      }, pollInterval);
    }
  };

  var curry = function(fn, scope) {
    var scope = scope || window;
    var args = [];
    for (var i=2, len = arguments.length; i < len; ++i) {
      args.push(arguments[i]);
    };
    return function() {
      return fn.apply(scope, args);
    };
  };

  return {
    init : function() {
      if (document.getElementById('pagelet_home_stream')) {
        attachWhenReady({elemId: 'home_stream', evt: 'mouseover', 
          cb: setupHovercardSSLink});
      }
      else {
        attachWhenReady({elemId: 'pagelet_wall', evt: 'mouseover', 
          cb: setupHovercardSSLink});
      }
      setupShareSSTopic();
    }
  }
}()).init();

