;(function (window, document) {

    var configSlug = 'spConfig';
    var breakPointClassPrefix = 'is-';
    var ns = 'sp_' + new Date().getTime() + '/';
    var emitter = document.body;


    // SLIDE PLAYER

    var SlidePlayerInstance = (function () {
        var instance = null;

        function SlidePlayer() {
            console.log('SlidePlayer');

            var _this = this;

            this.config = window[configSlug];
            this.breakPointClasses = this.generateBreakPointClasses();

            this.root = this.getContainer();
            this.container = null;
            this.catcher = null;
            this.poster = null;
            this.video = null;
            this.setupPlayerDomStructure();

            this.lastScene = null;
            this.currentScene = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();
            this.Poster = PosterInstance.getInstance().setupDomStructure(this.poster);
            this.Scene = SceneInstance.getInstance(this.config.scenes);
            this.Catcher = CatcherInstance.getInstance(this.catcher);

            emitter.addEventListener(ns + 'utils/resize', function (e) {
                _this.onResize(e.detail);
            }, false);

            return this;
        }

        SlidePlayer.prototype.constructor = SlidePlayer;

        SlidePlayer.prototype.onResize = function (data) {
            this.BrowserUtils.toggleClass(this.root, breakPointClassPrefix + data.breakPointData, this.breakPointClasses);
        };

        SlidePlayer.prototype.start = function () {
            this.goToAndPlay(this.config.scenes[0]);

            console.log(this);
        };

        SlidePlayer.prototype.goToAndPlay = function (scene) {
            /*
             var _this = this;
             this.BrowserUtils.fadeOutElement(this.root, 2000, 200);

             setTimeout(function () {
             _this.BrowserUtils.fadeInElement(_this.root, 2000, 200);
             }, 5000);
             */
            if (!this.lastScene) { // application just started
                // this.Poster.showPoster(scene.id);
                this.Scene.show(scene.hotSpots);
            } else {

            }
        };

        SlidePlayer.prototype.getContainer = function () {
            var rootSelector = this.config.rootSelector;
            if (rootSelector.charAt(0) === '#') {
                return document.querySelector(rootSelector);
            } else if (rootSelector.charAt(0) === '.') {
                return document.querySelectorAll(rootSelector)[0];
            }
        };

        SlidePlayer.prototype.setupPlayerDomStructure = function () {

            var BrowserUtils = BrowserUtilsInstance.getInstance();

            this.root.className += 'slide-player-root';

            this.container = BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-container',
                styles: {
                    paddingTop: Helpers.getAspectRatioAsPercent(this.config.aspectRatio)
                }
            });
            this.root.appendChild(this.container);

            this.catcher = BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-catcher'
            });
            // this.container.appendChild(this.catcher);

            this.poster = BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-poster'
            });
            this.container.appendChild(this.poster);

            var video = BrowserUtils.createElement({
                type: 'video',
                className: 'slide-player-video',
                attributes: {
                    src: this.getVideoSource(),
                    controls: this.config.debug ? 'true' : 'N/A'
                },
                styles: {
                    opacity: 1
                }
            });
            video = this.container.appendChild(video);
            this.video = VideoInstance.getInstance(video);
        };

        SlidePlayer.prototype.generateBreakPointClasses = function () {
            var classes = [];
            for (var breakpoint in this.config.breakPoints) {
                classes.push(breakPointClassPrefix + breakpoint);
            }
            return classes;
        };

        SlidePlayer.prototype.getVideoSource = function () {
            var BrowserUtils = BrowserUtilsInstance.getInstance();
            var breakPointState = BrowserUtilsInstance.getInstance().getBreakPointState();
            var supportedMediaType = BrowserUtilsInstance.getInstance().getSupportedMediaType();
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
            var _this = this;
            this.elem = videoElement;
            console.log(videoElement.seekable);

            this.elem.addEventListener('canplaythrough', function () {
                console.log('Video can play through', arguments);
            });

            this.elem.addEventListener('timeupdate', function () {
                // console.log('Video timeupdate .:: currentTime = ', _this.elem.currentTime);
            });

            this.elem.addEventListener('playing', function () {
                console.log('Video is playing', arguments);
                Ticker.registerTask('asd', function () {
                    console.log(_this.elem.currentTime);
                    if (_this.elem.currentTime >= 2) {
                        _this.elem.pause();
                        Ticker.removeTask('asd');
                    }
                });
            });

            return this;
        }

        Video.prototype.constructor = Video;

        Video.prototype.playScene = function (sceneId, direction) {
            this.elem.play();
        };

        Video.prototype.seekAndPlay = function () {

        };

        Video.prototype.playTimeRange = function (start, end) {

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

        function Scene(scenes) {
            console.log('Scene');

            this.scenes = scenes;
            console.log(this.scenes);

            return this;
        }

        Scene.prototype.constructor = Scene;

        Scene.prototype.show = function (sceneId) {

        };

        Scene.prototype.hide = function (sceneId) {

        };

        return {
            getInstance: function (params) {
                if (!instance) {
                    instance = new Scene(params);
                }
                return instance;
            }
        }

    })();


    // POSTER

    var PosterInstance = (function () {
        var instance = null;

        function Poster() {
            console.log('Poster');
            this.root = null;
            this.posters = [];
            this.zIndex = 1;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            return this;
        }

        Poster.prototype.constructor = Poster;

        Poster.prototype.posterReady = function (fn) {
            var _this = this;

            var scenes = window.spConfig.scenes,
                count = scenes.length;

            var id = Helpers.getUniqueId();

            scenes.forEach(function (value, index, array) {
                var sceneId = scenes[index].id;
                var img = _this.BrowserUtils.createElement({
                    type: 'img',
                    className: 'slide-player-poster-img slide-player-poster-img-' + sceneId,
                    attributes: {
                        src: scenes[index].poster + '?' + ns,
                        'data-scene-id': sceneId
                    },
                    styles: {
                        opacity: 0
                    }
                });
                img.onload = function () {
                    count--;
                    _this.posters.push({
                        image: this,
                        id: this.getAttribute('data-scene-id')
                    });
                };
            });

            Ticker.registerTask(id, function () {
                if (count === 0) {
                    fn();
                    Ticker.removeTask(id);
                }
            });

        };

        Poster.prototype.setupDomStructure = function (root) {
            var _this = this;

            this.root = root;
            this.posters.forEach(function (value, index, array) {
                _this.root.appendChild(value.image);
            });

            return this;
        };

        Poster.prototype.showPoster = function (id) {
            var currentPoster = this.getPosterFromId(id);
            this.BrowserUtils.setStylesOfElement(currentPoster, {zIndex: this.zIndex++});
            this.BrowserUtils.fadeInElement(currentPoster);
        };

        Poster.prototype.hidePoster = function (id) {
            var currentPoster = this.getPosterFromId(id);
            this.BrowserUtils.fadeOutElement(currentPoster);
        };

        Poster.prototype.getPosterFromId = function (id) {
            var poster = null;
            this.posters.forEach(function (value, index, array) {
                if (value.id === id) {
                    poster = value.image;
                }
            });
            return poster;
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


    // CATCHER

    var CatcherInstance = (function () {
        var instance = null;

        function Catcher(parent) {
            this.parent = parent;
            this.root = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            this.setupCatcherDomStructure();

            return this;
        }

        Catcher.prototype.constructor = Catcher;

        Catcher.prototype.setupCatcherDomStructure = function () {
            this.root = this.BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-catcher'
            });
            this.parent.appendChild(this.root);
            // this.hideCatcher();
        };

        Catcher.prototype.showCatcher = function (fn) {
            this.BrowserUtils.setStylesOfElement(this.root, {display: 'block'});
            this.root.addEventListener('click', this.onClick(fn));
        };

        Catcher.prototype.hideCatcher = function () {
            this.BrowserUtils.setStylesOfElement(this.root, {display: 'none'});
            this.root.removeEventListener('click', this.onClick, false);
        };

        Catcher.prototype.onClick = function (fn) {
            fn();
        };

        return {
            getInstance: function (param) {
                if (!instance) {
                    instance = new Catcher(param);
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

            var _this = this;

            this.config = window[configSlug];
            this.lastBreakPoint = null;
            this.currentBreakPoint = 'N/A';

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

        BrowserUtils.prototype.createElement = function (params) {
            if (!params.type) throw new Error('\'type\' must be set for \'BrowserUtils.createElement()\'');

            var element = document.createElement(params.type);
            element.className = params.className;
            if (params.styles) {
                this.setStylesOfElement(element, params.styles);
            }
            if (params.attributes) {
                this.setAttributesOfElement(element, params.attributes);
            }
            return element;
        };

        BrowserUtils.prototype.setBreakPointState = function () {
            if (Helpers.getObjectSize(this.config.breakPoints) < 1) {
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

        BrowserUtils.prototype.fadeInElement = function (element, duration, delay, callback) {
            var _this = this;
            duration = duration || 300;
            delay = delay || 0;
            this.setStylesOfElement(element, {
                opacity: 0,
                display: 'block',
                'transition-property': 'opacity',
                'transition-duration': duration + 'ms',
                'transition-delay': delay + 'ms'
            });
            setTimeout(function () {
                _this.setStylesOfElement(element, {
                    opacity: 1
                });
            }, 1);
            setTimeout(function () {
                !!callback ? callback() : '';
            }, duration + delay);
        };

        BrowserUtils.prototype.fadeOutElement = function (element, duration, delay, callback) {
            var _this = this;
            duration = duration || 300;
            delay = delay || 0;
            this.setStylesOfElement(element, {
                opacity: 0,
                'transition-property': 'opacity',
                'transition-duration': duration + 'ms',
                'transition-delay': delay + 'ms'
            });
            setTimeout(function () {
                _this.setStylesOfElement(element, {display: 'none'});
                !!callback ? callback() : '';
            }, duration + delay);
        };

        BrowserUtils.prototype.toggleClass = function (element, toggleClass, classSet) {
            var _this = this;
            if (!classSet) { // toggleClass should just be toggled
                this[this.hasClass(element, toggleClass) ? 'removeClass' : 'addClass'](element, toggleClass);
            }
            if (classSet) { // toggleClass should replace class from classSet
                var replacedClass = false;
                classSet.forEach(function (value, index, array) {
                    if (_this.hasClass(element, value)) {
                        _this.replaceClass(element, value, toggleClass);
                        replacedClass = true
                    }
                });
                if (!replacedClass) { // in case classSet is set and 'toggleClass()' is invoked for first time
                    this.addClass(element, toggleClass);
                }
            }
        };

        BrowserUtils.prototype.hasClass = function (element, className) {
            return !!(element.className.match(this.getClassSelectorRegexp(className)));
        };

        BrowserUtils.prototype.replaceClass = function (element, oldClassName, newClassName) {
            element.className = element.className.replace(this.getClassSelectorRegexp(oldClassName), ' ' + newClassName);
        };

        BrowserUtils.prototype.addClass = function (element, className) {
            if (!(this.hasClass(element, className))) {
                element.className += (' ' + className);
            }
        };

        BrowserUtils.prototype.removeClass = function (element, className) {
            if (this.hasClass(element, className)) {
                this.replaceClass(element, className, '');
            }
        };

        BrowserUtils.prototype.getClassSelectorRegexp = function (classSelector) {
            return new RegExp('(?:^|\\s)' + classSelector + '(?!\\S)', 'g');
        };

        BrowserUtils.prototype.setStylesOfElement = function (element, styles) {
            for (var style in styles) {
                if (styles.hasOwnProperty(style)) {
                    element.style[style] = styles[style];
                }
            }
        };

        BrowserUtils.prototype.setAttributesOfElement = function (element, attributes) {
            for (var attribute in attributes) {
                if (attributes.hasOwnProperty(attribute) && attributes[attribute] !== 'N/A') {
                    element.setAttribute(attribute, attributes[attribute]);
                }
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
            ticker: this,
            registerTask: registerTask,
            removeTask: removeTask
        }

    })();


    // HELPERS

    var Helpers = (function () {

        var uniqueId = ~~(Math.random() * 1000);

        function domReady(fn) {
            var id = Helpers.getUniqueId();
            Ticker.registerTask(id, function () {
                if (document.readyState === 'complete') {
                    Ticker.removeTask(id);
                    fn();
                }
            });
        }

        function sanitizeConfig(config) {
            if (!config.rootSelector) {
                throw new Error('Please add \'rootSelector\' as a property of ' + configSlug);
            }
            if (config.rootSelector.charAt(0) !== '.' && config.rootSelector.charAt(0) !== '#') {
                throw new Error(configSlug + '\'s rootSelector must be a class or id-selector');
            }
            if (Helpers.getObjectSize(config.videoPaths) < 1) {
                console.warn('No video paths defined in ' + configSlug + '. \'useAnimation\' will be set to \'false\'.');
                config.useAnimation = false;
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
            if (!obj) return -1;
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
            sanitizeConfig: sanitizeConfig,
            doesObjectExist: doesObjectExist,
            getObjectSize: getObjectSize,
            getUniqueId: getUniqueId,
            dispatchCustomEvent: dispatchCustomEvent,
            getAspectRatioAsPercent: getAspectRatioAsPercent
        }

    })();

    Helpers.domReady(function () {
        Helpers.sanitizeConfig(window[configSlug]);
        PosterInstance.getInstance().posterReady(function () {
            SlidePlayerInstance.getInstance().start();
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