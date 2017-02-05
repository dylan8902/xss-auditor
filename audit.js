/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}

/**
  * Parse the URL for parameters
  *
  * @param {string} url - the URL to pull the prameters out of
  *
  * @return an object of URL parameters
  */
function getURLParameters(url) {
  var urlParams = {};
  var a = url.split('?');
  console.log(a);
  if (a.length < 2) {
    return urlParams;
  }

  var match,
  pl     = /\+/g,
  search = /([^&=]+)=?([^&]*)/g,
  decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
  while (match = search.exec(a[1])) {
    urlParams[decode(match[1])] = decode(match[2]);
  }

  return urlParams;
}

/**
 * Populate the UI witht eh URL Parameters
 *
 * @param {string} urlParams - the URL key-values
 */
function populateParameters(urlParams) {
  var parameters = document.getElementById('parameters')
  for (var key in urlParams) {
    var tr = document.createElement("tr");
    tr.innerHTML = '<td>' + key + '</td><td>' + urlParams[key] + '</td>';
    parameters.appendChild(tr);
  }
}

/*
  Run the XSS audit:
  1) Get the current tab URL
  2) Show the existing URL parameters
*/
document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    urlParams = getURLParameters(url);
    populateParameters(urlParams);
  });
});
