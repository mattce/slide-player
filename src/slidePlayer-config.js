window.spConfig = {
    debug: true,
    useAnimation: true,
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
            // poster: 'http://www.androidcentral.com/sites/androidcentral.com/files/styles/w550h500/public/wallpapers/blurry-lights-2to.jpg',
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
                    customClass: 'custom-class'
                },
                {
                    id: 'test-2',
                    action: '.test',
                    width: '10%',
                    height: '10%',
                    positionX: '80%',
                    positionY: '20%'
                },
                {
                    id: 'test-3',
                    action: 'zoom',
                    width: '10%',
                    height: '10%',
                    positionX: '50%',
                    positionY: '50%'
                }
            ]
        },
        {
            poster: 'https://a2ua.com/blurry/blurry-004.jpg'
        },
        {
            poster: 'https://a2ua.com/blurry/blurry-002.jpg'
        },
        {
            poster: 'https://a2ua.com/blurry/blurry-003.jpg'
        },
        {
            poster: 'https://a2ua.com/blurry/blurry-012.jpg'
        }
    ]
};
