var icon = chrome.extension.getURL("images/secretsocial-16.png");
var shhURL = 'https://shh.sh/new';

attachWhenReady({elemId: 'home_stream', evt: 'mouseover', cb: setupHovercardSSLink});
setupShareSSTopic();

function goToSecretSocial() {
  var topic = document.getElementsByClassName('mentionsTextarea')[0].value;
  var shhFinalUrl = shhURL + '?topic=' + topic;
  document.location.href = shhFinalUrl;
}

function setupShareSSTopic() {
  var interval = 0, retries = 0, retryCount = 30, pollInterval = 400, privacyWidget;
  var interval = setInterval(function() {
    var pageletComposer = document.getElementById('pagelet_composer');
    if (pageletComposer && pageletComposer.getElementsByClassName('privacyWidget').length > 0 && (privacyWidget = pageletComposer.getElementsByClassName('privacyWidget')[0])) {
      if (!pageletComposer.innerHTML.toString().match('ss-placed-pc')) {
        var parentUL = privacyWidget.parentNode;
        var shareNode = parentUL.children[1];
        var ssButton = shareNode.cloneNode(true);
        ssButton.setAttribute('class', ssButton.getAttribute('class') + ' ss-placed-pc');
        ssButton.firstChild.firstChild.value = 'Private Chat';
        ssButton.firstChild.firstChild.setAttribute('type', null);
        ssButton.firstChild.style.backgroundImage = 'url(' + icon + ')';
        ssButton.firstChild.style.backgroundRepeat = 'no-repeat';
        ssButton.firstChild.style.backgroundPosition = '2px 4px';
        ssButton.firstChild.style.paddingLeft = '21px';
        ssButton.firstChild.style.width = '83px';
        ssButton.addEventListener('click', goToSecretSocial, false);
       // ssButton.firstChild.style.backgroundColor = 
        parentUL.insertBefore(ssButton, shareNode);
      }
      clearInterval(interval);
    }
    else if (retries === retryCount) {
      clearInterval(interval);
    }
    retries++;
  });
};

function setupHovercardSSLink() {
  var aTarget = window.event.target;
  if (aTarget.getAttribute('data-hovercard')) {
    checkForSSLink(aTarget);
  };
};

function checkForSSLink(aTarget) {
  var hoverCard, actionLinks, interval = 0, retries = 0, retryCount = 30, pollInterval = 100, actionUL;
  var interval = setInterval(function() {
    if (document.getElementsByClassName('HovercardOverlay').length > 0 &&
       (hoverCard = document.getElementsByClassName('HovercardOverlay')[0]) && 
       (actionLinks = hoverCard.getElementsByClassName('pvs')[0]) &&
       (actionUL = actionLinks.firstChild)) {
      if (!actionUL.innerHTML.toString().match('ss-placed-hc')) {
        var newLI = actionUL.firstChild.cloneNode(true);
        newLI.firstChild.firstChild.style.backgroundImage = 'url(' + icon + ')';
        newLI.firstChild.firstChild.style.backgroundPosition = '0 0';
        newLI.firstChild.href = shhURL + '?topic=' + encodeURIComponent(aTarget.parentNode.parentNode.children[1].textContent);
        newLI.firstChild.setAttribute('rel', null);
        newLI.style.marginLeft = '5px';
        newLI.firstChild.childNodes[1].textContent = 'Go Private';
        newLI.setAttribute('class', newLI.getAttribute('class') + ' ss-placed-hc');
        actionUL.appendChild(newLI);
      }
      clearInterval(interval);
    }
    else if (retries === retryCount) {
      clearInterval(interval);
    };
    retries++;
  }, pollInterval);
}

/** Pass in 
  * {elemId, evt, cb, pollInterval, retryCount}
  *
*/
function attachWhenReady(conf) {
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


