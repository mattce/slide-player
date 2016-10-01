window.spConfig = {
    /**
     * debug (boolean)
     * sets application in debug state
     * - adds `debug` class to root element
     * - shows time line in player
     */
    debug: false,

    /**
     * useAnimation (boolean)
     * determines if application should use video or not
     * - skips video loading / animation when set to true
     * - if no videoPaths are set, useAnimation will be set to true
     */
    useAnimation: true,

    /**
     * rootSelector (string)
     * an id or class selector for referencing the root element of the application
     */
    rootSelector: '#slidePlayer',

    /**
     * aspectRatio (string)
     * determines the aspect ratio od the video
     * - defaults to '16:9' if not set
     */
    aspectRatio: '16:9',

    /**
     * breakPoints (object)
     * provide possibility to add breakpoint specific classes to the application
     * - consists of key / value pairs which state the name (string) and the minimum width (number) of the breakpoint
     * - defaults to {small: 0} if not set
     */
    breakPoints: {
        small: 0,
        medium: 728,
        large: 1024
    },

    /**
     * videoPaths (object)
     * determines the video source which sill be loaded when initially in a breakpoint state
     * - consists of objects (same names as breakpoints) which itself consist of kay value pairs targeting the videos in its different formats/codecs (ogg|h264|webm)
     */
    videoPaths: {
        small: {
            ogg: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.ogv',
            h264: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4',
            webm: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm'
        },
        medium: {
            ogg: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.ogv',
            h264: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4',
            webm: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm'
        },
        large: {
            ogg: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.ogv',
            h264: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4',
            webm: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm'
        }
    },

    /**
     * scenes (array)
     * keeps track of the different scenes
     * - a scene consists of:
     * - - id (string): unique label of a scene
     *
     * - - poster (stringUrl) : relative or absolute path to a scenes poster image
     *
     * - - hotSpots (array) : a collection of interactable hotSpots
     */
    scenes: [
        {
            id: 'origin',
            poster: 'https://a2ua.com/blurry/blurry-005.jpg',
            hotSpots: [
                /**
                 * hotSpot (object)
                 * a single interactable element in a scene. to help you style the hotSpots individually the hotSpot DOM element gets the following classes applied:
                 * - <default-hotSpot-class> e.g.: slide-player-hot-spot
                 * - <default-hotSpot-class> + <scene-id> | e.g.: slide-player-hot-spot-origin
                 * - <default-hotSpot-class> + <scene-id> + <index> | e.g.: slide-player-hot-spot-origin-0
                 *
                 * action (string) : it can be:
                 * - an id or class selector which targets an DOM element which will be cloned into a corresponding container. can only work when overlay property is set
                 * - a simple string which matches a scene's id where the application will transition to. can only work when timeRange property is set.
                 *
                 * width (string) : width of the hotSpot in percent
                 *
                 * height (string) : height of the hotSpot in percent
                 *
                 * positionX (string) : x position of the hotSpot in percent
                 *
                 * positionY (string) : y position of the hotSpot in percent
                 *
                 * label (string) : text which will be generated into the hotSpot
                 *
                 * timeRange (object) : keeps track of start and end in time line
                 * - start | end (string) : must be in the format 2-digit minutes + ':' + 2-digit seconds + ':' + 3-digit milliseconds
                 *
                 * overlay (object) : determines dimensions and position of overlay container
                 * - width (string) : width of the overlay in percent
                 * - height (string) : height of the overlay in percent
                 * - positionX (string) : x position of the overlay in percent
                 * - positionY (string) : y position of the overlay in percent
                 */
                {
                    action: 'scene1',
                    width: '40%',
                    height: '40%',
                    positionX: '5%',
                    positionY: '5%',
                    timeRange: {
                        start: '00:08:000',
                        end: '00:12:000'
                    }
                },
                {
                    action: '.test',
                    width: '35%',
                    height: '45%',
                    positionX: '80%',
                    positionY: '20%',
                    overlay: {
                        width: '20%',
                        height: '20%',
                        positionX: '20%',
                        positionY: '20%'
                    }
                },
                {
                    action: '#test',
                    width: '20%',
                    height: '30%',
                    positionX: '50%',
                    positionY: '50%',
                    overlay: {
                        width: '20%',
                        height: '20%',
                        positionX: '70%',
                        positionY: '10%'
                    }
                }
            ]
        },
        {
            id: 'scene1',
            poster: 'https://a2ua.com/blurry/blurry-004.jpg',
            enter: {
                start: '00:00:000',
                end: '00:02:000'
            },
            exit: {
                start: '00:02:100',
                end: '00:04:000'
            },
            hotSpots: [
                {
                    action: 'origin',
                    width: '40%',
                    height: '7%',
                    positionX: '5%',
                    positionY: '5%',
                    label: 'back',
                    timeRange: {
                        start: '00:12:000',
                        end: '00:16:000'
                    }
                }
            ]
        }
    ]
};
