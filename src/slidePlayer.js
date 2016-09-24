;(function (window, document) {

    var configSlug = 'spConfig';
    var ns = 'sp_' + new Date().getTime() + '/';
    var emitter = document.body;


    // SLIDE PLAYER

    var SlidePlayerInstance = (function () {
        var instance = null;

        function SlidePlayer() {
            console.log('SlidePlayer');

            var _this = this;

            this.config = window[configSlug];
            this.video = null;
            this.root = this.getContainer();
            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            emitter.addEventListener(ns + 'utils/resize', function (e) {
                _this.onResize(e.detail);
            }, false);

            this.setupPlayerDomStructure();

            return this;
        }

        SlidePlayer.prototype.constructor = SlidePlayer;

        SlidePlayer.prototype.onResize = function (data) {
            // console.log(data);
        };

        SlidePlayer.prototype.getContainer = function () {
            var rootSelector = this.config.rootSelector;
            if (!rootSelector) {
                throw new Error('Config\'s rootSelector must be set');
            } else if (rootSelector.charAt(0) === '#') {
                return document.querySelector(rootSelector);
            } else if (rootSelector.charAt(0) === '.') {
                return document.querySelectorAll(rootSelector)[0];
            } else {
                throw new Error('Config\'s rootSelector must be a class or id-selector');
            }
        };

        SlidePlayer.prototype.setupPlayerDomStructure = function () {

            this.root.className += 'slide-player-root';

            var container = document.createElement('div');
            container.className = 'slide-player-container';
            container.style.paddingTop = Helpers.getAspectRatioAsPercent(this.config.aspectRatio);
            this.root.appendChild(container);

            var catcher = document.createElement('div');
            catcher.className = 'slide-player-catcher';
            container.appendChild(catcher);

            var video = document.createElement('video');
            video.className = 'slide-player-video';
            video.setAttribute('src', this.getVideoSource());
            if (this.config.debug) {
                video.setAttribute('controls', 'true');
            }
            video = container.appendChild(video);
            this.video = VideoInstance.getInstance(video);
        };

        SlidePlayer.prototype.getVideoSource = function () {
            if (!~(Helpers.doesObjectExist(this.config.videoPaths))) {
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


    // VIDEO

    var VideoInstance = (function () {
        var instance = null;

        function Video(videoElement) {
            console.log('Video');
            this.elem = videoElement;
            return this;
        }

        Video.prototype.constructor = Video;

        Video.prototype.gotoAndPlay = function (start, end) {
            this.elem.play();
        };

        return {
            getInstance: function (param) {
                if (!instance) {
                    instance = new Video(param);
                }
                return instance;
            }
        }

    })();


    // SCENE

    var SceneInstance = (function () {
        var instance = null;

        function Scene(videoElement) {
            console.log('Video');
            this.elem = videoElement;
            return this;
        }

        Scene.prototype.constructor = Scene;

        Scene.prototype.fadeIn = function (start, end) {
            this.elem.play();
        };

        Scene.prototype.fadeOut = function (start, end) {
            this.elem.play();
        };

        return {
            getInstance: function (param) {
                if (!instance) {
                    instance = new Scene(param);
                }
                return instance;
            }
        }

    })();


    // POSTER

    var PostersInstance = (function () {
        var instance = null;

        function Poster() {
            console.log('Poster');
            return this;
        }

        Poster.prototype.constructor = Poster;

        Poster.prototype.posterReady = function (fn) {
            var scenes = window.spConfig.scenes,
                index = 0,
                length = scenes.length;
            var id = Helpers.getUniqueId();
            for (; index < length; index++) {
                var img = new Image();
                img.src = scenes[index].poster + '?' + ns;
                img.onload = function () {
                    index--;
                };
            }
            Ticker.registerTask(id, function () {
                if (index === 0) {
                    fn();
                    Ticker.removeTask(id);
                }
            });

        };

        return {
            getInstance: function (param) {
                if (!instance) {
                    instance = new Poster(param);
                }
                return instance;
            }
        }

    })();


    // BROWSER UTILS

    var BrowserUtilsInstance = (function () {
        var instance = null;

        function BrowserUtils() {
            console.log('BrowserUtils');
            this.config = window[configSlug];
            this.lastBreakPoint = null;
            this.currentBreakPoint = 'N/A';
            var _this = this;
            this.watchWindowSize();
            this.setBreakPointState();

            // dispatching the event without a delay isn't captured
            setTimeout(function () {
                Helpers.dispatchCustomEvent('utils/resize', {breakPointData: _this.getBreakPointState()});
            }, 1);

            return this;
        }

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
            if (!~(Helpers.doesObjectExist(this.config.breakPoints))) {
                console.warn('No breakPoints defined. Will use \'{small: 0}\' instead.');
                this.config.breakPoints = {small: 0};
            }
            this.lastBreakPoint = this.currentBreakPoint;
            var browserWidth = this.getBrowserWidth();
            for (var breakpoint in this.config.breakPoints) {
                if (this.config.breakPoints.hasOwnProperty(breakpoint)) {
                    if (this.config.breakPoints[breakpoint] < browserWidth) {
                        this.currentBreakPoint = breakpoint;
                    }
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
            // alo see: http://stackoverflow.com/questions/7451635/how-to-detect-supported-video-formats-for-the-html5-video-tag
            // and: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video.js#L38
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


    // TICKER

    var Ticker = (function () {

        var tasks = {};
        var afId;
        var tickerCount = 0;

        function registerTask(id, task) {
            tasks[id] = task;
            startTicker();
        }

        function removeTask(id) {
            delete tasks[id];
            if (Helpers.getObjectSize(tasks) === 0) {
                stopTicker();
            }
        }

        function tick() {
            for (var task in tasks) {
                tasks[task](++tickerCount);
            }
            afId = requestAnimationFrame(tick);
        }

        function startTicker() {
            afId = requestAnimationFrame(tick);
        }

        function stopTicker() {
            // setTimeout is needed because ´tick()´ would overpass ´cancelAnimationFrame()´ => endless loop
            setTimeout(function () {
                window.cancelAnimationFrame(afId);
            }, 1);
        }

        return {
            registerTask: registerTask,
            removeTask: removeTask
        }

    })();


    // ANIMATION

    var Animation = (function () {

        function animate(element, props, time, callback) {

        }

        return {
            animate: animate
        }

    })();


    // HELPERS

    var Helpers = (function () {

        var uniqueId = ~~(Math.random() * 1000);

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
            return (!obj) ? -1 : getObjectSize(obj);
        }

        function getObjectSize(obj) {
            var size = 0;
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    size++;
                }
            }
            return size;
        }

        function getUniqueId() {
            return ++uniqueId + '';
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
            getObjectSize: getObjectSize,
            getUniqueId: getUniqueId,
            dispatchCustomEvent: dispatchCustomEvent,
            getAspectRatioAsPercent: getAspectRatioAsPercent
        }

    })();

    // TODO : implement first sanity check if crucial information is present, then start loading video / posters
    Helpers.domReady(function () {
        PostersInstance.getInstance().posterReady(function () {
            SlidePlayerInstance.getInstance();
        });
    });

})(window, document);

/*
 [1]
 scene initiates
 show poster (with transition)
 generate hotSpots (delayed transition one by one)

 [2]
 click on hotSpot with timeLine target
 preLoading of target seeking point -> when ready
 - hide poster
 - hide hotSpots
 - play on seeking point -> when finished playing : repeat [1]

 [3]
 click on hotSpot with selector target
 - generate overlay container
 - show catcher

 [4]
 click on overlay container close button or on catcher
 - close overlay container
 - hide catcher

 */