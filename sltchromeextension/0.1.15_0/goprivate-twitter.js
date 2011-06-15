//
// shh-chrome - goprivate.js
//
(function () {
    var icon = chrome.extension.getURL("goprivate.png");

    var MAX_DELAY = 8 * 1000,
        MIN_DELAY = 200;

    var tweetCount = 0;
    var processed = [];

    var currentTimeout = null;

    function extend(tweet) {
        if (! tweet) { return }

        var id = tweet.getAttribute('data-item-id');
        
        if (processed.indexOf(tweet) !== -1) { return }

        var actions = tweet.getElementsByClassName('tweet-actions')[0];

        if (! actions)                    { return }

        actions.appendChild(createAction(tweet));
        processed.push(tweet);
    }

    function createAction(tweet) {
        var a = document.createElement('a');
        var i = document.createElement('i');
        var b = document.createElement('b');
        var span = document.createElement('span');

        var topic = tweet.getElementsByClassName('tweet-text')[0].innerText;
        var user = (tweet.getElementsByClassName('tweet')[0] || tweet).getAttribute('data-screen-name');

        a.href   = 'https://shh.sh/new?topic=' + encodeURIComponent(topic) + '&invite=' + user;
        a.target = '_blank';
        a.className = 'shh-goprivate';
        a.appendChild(span);
        a.onclick = function () {
            window.open(this.href);
            return false;
        };

        span.appendChild(i);
        span.appendChild(b);

        i.style.backgroundImage = 'url(' + icon + ')';

        b.innerHTML = 'Go private';

        return a;
    }

    function refresh(timeout) {
        if (currentTimeout !== null) { return } 

        currentTimeout = setTimeout(function () {
            var tweets = document.getElementsByClassName('stream-item');
            var nextTimeout = parseInt(timeout * 1.5);

            clearTimeout(currentTimeout);
            currentTimeout = null;

            extend(document.getElementsByClassName('details-pane-tweet')[0]);

            if (tweetCount !== tweets.length) {
                for (var i = 0; i < tweets.length; i ++) {
                    // TODO: Find a better way to check if the item is a tweet.
                    // (this won't work for the related-tweets section)
                    // For now, twitter only displays tweets in the stream, so we're ok.
                    //
                    //   if (tweets[i].getAttribute('data-item-type') !== 'tweet') { continue }
                    //
                    extend(tweets[i]);
                }
                tweetCount = tweets.length;
            } else if (nextTimeout <= MAX_DELAY) {
                refresh(nextTimeout);
            } else {
                // Done
            }
        }, timeout);
    }

    function createButton(original) {
        var button = document.createElement('a');
        var input = original.parentNode.parentNode.getElementsByClassName('twitter-anywhere-tweet-box-editor')[0];

        button.className = original.className;
        button.innerHTML = 'Go private';
        button.style.marginRight = '5px';
        button.target = '_blank';
        original.parentNode.insertBefore(button, original);
        input.addEventListener('keydown', function (e) {
            // Match the tweet button 'class' attribute, so our button gets disabled/enabled
            // at the same time. We need to defer this, or else it'll run before
            // the tweet button changes.
            setTimeout(function () { button.className = original.className }, 0);
        });
        input.addEventListener('keyup', function (e) {
            button.href = roomLink(this.value);
        });
        button.href = roomLink(input.value);
    }
    function createButtons() {
        setTimeout(function () {
            var originals = document.getElementsByClassName('tweet-button-container'), buttons;

            for (var i = 0; i < originals.length; i ++) {
                if (! originals[i].getAttribute('data-goprivate')) {
                    createButton(originals[i].lastElementChild);
                    originals[i].setAttribute('data-goprivate', '1');
                }
            }
        }, 100);
    }

    function roomLink(topic) {
        var invite = topic.match(/^(\B@\w+\b\s*)+/g);
        var base = 'https://shh.sh/new?topic=';
        
        if (invite) {
            invite = invite[0].trim().split(/\s+/).map(function (i) {
                topic = topic.replace(i, '');
                return i.trim().slice(1);
            });
            topic = topic.trim();
            return base + encodeURIComponent(topic) + '&invite=' + invite.join(',');
        }
        return base + encodeURIComponent(topic);
    }

    function initialize() {
        if (document.getElementsByClassName('tweet-button').length > 0) {
            createButtons();
            return true;
        }
    }

    window.addEventListener('mouseup', function () {
        refresh(100);
        createButtons();
    });

    window.addEventListener('scroll', function () {
        refresh(MIN_DELAY * 2);
    });

    refresh(MIN_DELAY);

    var interval = setInterval(function () {
        if (initialize()) { clearInterval(interval) }
    }, 500);
})();

