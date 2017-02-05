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
  if (a.length < 2) {
    return urlParams;
  }

  var match,
  pl     = /\+/g,
  search = /([^&=]+)=?([^&]*)/g,
  decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
  while (match = search.exec(a[1])) {
    urlParams[decode(match[1])] = decode(match[2]) ;
  }

  return urlParams;
}

/**
  * Add or update the test results in the UI
  *
  * @param {test} test - the test to update in the test results table
  */
function updateUI(test) {
  var table = document.getElementById('tests');
  var row = document.getElementById('test-' + test.id);
  if (row == null) {
    row = document.createElement("tr");
    table.appendChild(row);
  }
  row.id = 'test-' + test.id;
  row.innerHTML = '<td>' + test.parameter + '</td><td>' + test.result + '</td>';
}

/*
  Class to contain the test case
*/
class Test {
  constructor(id, baseUrl, parameter) {
    this.id = id;
    this.baseUrl = baseUrl;
    this.parameter = parameter;
    this.testString = "<script>alert('" + id + "')</script>";
    updateUI(this);
  }
  getUrl() {
    return this.baseUrl + "?" + encodeURIComponent(this.parameter)+ "=" + encodeURIComponent(this.testString);
  }
  run() {
    var test = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", test.getUrl(), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        test.result = xhr.responseText.includes(test.testString);
        updateUI(test);
      }
    }
    xhr.send();
  }
}

/*
  Class to contain the XSS Audit
*/
class Audit {
  constructor(url) {
    this.url = url;
    this.baseUrl = url.split('?')[0];
    this.urlParams = getURLParameters(url);
  }
  run() {
    // Create a test case for each URL Parameter
    var tests = [];
    var testId = 1;
    for (var urlParam in this.urlParams) {
      new Test(testId, this.baseUrl, urlParam).run();
      testId++;
    }
  }
}

/*
  Run the XSS audit
*/
document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    new Audit(url).run();
  });
});
