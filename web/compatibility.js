(function checkRangeRequests() {
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

    if (!isSafari) {
        return;
    }

    document.addEventListener('DOMContentLoaded', function (e) {
        if (isSafari) {
            PDFJS.disableRange = true;
        }
    });
})();