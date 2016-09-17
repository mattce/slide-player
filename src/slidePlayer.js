;(function (window, document) {

    var configSlug = 'spConfig';
    var ns = 'sp_' + new Date().getTime() + '/';
    var emitter = document.body;


    // SLIDE PLAYER

    var SlidePlayerInstance = (function () {
        var instance = null;

        function SlidePlayer() {
            console.log('SlidePlayer here');
            var _this = this;

            this.config = window[configSlug];
            this.video = null;
            this.container = document.querySelector('#slidePlayer');
            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            emitter.addEventListener(ns + 'utils/resize', function (e) {
                _this.onResize(e.detail);
            }, false);

            this.setupPlayerDomStructure();
        }

        SlidePlayer.prototype.constructor = SlidePlayer;

        SlidePlayer.prototype.onResize = function (data) {
            console.log(data);
        };

        SlidePlayer.prototype.setupPlayerDomStructure = function () {
            var innerContainer = document.createElement('div');
            innerContainer.style.height = '0px';
            innerContainer.style.position = 'relative';
            innerContainer.style.paddingTop = Helpers.getAspectRatioAsPercent(this.config.aspectRatio);
            this.container.appendChild(innerContainer);

            this.video = document.createElement('video');
            this.video.style.position = 'absolute';
            this.video.style.height = this.video.style.width = '100%';
            this.video.style.top = this.video.style.left = '0px';
            this.video.setAttribute('src', this.getVideoSource());
            if (this.config.debug) {
                this.video.setAttribute('controls', true);
            }
            innerContainer.appendChild(this.video);
        };

        SlidePlayer.prototype.getVideoSource = function () {
            if (!Helpers.doesObjectExist(this.config.videoPaths)) {
                throw new Error('No video paths defined in config!');
            }
            var breakPointState = this.BrowserUtils.getBreakPointState();
            var supportedMediaType = this.BrowserUtils.getSupportedMediaType();
            return this.config.videoPaths[breakPointState][supportedMediaType];
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


    // BROWSER UTILS

    var BrowserUtilsInstance = (function () {
        var instance = null;

        var BrowserUtils = function () {
            console.log('Browser here');
            this.config = window[configSlug];
            this.lastBreakPoint = null;
            this.currentBreakPoint = 'N/A';

            this.watchWindowSize();
            this.setBreakPointState();
            // TODO : investigate why this is not thrown on init
            Helpers.dispatchCustomEvent('utils/resize', {breakPointData: this.getBreakPointState()});
        };

        BrowserUtils.prototype.constructor = BrowserUtils;

        BrowserUtils.prototype.watchWindowSize = function () {
            var _this = this;
            window.addEventListener('resize', Helpers.debounce(function () {
                _this.setBreakPointState();
                if (_this.lastBreakPoint !== _this.currentBreakPoint) {
                    Helpers.dispatchCustomEvent('utils/resize', {breakPointData: _this.getBreakPointState()});
                }
            }, 300), false);
        };

        BrowserUtils.prototype.setBreakPointState = function () {
            if (!Helpers.doesObjectExist(this.config.breakPoints)) {
                console.warn('No breakPoints defined. Will use \'{small: 0}\' instead.');
                this.config.breakPoints = {small: 0};
            }
            this.lastBreakPoint = this.currentBreakPoint;
            var browserWidth = this.getBrowserWidth();
            for (var breakpoint in this.config.breakPoints) {
                if (this.config.breakPoints[breakpoint] < browserWidth) {
                    this.currentBreakPoint = breakpoint;
                }
            }
        };

        BrowserUtils.prototype.getBreakPointState = function () {
            return this.currentBreakPoint;
        };

        BrowserUtils.prototype.getBrowserWidth = function () {
            var windowWidth = window.innerWidth,
                documentWidth = document.documentElement.clientWidth,
                bodyWidth = document.getElementsByTagName('body')[0].clientWidth;
            return windowWidth || documentWidth || bodyWidth;
        };

        BrowserUtils.prototype.getSupportedMediaType = function () {
            var elem = document.createElement('video'),
                types = {
                    ogg: 'video/ogg; codecs="theora"',
                    h264: 'video/mp4; codecs="avc1.42E01E"',
                    webm: 'video/webm; codecs="vp8, vorbis"',
                    vp9: 'video/webm; codecs="vp9"',
                    hls: 'application/x-mpegURL; codecs="avc1.42E01E"'
                };
            if (!!elem.canPlayType) {
                for (var type in types) {
                    if (!!(elem.canPlayType(types[type]).replace(/^no$/, ''))) {
                        return type;
                    }
                }
                throw new Error('Video Source needs to inherit one of the following codecs:\n["ogg", "h264", "webm", "vp9", "hls"]');
            } else {
                throw new Error('Video Element doesn\'t work in your browser.')
            }
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


    // HELPERS

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

        function doesObjectExist(obj) {
            var i = 0;
            if (!obj) return false;
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    i++;
                }
            }
            return !!i;
        }

        function dispatchCustomEvent(eventName, data) {
            emitter.dispatchEvent(new CustomEvent(ns + eventName, {detail: data}));
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
            doesObjectExist: doesObjectExist,
            dispatchCustomEvent: dispatchCustomEvent,
            getAspectRatioAsPercent: getAspectRatioAsPercent
        }

    })();

    Helpers.domReady(function () {
        SlidePlayerInstance.getInstance();
    });

})(window, document);
