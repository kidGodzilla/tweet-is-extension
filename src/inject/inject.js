const INPUT_AREA_SELECTOR = `.DraftEditor-root .DraftEditor-editorContainer`;
const PREVIOUS_TWEET_SELECTOR = `div[data-testid="tweetText"][lang]`;
const REPLY_BUTTON_SELECTOR = `[data-testid="tweetButton"]`;
const REPLY_MODAL_SELECTOR = `div[role=group].r-1habvwh`;
const TEXT_INPUT_SELECTOR = `[contenteditable="true"]`;

function interceptData() {
  var xhrOverrideScript = document.createElement('script');
  xhrOverrideScript.type = 'text/javascript';
  xhrOverrideScript.innerHTML = `
  (function() {
    var XHR = XMLHttpRequest.prototype;
    var send = XHR.send;
    var open = XHR.open;
    XHR.open = function(method, url) {
        this.url = url; // the request url
        return open.apply(this, arguments);
    }
    XHR.send = function() {
        this.addEventListener('load', function() {
          if (this.url.includes('/CreateTweet')) {
            // CreateTweet response, get ID 
            // data.create_tweet.tweet_results.result.legacy.id_str || data.create_tweet.tweet_results.result.rest_id
            var json = this.response;
            try { json = JSON.parse(this.response); json = { id: json.data.create_tweet.tweet_results.result.legacy.id_str || json.data.create_tweet.tweet_results.result.rest_id, legacy: json.data.create_tweet.tweet_results.result.legacy } }catch(e){}
            // console.log('Response:', this.url, json);
            var internal_id = localStorage.getItem('__internal_id');
            localStorage.setItem('__internal_id', '');
            if (internal_id) location.href = 'https://api.tweet.is/confirmation?id='+json.id+'&internal_id='+internal_id;
          }
          if (this.url.includes('api/2/search/adaptive.json')) {
            var json = this.response;
            try { json = JSON.parse(this.response); json = { tweets: json.globalObjects.tweets, users: json.globalObjects.users } }catch(e){}
            //console.log('Response:', this.url, json);   

            (async () => {
              const rawResponse = await fetch('https://api.tweet.is/payload', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: this.url, data: json })
              });
              const content = await rawResponse.json();

              //console.log('request state:', content);
            })();

          }
        });
        return send.apply(this, arguments);
    };
  })();
  `
  document.head.prepend(xhrOverrideScript);
  window.fetchResource = fetchResource;
}
function checkForDOM() {
  if (document.body && document.head) {
    interceptData();
  } else {
    requestIdleCallback(checkForDOM);
  }
}
requestIdleCallback(checkForDOM);

function fetchResource(input, init) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({input, init}, messageResponse => {
      const [response, error] = messageResponse;
      if (response === null) {
        reject(error);
      } else {
        // Use undefined on a 204 - No Content
        const body = response.body ? new Blob([response.body]) : undefined;
        resolve(new Response(body, {
          status: response.status,
          statusText: response.statusText,
        }));
      }
    });
  });
}

chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      if (location.search.includes('&screen_name=')) {
        var p3 = location.search.split('&screen_name=')[1];
        var screen_name = p3.split('&')[0];
        localStorage.setItem('___twitter_screen_name', screen_name);
      }

      if (location.search.includes('cont=1')) {
        setTimeout(() => {
          var screen_name = localStorage.getItem('___twitter_screen_name');
          location.href = 'https://tweet.is/dosearch?screen_name='+screen_name;
        }, Math.floor(Math.random() * 4000) + 4000);
      }

      if (location.search.includes('compose_tweet=1')) {
        setTimeout(() => {

          var p1 = location.search.split('&tweet_text=')[1] || '';
          var tweet_text = decodeURIComponent(p1.split('&')[0]);

          var p2 = location.search.split('&_id=')[1] || '';
          var internal_id = decodeURIComponent(p2.split('&')[0]);
          localStorage.setItem('__internal_id', internal_id || '');

          document.querySelector(`${ REPLY_MODAL_SELECTOR } ${ TEXT_INPUT_SELECTOR }`).focus();

          if (document.querySelector(`${ REPLY_MODAL_SELECTOR } ${ TEXT_INPUT_SELECTOR }`).innerText !== '\n') {

            var area = document.querySelector(`${ REPLY_MODAL_SELECTOR } ${ TEXT_INPUT_SELECTOR }`);
              var range = document.createRange();
              range.selectNode(area);
              window.getSelection().addRange(range);

            document.execCommand('selectAll', false, null);
            document.execCommand('cut');
          }

          setTimeout(() => { document.execCommand('insertText', false, tweet_text) }, 99);

          setTimeout(() => { document.querySelector(REPLY_BUTTON_SELECTOR).click() }, 500);

          // setTimeout(() => {
          //   var screen_name = localStorage.getItem('___twitter_screen_name');
          //   location.href = 'https://tweet.is/dosearch?screen_name='+screen_name;
          // }, Math.floor(Math.random() * 4000) + 5000);

        }, Math.floor(Math.random() * 2000) + 900);
      }

      // // Infinite Scroller
      if (location.search.includes('scroll=1')) {
        setInterval(() => document.querySelector('body, html').scrollTop += 1000, (Math.floor(Math.random() * 1000) + 1500));
        //   setTimeout(() => { location.reload() }, Math.floor(Math.random() * 10000) + 50000);
      }

    }
  }, 10);
});
