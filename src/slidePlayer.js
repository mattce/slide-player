var slidePlayer = (function (window, document) {
    console.log(document.querySelector('#slidePlayer'));


    function init() {
        console.log('init');
    }

    function domReady(fn) {
        if (/in/.test(document.readyState)) {
            setTimeout(function () {
                domReady(fn);
            }, 9)
        } else {
            fn();
        }
    }

    domReady(init);

})
(window, document);
