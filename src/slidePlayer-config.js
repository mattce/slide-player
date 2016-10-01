window.spConfig = {
    debug: true,
    useAnimation: true,
    rootSelector: '#slidePlayer',
    aspectRatio: '16:9',
    breakPoints: {
        small: 0,
        medium: 728,
        large: 1024
    },
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
    scenes: [
        {
            id: 'origin',
            poster: 'https://a2ua.com/blurry/blurry-005.jpg',
            hotSpots: [
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
                        start: '00:19:000',
                        end: '00:22:000'
                    }
                }
            ]
        },
        {
            id: 'scene2',
            poster: 'https://a2ua.com/blurry/blurry-002.jpg'
        },
        {
            id: 'scene3',
            poster: 'https://a2ua.com/blurry/blurry-003.jpg'
        },
        {
            id: 'scene4',
            poster: 'https://a2ua.com/blurry/blurry-012.jpg'
        }
    ]
};
