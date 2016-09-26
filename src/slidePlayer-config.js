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
            webm: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm',
            vp9: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm',
            hls: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm'
        },
        medium: {
            ogg: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.ogv',
            h264: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4',
            webm: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm',
            vp9: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm',
            hls: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm'
        },
        large: {
            ogg: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.ogv',
            h264: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4',
            webm: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm',
            vp9: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm',
            hls: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.webm'
        }
    },
    scenes: [
        {
            id: 'intro',
            poster: 'https://a2ua.com/blurry/blurry-005.jpg',
            enter: {
                start: '00:00',
                end: '00:02'
            },
            exit: {
                start: '00:10',
                end: '00:12'
            },
            hotSpots: [
                {
                    id: 'test-1',
                    action: '#test',
                    width: '10%',
                    height: '10%',
                    positionX: '5%',
                    positionY: '5%',
                    customClass: 'custom-class',
                    container: {
                        width: '15%',
                        height: '15%',
                        positionX: '5%',
                        positionY: '5%'
                    }
                },
                {
                    id: 'test-2',
                    action: '.test',
                    width: '10%',
                    height: '10%',
                    positionX: '80%',
                    positionY: '20%',
                    label: 'This is a label',
                    container: {
                        width: '20%',
                        height: '20%',
                        positionX: '20%',
                        positionY: '20%'
                    }
                },
                {
                    id: 'test-3',
                    action: 'nextStep',
                    width: '10%',
                    height: '10%',
                    positionX: '50%',
                    positionY: '50%'
                }
            ]
        },
        {
            id: 'scene1',
            poster: 'https://a2ua.com/blurry/blurry-004.jpg'
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
