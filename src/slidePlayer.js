;(function (window, document) {


    // BROWSER UTILS

    var BrowserUtilsInstance = (function () {
        var instance = null;

        var BrowserUtils = function () {
            console.log('Browser here');
            this.config = window.spConfig;
        };

        BrowserUtils.prototype.constructor = BrowserUtils;

        BrowserUtils.prototype.watchWindowSize = function () {
            window.addEventListener('resize', Helpers.debounce(function () {
                console.log(window.innerWidth);
            }, 300), false);
        };

        BrowserUtils.prototype.getCurrentMediaState = function () {
            // TODO return correct MediaState ('small'|'medium'|'large') according to window width
            return 'medium';
        };

        BrowserUtils.prototype.getSupportedMediaType = function () {
            // TODO return correct MediaType ('mp4'|'ogg'|'webm') according to browser support
            return 'webm';
        };

        return {
            getInstance: function () {
                if (!instance) {
                    instance = new BrowserUtils();
                }
                return instance;
            }
        }

    })();


    // SLIDE PLAYER

    var SlidePlayerInstance = (function () {
        var instance = null;

        function SlidePlayer() {
            console.log('SlidePlayer here');
            this.config = window.spConfig;
            this.video = null;
            this.container = document.querySelector('#slidePlayer');
            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            this.setupPlayerDomStructure();
        }

        SlidePlayer.prototype.constructor = SlidePlayer;

        SlidePlayer.prototype.setupPlayerDomStructure = function () {
            var innerContainer = document.createElement('div');
            innerContainer.style.height = '0px';
            innerContainer.style.position = 'relative';
            innerContainer.style.paddingTop = Helpers.getAspectRatioAsPercent(this.config.aspectRatio);
            this.container.appendChild(innerContainer);

            this.video = document.createElement('video');
            this.video.setAttribute('src', this.getVideoSource());
            this.video.style.position = 'absolute';
            this.video.style.height = this.video.style.width = '100%';
            this.video.style.top = this.video.style.left = '0px';
            innerContainer.appendChild(this.video);
        };

        SlidePlayer.prototype.getVideoSource = function () {
            var currentMediaState = this.BrowserUtils.getCurrentMediaState();
            var supportedMediaType = this.BrowserUtils.getSupportedMediaType();
            return this.config.videoPaths[currentMediaState][supportedMediaType];
        };

        return {
            getInstance: function () {
                if (!instance) {
                    instance = new SlidePlayer();
                }
                return instance;
            }
        }

    })();

    var Helpers = (function () {

        function domReady(fn) {
            if (document.readyState === 'complete' && window.spConfig) {
                fn();
            } else {
                setTimeout(function () {
                    domReady(fn);
                }, 9)
            }
        }

        function debounce(func, wait, immediate) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        function getAspectRatioAsPercent(ratio) {
            if (ratio && !!~(ratio.indexOf(':'))) {
                return (ratio.split(':')[1] / ratio.split(':')[0]) * 100 + '%';
            }
            console.warn('No correct aspectRatio is provided. Will use \'16:9\' instead.');
            return getAspectRatioAsPercent('16:9');
        }

        return {
            domReady: domReady,
            debounce: debounce,
            getAspectRatioAsPercent: getAspectRatioAsPercent
        }

    })();

    Helpers.domReady(function () {
        SlidePlayerInstance.getInstance();
    });

})(window, document);
