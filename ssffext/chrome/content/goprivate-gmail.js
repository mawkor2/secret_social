var shh = function() {
  return {
    landingURL : 'https://shh.sh/new',
    creationTimeout : 600, // TODO: try to figure out a way not to use a magic number
    // returns null is search fails or the node in question has no id
    grepNodes : function(searchText, frameId) {
      var matchedNodes = [];
      var regXSearch;
      if (typeof searchText === "string") {
        regXSearch = new RegExp(searchText, "g");
      }
      else {
        regXSearch = searchText;
      } 
      var currentNode = null, matches = null;
      if (frameId && !document.getElementById(frameId)) {
        return null;
      }
      var oDoc = (frameId) ? document.getElementById(frameId).contentDocument : document;
      var allNodes = oDoc.getElementsByTagName('*');
      for (var nodeIdx in allNodes) {
        currentNode = allNodes[nodeIdx];
        if (!currentNode.nodeName || currentNode.nodeName === undefined) {
          break;
        }
        if (!(currentNode.nodeName.toLowerCase().match(/html|script|head|meta|link|object/))) {
          matches = currentNode.innerHTML.match(regXSearch);
          var totalMatches = 0;
          if (matches) {
            var totalChildElements = 0;
            for (var i=0;i<currentNode.children.length;i++) {
              if (!(currentNode.children[i].nodeName.toLowerCase().match(/html|script|head|meta|link|object/))) {
                totalChildElements++;
              }
            }
            matchedNodes.push({node: currentNode, numMatches: matches.length, childElementsWithMatch: 0, nodesYetTraversed: totalChildElements});
          }
          for (var i = matchedNodes.length - 1; i >= 0; i--) {
            previousElement = matchedNodes[i - 1];
            if (!previousElement) {
              continue;
            }
            if (previousElement.nodesYetTraversed !== 0 && previousElement.numMatches !== previousElement.childElementsWithMatch) {
              previousElement.childElementsWithMatch++;
              previousElement.nodesYetTraversed--;
            }      
            else if (previousElement.nodesYetTraversed !== 0) {
              previousElement.nodesYetTraversed--;
            }               
          }
        }
      }
      var processedMatches = [];
      for (var i =0; i <  matchedNodes.length; i++) {
        if (matchedNodes[i].numMatches > matchedNodes[i].childElementsWithMatch) {
          processedMatches.push(matchedNodes[i].node);
        }
      }
      return processedMatches; 
    },

    nodeExistsWith: function(searchText, bodyText) {
      var regXNodeOpen = /<[a-zA-Z]*((?:\s*[a-zA-Z0-9]*=[\'\"][^\'\"]*[\'\"])*)\s*>/;
      if (typeof searchText !== "string") { 
        searchText = searchText.source;
      }
      var regXTextNodeSearch = new RegExp(regXNodeOpen.source + searchText);
      var regXTextNodeSearchResults = regXTextNodeSearch.exec(bodyText);
      if (regXTextNodeSearchResults) {
        return true;            
      }       
      return false;
    },

    setUpSecretSocialButton : function() { 
      if (!shh.nodeExistsWith(/Go\sPrivate/, document.getElementById('canvas_frame').contentDocument.body.innerHTML) && !shh.haltButtonCreation) {
        shh.haltButtonCreation = true;
        setTimeout(function(){ shh.haltButtonCreation = false;}, 700);
        var discardNode = shh.grepNodes(/Discard$/g, 'canvas_frame')[0];
        if (!discardNode) {
          return null;
        }        
        var secretSocialButton = discardNode.cloneNode(false);
        secretSocialButton.id = 'ss_button';
        shh.secretSocialLink = document.getElementById('canvas_frame').contentDocument.createElement('a');
        shh.secretSocialLink.target = '_blank';
        shh.secretSocialLink.style.textDecoration = 'none';
        shh.secretSocialLink.style.color = '#000';
        shh.secretSocialLink.innerHTML = 'Go Private';
        var recipientsJSON = shh.getRecipientsJSON();
        var subjectText = shh.getSubjectText();
        if (subjectText !== '') {
          shh.secretSocialLink.href = shh.buildShhUrl(recipientsJSON, subjectText);
        }
        else {              
          shh.secretSocialLink.href = shh.buildShhUrl(recipientsJSON);
        }
        secretSocialButton.appendChild(shh.secretSocialLink);
        discardNode.parentNode.insertBefore(secretSocialButton, discardNode.parentNode.children[3]);
        shh.secretSocialLink.addEventListener('click', shh.processRecipientsChange, false);              
      }
      return secretSocialButton;
    },
   
    processRecipientsChange: function() {
      var recipientsJSON = shh.getRecipientsJSON();  
      var subjectText = shh.getSubjectText();
      if (subjectText !== '') {
        shh.secretSocialLink.href = shh.buildShhUrl(recipientsJSON, subjectText);
      }
      else {              
        shh.secretSocialLink.href = shh.buildShhUrl(recipientsJSON);
      }    
      return true;
    },

    getSubjectText : function(encode) {
      var subjectNode = document.getElementById('canvas_frame').contentDocument.getElementsByName("subject")[0];
      var subjectText = (encode) ? encodeURIComponent(subjectNode.value.substr(0,50)) : subjectNode.value.substr(0,50);
      return subjectText;
    },

    getRecipientsJSON : function() {
      var toNode = document.getElementById('canvas_frame').contentDocument.getElementsByName("to")[0];
      var recipients = toNode.value.split(',');
      var recipientsJSON = shh.buildRecipientsJSON(recipients);
      return recipientsJSON;
    },

    buildRecipientsJSON : function(recipients) {
      var recipientsJSON = {'recipients':[]};
      for (var i=0;i<recipients.length;i++) {
        var recipientName = '', recipientEmail = '';
        var recipientStr = recipients[i];
        // gmail formatted email and name from address book
        var recipientEmailMatch = /<\s*(.+[^\s])>/.exec(recipientStr);
        if (recipientEmailMatch && recipientEmailMatch.length >= 2 && shh.validateEmail(recipientEmailMatch[1])) {
          recipientEmail = recipientEmailMatch[1];
          var recipientNameMatch = /"\s*(.+[^\s])"/.exec(recipientStr);
          recipientName = (recipientNameMatch) ? recipientNameMatch[1] : '';
        }
        else {
          // email entered manually
          recipientEmailMatch = /\s*(.+[^\s])/.exec(recipientStr);
          if (recipientEmailMatch && recipientEmailMatch.length >= 2 && shh.validateEmail(recipientEmailMatch[1])) {
            recipientEmail = recipientEmailMatch[1];
          }
        }
        var recipientObject = {'name':recipientName,'email':recipientEmail};
        if (!recipientObject.email.match(/^\s*$/)) {
            recipientsJSON.recipients.push(recipientObject);
        }
      }
      return(recipientsJSON);
    },

    validateEmail : function(sEmail) {
      if (sEmail && sEmail.match(/^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
        return true;
      }
      return false;            
    },

    buildShhUrl : function(recipientsJSON, topic) {
      if (!recipientsJSON || !recipientsJSON.recipients || recipientsJSON.recipients.length === 0) {
        if (topic) {
          return shh.landingURL + '?topic=' + encodeURIComponent(topic);
        }
        return shh.landingURL;
      }
      var aRecipientCSV = [];
      for (var recipientIdx in recipientsJSON.recipients) {
        var recipient = recipientsJSON.recipients[recipientIdx];
        aRecipientCSV.push(encodeURIComponent(recipient.email));
      }
      var sRecipientCSV = aRecipientCSV.join(',');
      if (topic) {
        return shh.landingURL + '?invite=' + sRecipientCSV + '&topic=' + encodeURIComponent(topic);
      }
      return shh.landingURL + '?invite=' + sRecipientCSV;
    },

    getFormattedHash: function() {
      var hashLocation = location.hash.split("/"), hashAction;
      if (hashLocation[1] !== undefined) {
        hashAction = hashLocation[0] + "/*";
      }
      else {
        hashAction = hashLocation[0];
      }
      return hashAction;
    },

    setUpReplyEvents: function() {
      var aReplyNodes = shh.grepNodes(/Reply$/g, 'canvas_frame');
      var aReplyToAllNodes = shh.grepNodes(/Reply\sto\sall/g,  'canvas_frame');                    
      for (var replyNodeIdx in aReplyNodes) {
        var replyNode = aReplyNodes[replyNodeIdx];
        replyNode.addEventListener('click', function() { setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout); }, true);
      }
      if (aReplyToAllNodes.length > 0) {
        aReplyToAllNodes[0].addEventListener('click', function() { setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout); }, true);
      }
    },

    processHashChange: function(e) {
      var hashAction = shh.getFormattedHash();
      switch (hashAction) {
        // compose a new email
        case "#compose":
            setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout);
            break;
        // access an individual draft
        case "#drafts/*":
            setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout);
            break;
        case "#inbox/*":
            setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout);                
        case "#starred/*":
        case "#sent/*":
            // hook up to reply button, on reply click create the 
            shh.setUpReplyEvents();
            break;                  
        default:
            break;
      }
    },
    
    init : function() {
      setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout);
      setTimeout(shh.setUpReplyEvents, shh.creationTimeout);
      var composeNode = shh.grepNodes(/Compose mail/, "canvas_frame")[0];            
      if (composeNode !== null && composeNode !== undefined) {
        composeNode.addEventListener("click", function() {
          setTimeout(shh.setUpSecretSocialButton, shh.creationTimeout);
        }, false);
      } 
      window.addEventListener("hashchange", shh.processHashChange, false);
      shh.counter++;
      return true;
    },
    counter: 0,
    secretSocialLink: null,
    haltButtonCreation: false,
    tryInit: function() {
      var interval = setInterval(function () {
        if (shh.init()) { clearInterval(interval) }
      }, 300);
    }
  };
}();

shh.tryInit();
