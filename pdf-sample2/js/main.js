// Variables **CHANGE THESE - KEEP THE QUOTES**
let objectName = "xAPI PDF Viewer";
let objectID = "https://www.company.org/xapi/activities/psd/nuxeo-system-overview";

// Variables **DO NOT CHANGE**
let userName = "Sammy McGee";
let userEmail = "user@example.com";
let xAPIReporting = true;
let SD = null;
let currPage = 1;
let alertMsg = document.getElementById("alertMsg");

// Show modal on load to capture users name
$(document).ready(function(){
  if(xAPIReporting){
      $('#userInfo').modal("show");
  };
});

// Save user info to variables
function saveName(){
	userName = document.getElementById('nameEntered').value;
	console.log(userName);
}

function saveEmail(){
	userEmail = document.getElementById('userEmail').value;
	console.log(userEmail)
}

function saveUserInfo(){
  if(userName != "" && userEmail != ""){
      $('#userInfo').modal("hide");
  } else{
      alertMsg.classList.remove('d-none');
  }
}

// Loading PDF JS Lib
let pdfjsLib = window['pdfjs-dist/build/pdf'],
    url = document.querySelectorAll('[data-pdf-src]')[0].getAttribute('data-pdf-src'),
    pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = document.querySelectorAll('[data-pdf-res]')[0].getAttribute('data-pdf-res'),
    reachedBottom = false;

document.body.innerHTML += "\n<div class=\"pdf-container\">\n<div id=\"pdf-viewer\">\n</div>\n";
// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = './js/pdf.worker.min.js';

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({scale: scale});

    var canvasId = 'pdf-viewer-' + num;
    var canvasDom = document.createElement('canvas');
    canvasDom.id = canvasId;
    canvasDom.className = 'pdf-canvas';
    document.getElementById('pdf-viewer').innerHTML = '';
    document.getElementById('pdf-viewer').appendChild(canvasDom);
    var canvas = document.getElementById(canvasId);

    var ctx = canvas.getContext('2d');    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}


function renderAllPages() {
 for (var i = 1; i <= pdfDoc.numPages; i++) {
  renderPage(i);
 }
}

function renderControls(currPage, isLastPage, isFirstPage) {
  if (!document.querySelector('#page-controls')) {
    var controls = document.createElement('div');
    controls.id = "page-controls";
    controls.className = "page-controls-fixed";
    document.body.appendChild(controls);
  }

  if (typeof isLastPage === 'undefined') {
    isLastPage = currPage === pdfDoc.numPages;
  }

  if (typeof isFirstPage === 'undefined') {
    isFirstPage = currPage === 1;
  }

  var controlsDom = document.querySelector('#page-controls');
  var prevBtn = '<button class="btn-primary" onClick="goPagePrev()" ' + (isFirstPage ? 'disabled' : '') + '><span class="icon">&#8592;</span> <span>Prev</span></button>';
  var nextBtn = '<button class="btn-primary" onClick="goPageNext()" ' + (isLastPage ? 'disabled' : '') + '><span>Next</span> <span class="icon">&#8594;</span></button>';

  controlsDom.innerHTML = prevBtn + ' ' + nextBtn;
}

// This function gets called when a page updates
function updatePageState(currPage) {
  var isLastPage = currPage === pdfDoc.numPages;
  var isFirstPage = currPage === 2;  
  renderPage(currPage);
  document.querySelector('html').scrollTo(0,0);
  renderControls(currPage);

  if (isFirstPage){
    sendBasicStatement("https://w3id.org/xapi/dod-isd/verbs/started", "started", objectName, "The user started the " + objectName + " PDF.");
  }

  if (isLastPage) {
    var completeText = getAttributeValue('data-completion-text', 'completionText', 'Complete');

    document.querySelector('#page-controls').innerHTML += '<button class="btn-primary complete-btn mt-2" onClick="markComplete()">' + completeText + '</button>';

    document.querySelector('.complete-btn').addEventListener('dblclick', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    markComplete();
  } else {
    removeElement('.complete-btn');
    removeElement('.complete-msg');
  }

  // Send statement on specific page example

  /*if (currPage == 3){
    sendBasicStatement("", "", objectName, "");
  }*/

}

function goPagePrev() {
  if (window.event && window.event.stopPropagation)
    window.event.stopPropagation();
  currPage--;
  updatePageState(currPage);
}

function goPageNext() {
  if (window.event && window.event.stopPropagation)
    window.event.stopPropagation();
  currPage++;
  updatePageState(currPage);
}

// function getResumePage() {
//   if (SD && SD.GetBookmark)
//     return SD.GetBookmark() || 1;
//   return 1; // default
// }

function setResumePage(page) {
  // if (SD && SD.SetBookmark)
  //   SD.SetBookmark(page, 'current page');
}

setTimeout(function() {
  // currPage = getResumePage();
  setTimeout(function() {

    currPage = parseInt(currPage,10);
    
    /**
     * Asynchronously downloads PDF.
     */
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
      pdfDoc = pdfDoc_;

      updatePageState(currPage);

      document.body.addEventListener('dblclick', function() {
        document.body.classList.toggle('zoomed');
      });
    });
  }, 0);
}, 0);

function getAttributeValue(attribute, key, fallback) {
  var dataAttributeText;

  try {
    dataAttributeText = document.querySelector('[' + attribute + ']').dataset[key]
  } catch (e) {

  }
  return dataAttributeText || fallback;
}

function removeElement(selector) {
  var el = document.querySelector(selector);
  if (el) {
    el.parentNode.removeChild(el); 
  }
}

function displayCompletedMessage(msg, delay, removeButton) {
  setTimeout(function() {
    if(removeButton) {
      removeElement('.complete-btn');
    }
    removeElement('.complete-msg');
    var completedMessage = document.createElement('p');
    completedMessage.innerText = msg;
    completedMessage.className = 'complete-msg';
    document.body.appendChild(completedMessage);
  }, delay);  
}

function xAPIComplete() {
  var completedText = getAttributeValue('data-completed-text', 'completedText', 'Completed successfully, you may now close this window.');
  displayCompletedMessage(completedText, 2000, true);
  sendBasicStatement("http://adlnet.gov/expapi/verbs/completed", "completed", objectName, "The user completed the " + objectName + " PDF.");
}

/**
 * TODO - add scorm completion here
 **/
function markComplete() {
  removeElement('.complete-msg');
  var completingText = getAttributeValue('data-completing-text', 'completingText', 'Completing');
  var btn = document.querySelector('.complete-btn');
  var origHTML = btn.innerHTML;
  btn.innerHTML = "<span class=\"flex-btn\"><div class=\"lds-ring\"><div></div><div></div><div></div><div></div></div><span>" + completingText + "</span></span>";
  btn.setAttribute('disabled', true);
  btn.classList.add('disabled');

  xAPIComplete();
}

// xAPI Basic Statement
function sendBasicStatement(verbID, verb, objectName, objectDesc) {
  console.log(userName + userEmail);
  let statement = {
    "actor": {
			"mbox": "mailto:"+userEmail,  
			"name": userName,  
			"objectType": "Agent"  
		},
    "verb": {
      "id": verbID,
      "display": {
        "en-US": verb
      }
    },
    "object": {
      "id": objectID,
      "definition": {
        "name": {
          "en-US": objectName
        },
        "description": {
          "en-US": objectDesc
        }
      },
      "objectType": "Activity"
    }
  };
  ADL.XAPIWrapper.sendStatement(statement);
}