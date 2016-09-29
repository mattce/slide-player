;(function (window, document) {

    var version = '0.0.7';
    // TODO : put into global '__' object
    var configSlug = 'spConfig';
    var breakPointClassPrefix = 'is-';
    var ns = 'sp_' + new Date().getTime() + '/';
    var emitter = document.body;
    var config;
    var currentScene;


    // APPLICATION

    var ApplicationInstance = (function () {
        var instance = null;

        function Application() {
            console.log('Application');

            config = window[configSlug];
            currentScene = config.scenes[0];

            var _this = this;

            this.config = window[configSlug];
            this.breakPointClasses = this.generateBreakPointClasses();

            this.root = document.querySelector(this.config.rootSelector);
            this.container = null;
            this.poster = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            this.setupPlayerDomStructure();

            PosterInstance.getInstance().init(this.poster);
            SceneInstance.getInstance(this.container);
            CatcherInstance.getInstance(this.container);

            Helpers.addEventListener('utils/resize', function (e) {
                _this.onResize(e.detail);
            }, false);

            Helpers.dispatchCustomEvent('application/ready');

            return this;
        }

        Application.prototype.constructor = Application;

        Application.prototype.onResize = function (data) {
            this.BrowserUtils.toggleClass(this.root, breakPointClassPrefix + data.breakPointData, this.breakPointClasses);
        };

        Application.prototype.setupPlayerDomStructure = function () {

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
            VideoInstance.getInstance(video);

        };

        Application.prototype.generateBreakPointClasses = function () {
            var classes = [];
            for (var breakpoint in this.config.breakPoints) {
                classes.push(breakPointClassPrefix + breakpoint);
            }
            return classes;
        };

        Application.prototype.getVideoSource = function () {
            var breakPointState = this.BrowserUtils.getBreakPointState();
            var supportedMediaType = this.BrowserUtils.getSupportedMediaType();
            return this.config.videoPaths[breakPointState][supportedMediaType];
        };

        return {
            getInstance: function () {
                if (!instance) {
                    instance = new Application();
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

            this.scenes = window[configSlug].scenes;
            this.elem = videoElement;
            this.isReadyToPlay = false;

            this.elem.addEventListener('canplaythrough', function () {
                console.log('canplaythrough Event here');
                _this.isReadyToPlay = true;
            });

            return this;
        }

        Video.prototype.constructor = Video;

        Video.prototype.startTimeRange = function (scene, direction) {
            var _this = this;
            var startTime = this.convertTimeStamp(scene[direction].start, true);
            var endTime = this.convertTimeStamp(scene[direction].end, false);

            if (startTime >= endTime) {
                throw new Error('"start" can\'t be bigger than "end" in ' + scene.id + '.' + scene.direction);
            }

            this.elem.currentTime = startTime;

            this.processLoading(function () {
                _this.elem.play();
                _this.stopTimeRange(endTime);
            });
        };

        Video.prototype.stopTimeRange = function (endTime) {
            var _this = this;
            var id = Helpers.getUniqueId();
            Ticker.registerTask(id, function () {
                if (_this.elem.currentTime >= endTime) {
                    Ticker.removeTask(id);
                    _this.elem.pause();
                }
            })
        };

        Video.prototype.processLoading = function (callback) {
            this.isReadyToPlay = false;
            var _this = this;
            var id = Helpers.getUniqueId();
            Ticker.registerTask(id, function () {
                if (_this.isReadyToPlay) {
                    Ticker.removeTask(id);
                    callback();
                }
            });
        };

        Video.prototype.convertTimeStamp = function (time, forceBuffer) { // 00:00:000
            var timeFragments = time.split(':');
            var minutes = timeFragments[0] * 60;
            var seconds = timeFragments[1];
            var milliseconds = timeFragments[2];
            if (forceBuffer) { // a simple way to force buffering => 'canplaythrough' event
                milliseconds = (((milliseconds.charAt(0) * 1) + 5) % 10) + milliseconds.substr(1);
            }
            return ((minutes + seconds) + '.' + milliseconds) * 1;
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

        function Scene(root) {
            console.log('Scene');
            var _this = this;

            this.root = root;
            this.hotSpots = [];
            this.activeHotSpots = 0;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            Helpers.addEventListener('poster/ready', function () {
                _this.createHotSpots();
            });

            return this;
        }

        Scene.prototype.constructor = Scene;

        Scene.prototype.createHotSpots = function () {
            var _this = this;
            var id = Helpers.getUniqueId();
            for (var i = 0, l = currentScene.hotSpots.length; i < l; i++) {
                _this.hotSpots[i] = HotSpotInstance.getNewInstance({
                    root: _this.root,
                    data: currentScene.hotSpots[i],
                    index: i,
                    onFadeIn: function () {
                        _this.activeHotSpots++;
                    },
                    onFadeOut: function () {
                        _this.activeHotSpots--;
                    }
                });
            }
            Ticker.registerTask(id, function () {
                if (currentScene.hotSpots.length === _this.activeHotSpots) {
                    Ticker.removeTask(id);
                    Helpers.dispatchCustomEvent('scene/ready');
                }
            })
        };

        Scene.prototype.removeHotSpots = function () {
            var _this = this;
            var id = Helpers.getUniqueId();
            for (var i = 0, l = this.hotSpots.length; i < l; i++) {
                this.hotSpots[i].remove();
                delete this.hotSpots[i];
            }
            Ticker.registerTask(id, function () {
                if (_this.activeHotSpots === 0) {
                    Ticker.removeTask(id);
                    Helpers.dispatchCustomEvent('scene/out');
                }
            })
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


    // HOT-SPOT

    var HotSpotInstance = (function () {

        function HotSpot(params) {
            this.root = params.root;
            this.data = params.data;
            this.index = params.index;
            this.onFadeIn = params.onFadeIn;
            this.onFadeOut = params.onFadeOut;
            this.element = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            this.init();

            return this;
        }

        HotSpot.prototype.init = function () {
            var _this = this;
            this.element = this.BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-hot-spot slide-player-hot-spot__' + currentScene.id + ' slide-player-hot-spot__' + currentScene.id + '-' + this.index,
                styles: {
                    opacity: 0,
                    width: this.data.width,
                    height: this.data.height,
                    left: this.data.positionX,
                    top: this.data.positionY
                }
            });

            this.element.addEventListener('click', function () {
                _this.determineAction();
            }, false);

            this.root.appendChild(this.element);

            this.BrowserUtils.fadeInElement({
                element: this.element,
                duration: 400,
                delay: this.index * 150,
                callback: function () {
                    console.log('HotSpot-' + _this.index + ' :: ready');
                    _this.onFadeIn();
                }
            });

            return this;
        };

        HotSpot.prototype.remove = function () {
            var _this = this;
            this.BrowserUtils.fadeOutElement({
                element: this.element,
                delay: (this.index * 150),
                callback: function () {
                    _this.onFadeOut();
                    _this.element.parentElement.removeChild(_this.element);
                }
            });
        };

        HotSpot.prototype.determineAction = function () {
            if (this.data.action.charAt(0) === '.' || this.data.action.charAt(0) === '#') {
                console.log('HotSpot :: determineAction -> showOverlay');
                this.showOverlay(this.root, this.data.action, this.data.overlay);
            } else {
                console.log('HotSpot :: determineAction -> playVideo');
                Helpers.dispatchCustomEvent('application/leave-scene');
                // hot-spots weg
                // poster weg
            }
        };

        HotSpot.prototype.showOverlay = function (root, action, data) {
            OverlayInstance.getNewOverlayInstance(root, action, data).show();
        };

        return {
            getNewInstance: function (params) {
                return new HotSpot(params);
            }
        }

    })();


    // OVERLAY

    var OverlayInstance = (function () {

        function Overlay(root, action, data) {
            console.log('Overlay');
            this.root = root;
            this.action = action;
            this.data = data;

            this.element = null;
            this.close = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();
            this.Catcher = CatcherInstance.getInstance();

            this.init();

            return this;
        }

        Overlay.prototype.init = function () {
            var _this = this;

            this.element = this.BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-overlay',
                styles: {
                    opacity: 0,
                    width: this.data.width,
                    height: this.data.height,
                    left: this.data.positionX,
                    top: this.data.positionY
                }
            });

            this.close = this.BrowserUtils.createElement({
                type: 'a',
                className: 'slide-player-overlay-close'
            });

            this.root.appendChild(this.element);
            this.element.appendChild(this.close);

            this.close.addEventListener('click', function () {
                _this.hide();
            }, false);

        };

        Overlay.prototype.show = function () {
            this.Catcher.show(this.hide);
            this.BrowserUtils.fadeInElement({
                element: this.element,
                duration: 400,
                delay: this.index * 150
            })
        };

        Overlay.prototype.hide = function () {
            console.log(this);
            this.BrowserUtils.fadeOutElement({
                element: this.element,
                delay: this.index * 150
            });
        };

        return {
            getNewOverlayInstance: function (root, action, data) {
                return new Overlay(root, action, data);
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

            this.init();

            return this;
        }

        Catcher.prototype.constructor = Catcher;

        Catcher.prototype.init = function () {
            this.root = this.BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-catcher'
            });
            this.parent.appendChild(this.root);
        };

        Catcher.prototype.show = function (callback) {
            this.root.callback = callback;
            this.root.addEventListener('click', this.onClick, false);
            this.BrowserUtils.addClass(this.root, 'is-active');
        };

        Catcher.prototype.hide = function () {
            this.root.removeEventListener('click', this.onClick, false);
            this.BrowserUtils.removeClass(this.root, 'is-active');
        };

        Catcher.prototype.onClick = function (evt) {
            evt.target.callback.call(this);
        };

        return {
            getInstance: function (parent) {
                if (!instance) {
                    instance = new Catcher(parent);
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

            var _this = this;

            this.root = null;
            this.currentPoster = null;
            this.posters = [];
            this.zIndex = 1;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            Helpers.addEventListener('application/ready', function () {
                _this.showPoster();
            });

            Helpers.addEventListener('application/leave-scene', function () {
                _this.hidePoster();
            });

            this.init();

            return this;
        }

        Poster.prototype.constructor = Poster;

        Poster.prototype.init = function (root) {
            this.root = root;

            for (var i = 0, l = this.posters.length; i < l; i++) {
                this.root.appendChild(this.posters[i].poster);
            }
        };

        Poster.prototype.posterReady = function (fn) {
            var _this = this;

            var scenes = window.spConfig.scenes;
            var count = scenes.length;

            var id = Helpers.getUniqueId();

            for (var i = 0, l = scenes.length; i < l; i++) {
                var sceneId = scenes[i].id;
                var img = this.BrowserUtils.createElement({
                    type: 'img',
                    className: 'slide-player-poster-img slide-player-poster-img-' + sceneId,
                    attributes: {
                        src: scenes[i].poster + '?' + ns,
                        'data-scene-id': sceneId
                    },
                    styles: {
                        opacity: 0
                    }
                });
                img.onload = function () {
                    _this.posters.push({
                        poster: this,
                        id: this.getAttribute('data-scene-id')
                    });
                    count = count - 1;
                };
            }

            Ticker.registerTask(id, function () {
                if (count === 0) {
                    Ticker.removeTask(id);
                    fn();
                }
            });

        };

        Poster.prototype.showPoster = function () {
            this.currentPoster = this.getPosterFromId(currentScene.id);
            this.BrowserUtils.setStylesOfElement(this.currentPoster, {zIndex: this.zIndex++});
            this.BrowserUtils.fadeInElement({
                element: this.currentPoster,
                callback: function () {
                    Helpers.dispatchCustomEvent('poster/ready');
                }
            });
        };

        Poster.prototype.hidePoster = function () {
            this.BrowserUtils.fadeOutElement({element: this.currentPoster});
        };

        Poster.prototype.getPosterFromId = function (id) {
            var poster = null;
            for (var i = 0, l = this.posters.length; i < l; i++) {
                if (this.posters[i].id === id) {
                    poster = this.posters[i].poster;
                    break;
                }
            }
            return poster;
        };

        return {
            getInstance: function (root) {
                if (!instance) {
                    instance = new Poster(root);
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

            Helpers.addEventListener('application/ready', function () {
                Helpers.dispatchCustomEvent('utils/resize', {breakPointData: _this.getBreakPointState()});
            });

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
                    webm: 'video/webm; codecs="vp8, vorbis"'
                };
            if (!!elem.canPlayType) {
                for (var type in types) {
                    if (!!(elem.canPlayType(types[type]).replace(/^no$/, ''))) {
                        return type;
                    }
                }
                throw new Error('Video Source needs to inherit one of the following codecs:\n["ogg", "h264", "webm"]');
            } else {
                throw new Error('Video Element doesn\'t work in your browser.')
            }
        };

        BrowserUtils.prototype.fadeInElement = function (params) {
            var _this = this;
            var duration = params.duration || 400;
            var delay = params.delay || 0;
            var callback = params.callback || function () {
                    // empty function
                };
            this.setStylesOfElement(params.element, {
                opacity: 0,
                display: 'block',
                'transition-property': 'opacity',
                'transition-duration': duration + 'ms',
                'transition-delay': delay + 'ms'
            });
            setTimeout(function () {
                _this.setStylesOfElement(params.element, {
                    opacity: 1
                });
            }, 10);
            setTimeout(function () {
                callback();
            }, duration + delay);
        };

        BrowserUtils.prototype.fadeOutElement = function (params) {
            var _this = this;
            var duration = params.duration || 400;
            var delay = params.delay || 0;
            var callback = params.callback || function () {
                    // empty function
                };
            this.setStylesOfElement(params.element, {
                opacity: 0,
                'transition-property': 'opacity',
                'transition-duration': duration + 'ms',
                'transition-delay': delay + 'ms'
            });
            setTimeout(function () {
                _this.setStylesOfElement(params.element, {display: 'none'});
                callback();
            }, duration + delay);
        };

        BrowserUtils.prototype.toggleClass = function (element, toggleClass, classSet) {
            var _this = this;
            if (!classSet) { // toggleClass should just be toggled
                this[this.hasClass(element, toggleClass) ? 'removeClass' : 'addClass'](element, toggleClass);
            }
            if (classSet) { // toggleClass should replace class from classSet
                var replacedClass = false;
                for (var i = 0, l = classSet.length; i < l; i++) {
                    if (_this.hasClass(element, classSet[i])) {
                        _this.replaceClass(element, classSet[i], toggleClass);
                        replacedClass = true;
                        break;
                    }
                }
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
            console.log('tick');
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
                throw new Error('Please add \'rootSelector\' as a property of window.' + configSlug);
            }
            if (config.rootSelector.charAt(0) !== '.' && config.rootSelector.charAt(0) !== '#') {
                throw new Error('window.' + configSlug + '\'s rootSelector must be a class or id-selector');
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
            return 'uid_' + ++uniqueId;
        }

        function getSceneById(id) {
            var scene = {};
            for (var i = 0, l = config.scenes.length; i < l; i++) {
                if (config.scenes[i] === id) {
                    scene = config.scenes[i];
                    break;
                }
            }
            return scene;
        }

        function addEventListener(eventName, callback) {
            // console.log('addEventListener :: eventName = ', eventName);
            emitter.addEventListener(ns + eventName, function (event) {
                callback(event, event.detail);
            }, false);
        }

        function dispatchCustomEvent(eventName, data) {
            console.log('dispatchCustomEvent :: eventName = ', eventName);
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
            getSceneById: getSceneById,
            addEventListener: addEventListener,
            dispatchCustomEvent: dispatchCustomEvent,
            getAspectRatioAsPercent: getAspectRatioAsPercent
        }

    })();

    Helpers.domReady(function () {
        Helpers.sanitizeConfig(window[configSlug]);
        PosterInstance.getInstance().posterReady(function () {
            ApplicationInstance.getInstance();
        });
    });

})(window, document);
