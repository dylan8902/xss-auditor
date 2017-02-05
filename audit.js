TEST_CASES = [
  {
    name: "Straight script tags",
    inject: "<script>alert('${id}')</script>",
    assert: "<script>alert('${id}')</script>"
  },
  {
    name: "Close a single quote",
    inject: "'><script>alert('${id}')</script><span id='",
    assert: "<script>alert('${id}')</script>"
  },
  {
    name: "Close a double quote",
    inject: "\"><script>alert('${id}')</script><span id=\"",
    assert: "<script>alert('${id}')</script>"
  }
];

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
    row.id = 'test-' + test.id;
    table.appendChild(row);
  }
  row.innerHTML = test.getResultRow();
  row.addEventListener('click', function() {
    chrome.tabs.create({ url: test.url });
  });
}

/*
  Class to contain the test case
*/
class Test {
  constructor(id, baseUrl, parameter, testCase) {
    this.id = id;
    this.baseUrl = baseUrl;
    this.parameter = parameter;
    this.testString = testCase.inject.replace("${id}", id);
    this.testAssertion = testCase.assert.replace("${id}", id);
    this.name = testCase.name;
    this.url =  baseUrl + "?" + encodeURIComponent(parameter)+ "=" + encodeURIComponent(this.testString);
    updateUI(this);
  }
  getResultRow() {
    return '<td>' + this.name + ' for ' + this.parameter + '</td><td>' + this.result + '</td>';
  }
  run() {
    var test = this;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", test.url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        test.result = xhr.responseText.includes(test.testAssertion);
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
    var testId = 1;
    for (var urlParam in this.urlParams) {
      for (var i in TEST_CASES) {
        new Test(testId, this.baseUrl, urlParam, TEST_CASES[i]).run();
        testId++;
      }
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
