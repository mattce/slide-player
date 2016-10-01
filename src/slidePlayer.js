;(function (window, document) {

    var version = '1.0.0';

    var _g = {
        configSlug: 'spConfig',
        breakPointClassPrefix: 'is-',
        ns: 'sp_' + new Date().getTime() + '/',
        emitter: document.body,
        lastScene: null,
        currentScene: null,
        currentTimeRange: null
    };

    var _c = {
        root: 'slide-player-root',
        container: 'slide-player-container',
        poster: 'slide-player-poster',
        posterImg: 'slide-player-poster-img',
        video: 'slide-player-video',
        hotSpot: 'slide-player-hot-spot',
        overlay: 'slide-player-overlay',
        overlayClose: 'slide-player-overlay-close',
        catcher: 'slide-player-catcher'
    };


    // APPLICATION

    var ApplicationInstance = (function () {
        var instance = null;

        function Application() {
            Logger.log('Application');

            _g.currentScene = window[_g.configSlug].scenes[0];
            _g.useAnimation = window[_g.configSlug].useAnimation;

            var _this = this;

            this.config = window[_g.configSlug];
            this.breakPointClasses = this.generateBreakPointClasses();

            this.root = document.querySelector(this.config.rootSelector);
            this.container = null;
            this.poster = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            this.setupPlayerDomStructure();

            PosterInstance.getInstance().init(this.poster);
            SceneInstance.getInstance(this.container);
            CatcherInstance.getInstance(this.container);
            OverlayInstance.getInstance(this.container);

            Helpers.addEventListener('utils/resize', function (e) {
                _this.onResize(e.detail);
            }, false);

            Helpers.dispatchCustomEvent('application/ready');
            Helpers.dispatchCustomEvent('poster/show');

            this.BrowserUtils.addClass(this.root, (window[_g.configSlug].debug ? 'debug' : ''));

            return this;
        }

        Application.prototype.constructor = Application;

        Application.prototype.onResize = function (data) {
            this.BrowserUtils.toggleClass(this.root, _g.breakPointClassPrefix + data.breakPointData, this.breakPointClasses);
        };

        Application.prototype.setupPlayerDomStructure = function () {

            this.root.className += _c.root;

            this.container = this.BrowserUtils.createElement({
                className: _c.container,
                styles: {
                    paddingTop: Helpers.getAspectRatioAsPercent(this.config.aspectRatio)
                }
            });
            this.root.appendChild(this.container);

            this.poster = this.BrowserUtils.createElement({ className: _c.poster });
            this.container.appendChild(this.poster);

            var video = this.BrowserUtils.createElement({
                type: 'video',
                className: _c.video,
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
                classes.push(_g.breakPointClassPrefix + breakpoint);
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
            Logger.log('Video');

            var _this = this;

            this.scenes = window[_g.configSlug].scenes;
            this.elem = videoElement;
            this.canPlayThrough = false;

            this.elem.addEventListener('canplaythrough', function () {
                Logger.log('canplaythrough event thrown');
                _this.canPlayThrough = true;
            });

            Helpers.addEventListener('video/play', function () {
                _this.playTimeRange();
            });

            return this;
        }

        Video.prototype.constructor = Video;

        Video.prototype.playTimeRange = function () {
            var _this = this;
            var startTime = this.convertTimeStamp(_g.currentTimeRange.start, true);
            var endTime = this.convertTimeStamp(_g.currentTimeRange.end, false);

            if (startTime >= endTime) {
                throw new Error('"start" (' + startTime + ') can\'t be bigger than "end" (' + endTime + ')');
            }

            this.elem.currentTime = startTime;

            this.processLoading(function () {
                _this.elem.play();
                _this.stopTimeRange(endTime);
            });
        };

        Video.prototype.stopTimeRange = function (endTime) {
            var _this = this;
            var id = Helpers.getUniqueId(true);
            Ticker.registerTask(id, function () {
                if (_this.elem.currentTime >= endTime) {
                    Ticker.removeTask(id);
                    _this.elem.pause();
                    Helpers.dispatchCustomEvent('poster/show');
                }
            })
        };

        Video.prototype.processLoading = function (callback) {
            this.canPlayThrough = false;
            var _this = this;
            var id = Helpers.getUniqueId(true);
            Ticker.registerTask(id, function () {
                if (_this.canPlayThrough) {
                    Ticker.removeTask(id);
                    callback();
                }
            });
        };

        Video.prototype.convertTimeStamp = function (time, forceBuffer) {
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
            Logger.log('Scene');
            var _this = this;

            this.root = root;
            this.hotSpots = [];
            this.activeHotSpots = 0;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            Helpers.addEventListener('hotspots/show', function () {
                _this.showHotSpots();
            });

            Helpers.addEventListener('hotspots/hide', function () {
                _this.hideHotSpots();
            });

            return this;
        }

        Scene.prototype.constructor = Scene;

        Scene.prototype.showHotSpots = function () {
            var _this = this;
            var id = Helpers.getUniqueId(true);
            for (var i = 0, l = _g.currentScene.hotSpots.length; i < l; i++) {
                _this.hotSpots[i] = HotSpotInstance.getNewInstance({
                    root: _this.root,
                    data: _g.currentScene.hotSpots[i],
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
                if (_g.currentScene.hotSpots.length === _this.activeHotSpots) {
                    Ticker.removeTask(id);
                    // Helpers.dispatchCustomEvent('scene/on');
                }
            })
        };

        Scene.prototype.hideHotSpots = function () {
            var _this = this;
            var id = Helpers.getUniqueId(true);
            for (var i = 0, l = this.hotSpots.length; i < l; i++) {
                this.hotSpots[0].remove();
                this.hotSpots.splice(0, 1);
            }
            Ticker.registerTask(id, function () {
                if (_this.activeHotSpots === 0) {
                    Ticker.removeTask(id);
                    if (_g.useAnimation) {
                        Helpers.dispatchCustomEvent('poster/hide');
                    } else {
                        Helpers.dispatchCustomEvent('poster/show');
                    }
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
                className: _c.hotSpot + ' ' + (_c.hotSpot + '-' + _g.currentScene.id) + ' ' + (_c.hotSpot + '-' + _g.currentScene.id + '-' + this.index),
                styles: {
                    zIndex: Helpers.getUniqueId(),
                    opacity: 0,
                    width: this.data.width,
                    height: this.data.height,
                    left: this.data.positionX,
                    top: this.data.positionY
                }
            });
            if (this.data.label) {
                this.element.textContent = this.data.label;
            }

            this.element.addEventListener('click', function () {
                _this.determineAction();
            }, false);

            this.root.appendChild(this.element);

            this.BrowserUtils.fadeInElement({
                element: this.element,
                duration: 400,
                delay: this.index * 150,
                callback: function () {
                    Logger.log('HotSpot-' + _this.index + ' :: ready');
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
                    Logger.log('HotSpot-' + _this.index + ' :: removed');
                }
            });
        };

        HotSpot.prototype.determineAction = function () {
            if (this.data.action.charAt(0) === '.' || this.data.action.charAt(0) === '#') { // show overlay with content
                // TODO : move these errors into sanitizer
                if (Helpers.getObjectSize(this.data.overlay) < 1) {
                    throw new Error('Please provide \'overlay\' configurations for ' + this.data.id);
                }
                Logger.log('HotSpot :: determineAction -> showOverlay');
                this.showOverlay(this.data.action, this.data.overlay);
            } else { // play next scene
                if (Helpers.getObjectSize(this.data.timeRange) < 1) {
                    throw new Error('Please provide \'timeRange\' configurations for ' + this.data.id);
                }
                Logger.log('HotSpot :: determineAction -> playVideo');
                _g.lastScene = _g.currentScene;
                _g.currentScene = Helpers.getSceneById(this.data.action);
                _g.currentTimeRange = this.data.timeRange;
                Helpers.dispatchCustomEvent('hotspots/hide');
            }
        };

        HotSpot.prototype.showOverlay = function (contentSelector, overlayData) {
            OverlayInstance.getInstance().show(contentSelector, overlayData);
        };

        return {
            getNewInstance: function (params) {
                return new HotSpot(params);
            }
        }

    })();


    // OVERLAY

    var OverlayInstance = (function () {
        var instance = null;

        function Overlay(root) {
            Logger.log('Overlay');
            var _this = this;

            this.root = root;
            this.action = null;
            this.data = null;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            this.element = this.BrowserUtils.createElement({ className: _c.overlay });
            this.close = this.BrowserUtils.createElement({ className: _c.overlayClose });

            this.root.appendChild(this.element);
            this.element.appendChild(this.close);

            this.close.addEventListener('click', function () {
                _this.hide();
            }, false);

            Helpers.addEventListener('overlay/hide', function () {
                _this.hide();
            });

            return this;
        }

        Overlay.prototype.prepare = function (params) {
            var content = document.querySelector(params.selector);
            if (!content) {
                throw new Error('Content of \'' + params.selector + '\' could not be found.');
            }
            var clone = this.BrowserUtils.cloneElement(content);
            if (this.element.firstChild !== this.element.lastChild) { // check if close button is only node in container
                this.element.removeChild(this.element.lastChild);
            }
            this.BrowserUtils.appendElementTo(clone, this.element);
            this.BrowserUtils.setStylesOfElement(this.element, {
                opacity: 0,
                width: params.data.width,
                height: params.data.height,
                left: params.data.positionX,
                top: params.data.positionY
            });
        };

        Overlay.prototype.show = function (contentSelector, data) {
            this.prepare({ selector: contentSelector, data: data });
            this.BrowserUtils.fadeInElement({ element: this.element });
            Helpers.dispatchCustomEvent('catcher/show');
        };

        Overlay.prototype.hide = function () {
            this.BrowserUtils.fadeOutElement({ element: this.element });
            Helpers.dispatchCustomEvent('catcher/hide');
        };

        return {
            getInstance: function (params) {
                if (!instance) {
                    instance = new Overlay(params);
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

            this.init();

            return this;
        }

        Catcher.prototype.constructor = Catcher;

        Catcher.prototype.init = function () {
            var _this = this;

            this.root = this.BrowserUtils.createElement({ className: _c.catcher });
            this.parent.appendChild(this.root);

            Helpers.addEventListener('catcher/show', function () {
                _this.show();
            });

            Helpers.addEventListener('catcher/hide', function () {
                _this.hide();
            });

            this.root.addEventListener('click', function () {
                Helpers.dispatchCustomEvent('overlay/hide');
            }, false);

        };

        Catcher.prototype.show = function () {
            this.BrowserUtils.setStylesOfElement(this.root, { display: 'block' });
        };

        Catcher.prototype.hide = function () {
            this.BrowserUtils.setStylesOfElement(this.root, { display: 'none' });
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
            Logger.log('Poster');

            var _this = this;

            this.root = null;
            this.currentPoster = null;
            this.posters = [];
            this.zIndex = 1;

            this.BrowserUtils = BrowserUtilsInstance.getInstance();

            Helpers.addEventListener('poster/show', function () {
                _this.showPoster();
            });

            Helpers.addEventListener('poster/hide', function () {
                _this.hidePoster(true);
            });

            Helpers.addEventListener('poster/hide-last', function () {
                _this.hidePoster(false);
            });

            return this;
        }

        Poster.prototype.constructor = Poster;

        Poster.prototype.init = function (root) {
            this.root = root;
            this.BrowserUtils.setStylesOfElement(this.root, { zIndex: Helpers.getUniqueId() });

            for (var i = 0, l = this.posters.length; i < l; i++) {
                this.root.appendChild(this.posters[i].poster);
            }
        };

        Poster.prototype.posterReady = function (fn) {
            var _this = this;

            var scenes = window.spConfig.scenes;
            var count = scenes.length;

            var id = Helpers.getUniqueId(true);

            for (var i = 0, l = scenes.length; i < l; i++) {
                var sceneId = scenes[i].id;
                var img = this.BrowserUtils.createElement({
                    type: 'img',
                    className: _c.posterImg + ' ' + (_c.posterImg + sceneId),
                    attributes: {
                        src: scenes[i].poster + '?' + _g.ns,
                        'data-scene-id': sceneId
                    },
                    styles: {
                        opacity: 0
                    }
                });
                img.onload = function () {
                    Logger.log('Poster ' + this.getAttribute('data-scene-id') + ' ready');
                    _this.posters.push({
                        poster: this,
                        id: this.getAttribute('data-scene-id')
                    });
                    count = count - 1;
                };
                // TODO : on onerror, application should silently 'reload' with error warning
            }

            Ticker.registerTask(id, function () {
                if (count === 0) {
                    Ticker.removeTask(id);
                    fn();
                }
            });

        };

        Poster.prototype.showPoster = function () {
            this.currentPoster = this.getPosterFromId(_g.currentScene.id);
            this.BrowserUtils.setStylesOfElement(this.currentPoster, { zIndex: this.zIndex++ });
            this.BrowserUtils.fadeInElement({
                element: this.currentPoster,
                callback: function () {
                    Helpers.dispatchCustomEvent('hotspots/show');
                    if (!_g.useAnimation) {
                        Helpers.dispatchCustomEvent('poster/hide-last');
                    }
                }
            });
        };

        Poster.prototype.hidePoster = function (hideCurrentPoster) {
            if (!(_g.lastScene)) {
                return false;
            }
            var element = (hideCurrentPoster && _g.lastScene !== null) ? this.currentPoster : this.getPosterFromId(_g.lastScene.id);
            this.BrowserUtils.fadeOutElement({
                element: element,
                callback: function () {
                    if (hideCurrentPoster) {
                        Helpers.dispatchCustomEvent('video/play');
                    }
                }
            });
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
            Logger.log('BrowserUtils');

            var _this = this;

            this.config = window[_g.configSlug];
            this.lastBreakPoint = null;
            this.currentBreakPoint = 'N/A';

            this.watchWindowSize();
            this.setBreakPointState();

            Helpers.addEventListener('application/ready', function () {
                Helpers.dispatchCustomEvent('utils/resize', { breakPointData: _this.getBreakPointState() });
            });

            return this;
        }

        BrowserUtils.prototype.constructor = BrowserUtils;

        BrowserUtils.prototype.watchWindowSize = function () {
            var _this = this;
            window.addEventListener('resize', Helpers.debounce(function () {
                _this.setBreakPointState();
                if (_this.lastBreakPoint !== _this.currentBreakPoint) {
                    Helpers.dispatchCustomEvent('utils/resize', { breakPointData: _this.getBreakPointState() });
                }
            }, 300), false);
        };

        BrowserUtils.prototype.createElement = function (params) {
            if (!params.type) {
                Logger.warn('required type for \'BrowserUtils.createElement\' is ' + params.type + '. Will use \'div\' instead');
                params.type = 'div'
            }

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
                Logger.warn('No breakPoints defined. Will use \'{small: 0}\' instead.');
                this.config.breakPoints = { small: 0 };
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
            var duration = params.duration || 300;
            var delay = params.delay || 0;
            var callback = params.callback || function () {
                    // empty function
                };
            Logger.log('fadeInElement :: delay = ', delay);
            this.setStylesOfElement(params.element, {
                opacity: 0,
                display: 'block',
                'transition-property': 'opacity',
                'transition-duration': duration + 'ms',
                'transition-delay': delay + 'ms'
            });
            setTimeout(function () {
                _this.setStylesOfElement(params.element, { opacity: 1 });
            }, 10);
            setTimeout(function () {
                callback();
            }, duration + delay);
        };

        BrowserUtils.prototype.fadeOutElement = function (params) {
            var _this = this;
            var duration = params.duration || 300;
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
                _this.setStylesOfElement(params.element, { display: 'none' });
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
            return this;
        };

        BrowserUtils.prototype.hasClass = function (element, className) {
            return !!(element.className.match(this.getClassSelectorRegexp(className)));
        };

        BrowserUtils.prototype.replaceClass = function (element, oldClassName, newClassName) {
            element.className = element.className.replace(this.getClassSelectorRegexp(oldClassName), ' ' + newClassName);
            return this;
        };

        BrowserUtils.prototype.addClass = function (element, className) {
            if (!(this.hasClass(element, className))) {
                element.className += (' ' + className);
            }
            return this;
        };

        BrowserUtils.prototype.removeClass = function (element, className) {
            if (this.hasClass(element, className)) {
                this.replaceClass(element, className, '');
            }
            return this;
        };

        BrowserUtils.prototype.getClassSelectorRegexp = function (classSelector) {
            return new RegExp('(?:^|\\s)' + classSelector + '(?!\\S)', 'g');
        };

        BrowserUtils.prototype.cloneElement = function (element) {
            return element.cloneNode(true);
        };

        BrowserUtils.prototype.appendElementTo = function (element, container) {
            container.appendChild(element);
            return this;
        };

        BrowserUtils.prototype.setStylesOfElement = function (element, styles) {
            for (var style in styles) {
                if (styles.hasOwnProperty(style)) {
                    element.style[style] = styles[style];
                }
            }
            return this;
        };

        BrowserUtils.prototype.setAttributesOfElement = function (element, attributes) {
            for (var attribute in attributes) {
                if (attributes.hasOwnProperty(attribute) && attributes[attribute] !== 'N/A') {
                    element.setAttribute(attribute, attributes[attribute]);
                }
            }
            return this;
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
            Logger.log('tick');
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

        var uniqueId = 1;

        function domReady(fn) {
            var id = Helpers.getUniqueId(true);
            Ticker.registerTask(id, function () {
                if (document.readyState === 'complete') {
                    Ticker.removeTask(id);
                    fn();
                }
            });
        }

        function sanitizeConfig(config) {
            if (!config.rootSelector) {
                throw new Error('Please add \'rootSelector\' as a property of window.' + _g.configSlug);
            }
            if (config.rootSelector.charAt(0) !== '.' && config.rootSelector.charAt(0) !== '#') {
                throw new Error('window.' + _g.configSlug + '\'s rootSelector must be a class or id-selector');
            }
            if (Helpers.getObjectSize(config.videoPaths) < 1) {
                Logger.warn('No video paths defined in ' + _g.configSlug + '. \'useAnimation\' will be set to \'false\'.');
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

        function getUniqueId(withPrefix) {
            return withPrefix ? 'uid_' + ++uniqueId : ++uniqueId;
        }

        function getSceneById(id) {
            var scene = {};
            for (var i = 0, l = window[_g.configSlug].scenes.length; i < l; i++) {
                if (window[_g.configSlug].scenes[i].id === id) {
                    scene = window[_g.configSlug].scenes[i];
                    break;
                }
            }
            return scene;
        }

        function addEventListener(eventName, callback) {
            _g.emitter.addEventListener(_g.ns + eventName, function (event) {
                callback(event, event.detail);
            }, false);
        }

        function dispatchCustomEvent(eventName, data) {
            Logger.log('dispatchCustomEvent :: eventName = ', eventName);
            _g.emitter.dispatchEvent(new CustomEvent(_g.ns + eventName, { detail: data }));
        }

        function getAspectRatioAsPercent(ratio) {
            if (ratio && !!~(ratio.indexOf(':'))) {
                return (ratio.split(':')[1] / ratio.split(':')[0]) * 100 + '%';
            }
            Logger.warn('No correct aspectRatio is provided. Will use \'16:9\' instead.');
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


    // LOGGER

    var Logger = (function () {

        function log() {
            if (window[_g.configSlug] && window[_g.configSlug].debug) {
                console.log.apply(null, Array.prototype.slice.call(arguments));
            }
        }

        function warn() {
            if (window[_g.configSlug] && window[_g.configSlug].debug) {
                console.warn.apply(null, Array.prototype.slice.call(arguments));
            }
        }

        function error() {
            if (window[_g.configSlug] && window[_g.configSlug].debug) {
                console.error.apply(null, Array.prototype.slice.call(arguments));
            }
        }

        return {
            log: log,
            warn: warn,
            error: error
        }

    })();

    Helpers.domReady(function () {
        Helpers.sanitizeConfig(window[_g.configSlug]);
        PosterInstance.getInstance().posterReady(function () {
            ApplicationInstance.getInstance();
        });
    });

})(window, document);
