window.slidePlayer = (function (window, document) {

    var config = {};
    var container = null;
    var video = null;


    function init() {
        config = window.spConfig;
        container = document.querySelector('#slidePlayer');

        setupPlayerDomStructure();
    }

    function setupPlayerDomStructure() {
        var innerContainer = document.createElement('div');
        innerContainer.style.height = '0px';
        innerContainer.style.position = 'relative';
        innerContainer.style.paddingTop = getAspectRatioAsPercent(config.aspectRatio);
        container.appendChild(innerContainer);

        var video = document.createElement('video');
        video.setAttribute('src', getVideoSource());
        video.style.position = 'absolute';
        video.style.height = video.style.width = '100%';
        video.style.top = video.style.left = '0px';
        innerContainer.appendChild(video);
    }

    function getVideoSource() {
        return config.videoPaths[getCurrentMediaState()][getSupportedMediaType()];
    }

    function getCurrentMediaState() {
        // TODO return correct MediaState ('small'|'medium'|'large') according to window width
        return 'medium';
    }

    function getSupportedMediaType() {
        // TODO return correct MediaType ('mp4'|'ogg'|'webm') according to browser support
        return 'webm';
    }

    function getAspectRatioAsPercent(ratio) {
        if (ratio && !!~(ratio.indexOf(':'))) {
            return (ratio.split(':')[1] / ratio.split(':')[0]) * 100 + '%';
        }
        console.warn('No correct aspectRatio is provided. Will use \'16:9\' instead.');
        return getAspectRatioAsPercent('16:9');
    }

    function domReady(fn) {
        if ( document.readyState === 'complete' && window.spConfig) {
            fn();
        } else {
            setTimeout(function () {
                domReady(fn);
            }, 9)
        }
    }

    domReady(init);

})
(window, document);
