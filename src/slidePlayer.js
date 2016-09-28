;(function (window, document) {

    var version = '0.0.6';
    var configSlug = 'spConfig';
    var breakPointClassPrefix = 'is-';
    var ns = 'sp_' + new Date().getTime() + '/';
    var emitter = document.body;
    var config;
    var currentScene;


    // SLIDE PLAYER

    var ApplicationInstance = (function () {
        var instance = null;

        function Application() {
            console.log('Application');

            config = window[configSlug];
            currentScene = config.scenes[0];

            var _this = this;

            this.config = window[configSlug];
            this.breakPointClasses = this.generateBreakPointClasses();

            this.root = this.getContainer();
            this.container = null;
            this.catcher = null;
            this.poster = null;
            this.setupPlayerDomStructure();

            this.BrowserUtils = BrowserUtilsInstance.getInstance();
            this.Poster = PosterInstance.getInstance().setupDomStructure(this.poster);
            this.Scene = SceneInstance.getInstance(this.container);
            this.Catcher = CatcherInstance.getInstance(this.catcher);
            this.Video = null;

            emitter.addEventListener(ns + 'utils/resize', function (e) {
                _this.onResize(e.detail);
            }, false);

            Helpers.dispatchCustomEvent('application/ready');

            return this;
        }

        Application.prototype.constructor = Application;

        Application.prototype.onResize = function (data) {
            this.BrowserUtils.toggleClass(this.root, breakPointClassPrefix + data.breakPointData, this.breakPointClasses);
        };

        Application.prototype.getContainer = function () {
            var rootSelector = this.config.rootSelector;
            if (rootSelector.charAt(0) === '#') {
                return document.querySelector(rootSelector);
            } else if (rootSelector.charAt(0) === '.') {
                return document.querySelectorAll(rootSelector)[0];
            }
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

            this.catcher = BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-catcher'
            });
            this.container.appendChild(this.catcher);

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
            this.Video = VideoInstance.getInstance(video);

            this.Video.startTimeRange(this.config.scenes[0], 'enter');

        };

        Application.prototype.generateBreakPointClasses = function () {
            var classes = [];
            for (var breakpoint in this.config.breakPoints) {
                classes.push(breakPointClassPrefix + breakpoint);
            }
            return classes;
        };

        Application.prototype.getVideoSource = function () {
            var BrowserUtils = BrowserUtilsInstance.getInstance();
            var breakPointState = BrowserUtilsInstance.getInstance().getBreakPointState();
            var supportedMediaType = BrowserUtilsInstance.getInstance().getSupportedMediaType();
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
                    _this.elem.pause();
                    Ticker.removeTask(id);
                }
            })
        };

        Video.prototype.processLoading = function (callback) {
            this.isReadyToPlay = false;
            var _this = this;
            var id = Helpers.getUniqueId();
            Ticker.registerTask(id, function () {
                if (_this.isReadyToPlay) {
                    callback();
                    Ticker.removeTask(id);
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

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            Helpers.addEventListener('application/ready', function () {
                _this.createHotSpots();
            });

            emitter.addEventListener(ns + 'cover/in', function (e) {
                // _this.onApplicationReady(e.detail);
            }, false);

            return this;
        }

        Scene.prototype.constructor = Scene;

        Scene.prototype.createHotSpots = function () {
            var _this = this;
            currentScene.hotSpots.forEach(function (hotSpot, index) {
                var asd = HotSpotInstance.getNewInstance(_this.root, hotSpot, index).create();
                _this.hotSpots.push(asd);
            });
            // show current scenes's hot-spots
        };

        Scene.prototype.removeHotSpots = function () {
            // hide current hot-spots (scene independent)
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

        function HotSpot(root, data, index, onFadeIn, onFadeOut) {
            this.root = root;
            this.data = data;
            this.index = index;
            this.onFadeIn = onFadeIn;
            this.onFadeOut = onFadeOut;
            this.element = null;
            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            return this;
        }

        HotSpot.prototype.create = function () {
            this.element = this.BrowserUtils.createElement({
                type: 'div',
                className: 'slide-player-hot-spot slide-player-hot-spot__' + currentScene.id + '-' + this.index,
                styles: {
                    opacity: 0,
                    width: this.data.width,
                    height: this.data.height,
                    left: this.data.positionX,
                    top: this.data.positionY,
                    'transition-delay': 300 * this.index + 'ms'
                }
            });
            this.root.appendChild(this.element);
            this.BrowserUtils.fadeInElement(this.element, 500, (this.index * 300), function(){
                this.onFadeIn();
            });
            return this;
        };

        HotSpot.prototype.remove = function () {//element, duration, delay, callback
            this.BrowserUtils.fadeOutElement(this.element, 500, (this.index * 300), function(){
                this.onFadeOut();
                this.parentElement.removeChild(this);
            });
        };

        return {
            getNewInstance: function (root, data, index) {
                return new HotSpot(root, data, index);
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
            config.scenes.forEach(function(value, index, array) {
                scene = value.id === id ? value : '';
            });
            return scene;
        }

        function addEventListener(eventName, callback) {
            console.log('addEventListener :: eventName = ', eventName);
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
            ApplicationInstance.getInstance().start();
        });
    });

})(window, document);
