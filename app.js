((d) => {
    /* debugging */
    const DEBUG = false;

    /* difficulty */
    const speed = 250; // pixels per second
    const minObstacleDistance = 200; // pixels
    const maxObstacleDistance = 500; // pixels

    /* physics */
    const gravity = 800; // pixels per second squared
    const initialVelocity = 800; // pixels per second

    /* music */
    const playMusic = new URLSearchParams(window.location.search).get("annoy") === "true"; // play music - annoying!
    const tune = [
        "C4", "_", "_", "G3", "_", "_", "E3", "_", "_",
        "A3", "_", "B3", "_", "Bb3", "A3", "_",
        "G3", "E4", "G4", "A4", "_",
        "F4", "G4", "_", "E4", "_", "C4", "D4", "B3", "_", "_",
    ]; // notes from C0 - B8, C4 is middle C, C#4 - the semi-tone above middle C
    const bpm = 240; // notes per minute

    /* layout */
    const height = 400; // pixels
    const width = 800; // pixels

    const playerSize = 30; // pixels
    const playerXOffset = 50; // pixels
    const playerYOffset = 330; // pixels

    const landscapeWidth = 400; // pixels
    const cloudsWidth = 250; // pixels
    const obstacleHeight = 100; // pixels
    const obstacleWidth = 100; // pixels
    const obstacleYOffset = 280; // pixels
    const obstacleXOffset = 400; // pixels

    const landscapeSpeed = 50; // pixels per second
    const cloudsSpeed = 30; // pixels per second

    /* svg */
    // which svg elements to include as bounding boxes
    // don't want to include title, g, etc.
    const shapes = ["rect", "circle", "ellipse", "line", "polyline", "polygon", "path"];


    /* useful functions */
    // collision detection of two boxes
    const collision = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    // generate a range of numbers
    const range = (start, stop) => Array(stop - start + 1).fill().map((_, i) => start + i);

    // generate a random number between two numbers (inclusive)
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // get the last item in an array
    const last = arr => arr[arr.length - 1];

    // generate a bounded random next position for an obstacle
    const nextPos = prev => prev + rand(minObstacleDistance + obstacleWidth, maxObstacleDistance + obstacleWidth);

    // make sure player doesn't sink
    const ground = n => n < playerYOffset ? n : playerYOffset;

    // clone an HTML element
    const clone = (el, positions) => {
        el.remove();
        el.removeAttribute("id");
        return positions.map(() => el.cloneNode(true));
    };

    // redux-esque store
    const createStore = (reducer, initial) => {
        let subscribers = [];
        let state = initial;

        const getState = () => state;
        const subscribe = fn => {
            subscribers = [...subscribers, fn];
        };

        const dispatch = action => {
            state = reducer(state, action);
            subscribers.forEach(fn => fn(state));
        };

        return { getState, subscribe, dispatch };
    };


    /* select elements */
    const fragment = d.createDocumentFragment(); // doing to be appending a lot of stuff

    // setup the scene
    const sceneEl = d.getElementById("scene");
    sceneEl.style.height = `${height}px`;
    sceneEl.style.width = `${width}px`;

    if (DEBUG) {
        sceneEl.style.overflow = "visible";
    }

    // create landscape tiles
    const landscapePositions = range(0, Math.ceil(width / landscapeWidth) + 1).map(i => i * landscapeWidth);
    const landscapes = clone(d.getElementById("landscape"), landscapePositions);

    landscapes.forEach(el => {
        fragment.append(el);
        el.style.width = `${landscapeWidth}px`;
    });

    // create cloud tiles
    const cloudsPositions = range(0, Math.ceil(width / cloudsWidth) + 1).map(i => i * cloudsWidth);
    const clouds = clone(d.getElementById("clouds"), cloudsPositions);

    clouds.forEach(el => {
        fragment.append(el);
        el.style.width = `${cloudsWidth}px`;
    });

    // find first svg element in obstacle div
    const obstacleDiv = d.getElementById("obstacle");

    const obstacleEl = obstacleDiv.querySelector("svg") || d.createElement("svg");
    obstacleEl.classList.add("obstacle");

    // get the boxes of all relevant svg elements
    const boxes = Array.from(obstacleEl.querySelectorAll(shapes.join(","))).map(el => el.getBBox());

    // generates the correct number of obstacle positions
    const obRange = range(1, Math.ceil(width / minObstacleDistance)); // number of obstacles

    // tracks the left of the obstacle and all the bounding boxes for collision detection
    const nextLeft = lefts => lefts.concat(nextPos(last(lefts))); // add a new left value

    const generateObstaclePositions = () => obRange.reduce(nextLeft, [obstacleXOffset]).map(left => ({
        left,
        right: left + obstacleWidth,
        top: obstacleYOffset,
        bottom: obstacleYOffset + obstacleHeight,
        boxes: boxes.map(({ x, y, height, width }) => ({
            top: obstacleYOffset + y,
            left: left + x,
            bottom: obstacleYOffset + y + height,
            right: left + x + width,
        })),
    }));

    const obstaclePositions = generateObstaclePositions();
    const obstacles = clone(obstacleEl, obstaclePositions);

    // add obstacles to the scene
    obstacles.forEach(el => {
        fragment.append(el);

        Object.assign(el.style, {
            height: `${obstacleHeight}px`,
            width: `${obstacleWidth}px`,
            top: `${obstacleYOffset}px`,
        });
    });

    obstacleDiv.remove(); // remove the div to keep things tidy

    // obstacle bounding boxes
    const obstacleBBs = obstaclePositions.map(ob => ob.boxes.map(() => {
        // only add if debugging
        if (DEBUG) {
            const el = d.createElement("div");
            el.classList.add("bounding-box");
            fragment.append(el);
            return el;
        }

        return null;
    }));

    // the player element
    const playerEl = d.getElementById("player");
    playerEl.style.height = `${playerSize}px`;
    playerEl.style.width = `${playerSize}px`;

    // player bounding box
    const playerElBB = d.createElement("div");

    // only add if debugging
    if (DEBUG) {
        playerElBB.classList.add("bounding-box");
        fragment.append(playerElBB);
    }

    // select elements for later
    const scoreEl = d.getElementById("score");
    const gameOverEl = d.getElementById("game-over");
    const introEl = d.getElementById("intro");

    // append all new elements in one go
    sceneEl.append(fragment);


    /* initial state */
    const initial = {
        started: false, // has the game started
        score: 0, // current score
        player: { // player bounding box
            top: playerYOffset,
            left: playerXOffset,
            bottom: playerYOffset + playerSize,
            right: playerXOffset + playerSize,
            velocityY: 0,
        },
        landscapes: landscapePositions, // landscape positions
        clouds: cloudsPositions, // cloud positions
        obstacles: obstaclePositions, // obstacle positions
    };


    /* reducer functions */
    const startJump = state => {
        // if not currently jumping, then start jumping
        if (state.started && state.player.top === playerYOffset) {
            state.player.velocityY = initialVelocity;
        }

        return state;
    };

    const cancelJump = state => {
        const newVelocity = initialVelocity / 2;

        // if jump is cancelled, reduce the velocity
        if (state.started && !(state.player.top === playerYOffset) && state.player.velocityY > newVelocity) {
            state.player.velocityY = newVelocity;
        }

        return state;
    };

    /*
     * All of the "tick" related code runs 60 times a second
     * As such it needs to run as quickly as possible
     * It should also avoid creating new objects, arrays, functions as these will need
     * to be garbage-collected at some point
     * As such, rather than using nice array-iterator methods, we'll be using
     * a for loop for any looping behaviour. This makes the code less nice to look at
     * but should be a bit better for performance
     */
    const jumpTick = (multiplier, state) => {
        // work out current player position
        // make sure it stops when they hit the ground
        const top = ground(state.player.top - (state.player.velocityY * multiplier));

        state.player.top = top;
        state.player.bottom = top + playerSize;

        // adjust the vertical velocity
        // for realistic jump physics
        state.player.velocityY -= gravity * multiplier;

        return state;
    };

    const landscapeTick = (multiplier, state) => {
        // move each landscape element leftwards
        for (let i = 0; i < state.landscapes.length; i += 1) { // for loop to avoid gc
            const pos = state.landscapes[i] - (landscapeSpeed * multiplier);
            // wrap around if off-left
            state.landscapes[i] = pos < -landscapeWidth ? pos + (state.landscapes.length * landscapeWidth) : pos;
        }

        return state;
    };

    const cloudsTick = (multiplier, state) => {
        // move each cloud leftwards
        for (let i = 0; i < state.clouds.length; i += 1) { // for loop to avoid gc
            const pos = state.clouds[i] - (cloudsSpeed * multiplier);
            // wrap around if off-left
            state.clouds[i] = pos < -cloudsWidth ? pos + (state.clouds.length * cloudsWidth) : pos;
        }

        return state;
    };

    const obstaclesTick = (multiplier, state) => {
        // move each obstacle
        for (let i = 0; i < state.obstacles.length; i += 1) { // for loop to avoid gc
            // get obstacle
            const o = state.obstacles[i];

            // change in left
            const dl = speed * multiplier;

            // get value of previous item
            // for wrap around
            const prev = state.obstacles[(i === 0 ? state.obstacles.length : i) - 1].left;

            // if it's gone off screen, move to the far right
            // nextPos will generate appropriate bounded random value
            const offset = (o.left - dl) < -obstacleWidth ? nextPos(prev) - o.left : -dl;

            // update obstacle
            o.left += offset;
            o.right += offset;

            // update bounding boxes
            for (let j = 0; j < o.boxes.length; j += 1) { // for loop to avoid gc
                o.boxes[j].left += offset;
                o.boxes[j].right += offset;
            }
        }

        return state;
    };

    const collisionsTick = state => {
        // check if there are any collisions
        // if any obstacles' boxes collide with the player, then game over
        // would be nice to use state.obstacles.some(ob => ob.boxes.some(box => collision(state.player, box)))
        // but that would create a lot of anonymous functions for gc to deal with
        for (let i = 0; i < state.obstacles.length; i += 1) {
            // check if there's overlap with entire obstacle box
            // if not, no point checking the boxes
            if (collision(state.player, state.obstacles[i])) {
                // if does collide with obstacle box then check if it actually collides
                // with any of the boxes
                for (let j = 0; j < state.obstacles[i].boxes.length; j += 1) {
                    if (collision(state.player, state.obstacles[i].boxes[j])) {
                        state.started = false;
                    }
                }
            }
        }

        return state;
    };

    const scoreTick = (dt, state) => {
        // update score - fairly arbitrary calculation
        state.score += Math.ceil(dt * speed / 10);
        return state;
    };

    const tick = (state, { dt }) => {
        // if game is running then update all the things
        if (state.started) {
            const m = dt / 1000;
            return jumpTick(m, obstaclesTick(m, cloudsTick(m, landscapeTick(m, collisionsTick(scoreTick(dt, state))))));
        }

        return state;
    };

    // IIFE to store some local state
    const reset = (() => {
        // make a copy of initial state
        // store as a JSON string - simple deep clone
        const copy = JSON.stringify(initial);

        // on first run obstacle positions are already generated
        let firstRun = true;

        return () => {
            // get initial state back from JSON
            let state = JSON.parse(copy);

            // generate new obstacle positions
            state.obstacles = firstRun ? state.obstacles : generateObstaclePositions();

            // no longer first run
            firstRun = false;
            return state;
        };
    })();

    const start = state => {
        // reset and start if not started
        if (!state.started) {
            const clean = reset();
            clean.started = true;
            return clean;
        }

        return state;
    };

    const reducer = (state, action) => {
        switch (action.type) {
            case "start": return start(state);
            case "tick": return tick(state, action);
            case "jump": return startJump(state);
            case "cancelJump": return cancelJump(state);
            case "reset": return reset();
            default: return state;
        }
    };

    const store = createStore(reducer, initial);


    /* render */
    const translate = (x, y) => `translate3d(${x}px, ${y}px, 0)`; // use translate3d to get GPU rendering

    const renderMovement = state => {
        // update score
        scoreEl.textContent = state.score.toLocaleString();

        // move player
        playerEl.style.transform = translate(state.player.left, state.player.top);

        // move obstacles
        for (let i = 0; i < obstacles.length; i += 1) { // for loop to avoid gc
            obstacles[i].style.transform = translate(state.obstacles[i].left, 0);
        }

        // move buildings
        for (let i = 0; i < landscapes.length; i += 1) { // for loop to avoid gc
            landscapes[i].style.transform = translate(state.landscapes[i], 0);
        }

        // move clouds
        for (let i = 0; i < clouds.length; i += 1) { // for loop to avoid gc
            clouds[i].style.transform = translate(state.clouds[i], 0);
        }
    };

    // show bounding boxes
    const renderBoundingBoxes = state => {
        // move player bounding box
        Object.assign(playerElBB.style, {
            transform: translate(state.player.left, state.player.top),
            height: state.player.bottom - state.player.top + "px",
            width: state.player.right - state.player.left + "px",
        });

        // move obstacle bounding boxes
        // use for loops to avoid gc
        for (let i = 0; i < obstacleBBs.length; i += 1) {
            // each obstacle is made of many bounding boxes
            for (let j = 0; j < obstacleBBs[i].length; j += 1) {
                // get current box's state
                const el = obstacleBBs[i][j];
                const ob = state.obstacles[i].boxes[j];

                Object.assign(el.style, {
                    transform: translate(ob.left, ob.top),
                    height: ob.bottom - ob.top + "px",
                    width: ob.right - ob.left + "px",
                });
            }
        }
    };

    // IIFE to store some local state
    const render = (() => {
        // keep track of previous score/started
        let lastScore = null;
        let lastStarted = null;

        return state => {
            // avoids re-rending if nothing has changed
            if (state.score !== lastScore || state.started !== lastStarted) {
                renderMovement(state);

                if (DEBUG) {
                    renderBoundingBoxes(state);
                }

                // game over when started is false and score is not 0
                const method = (!state.started && state.score !== 0) ? "remove" : "add";
                gameOverEl.classList[method]("hidden");

                // intro when started is false and score is 0
                const imethod = (!state.started && state.score === 0) ? "remove" : "add";
                introEl.classList[imethod]("hidden");
            }

            // update previous score/started
            lastScore = state.score;
            lastStarted = state.started;
        };
    })();

    store.subscribe(render);


    /* animation loop */
    const loop = (() => {
        let tickAction = { type: "tick", dt: 0 }; // reuse same object to avoid gc
        let last = 0;

        return time => {
            requestAnimationFrame(loop);
            tickAction.dt = time - last;
            store.dispatch(tickAction);
            last = time;
        };
    })();

    /* music */
    const freq = 60 / bpm;
    const A = 440;
    const rangeValues = range(0, 8).map(val => [val, val - 4]);
    const noteValues = [
        ["C", -9],
        ["C#", -8],
        ["Db", -8],
        ["D", -7],
        ["D#", -6],
        ["Eb", -6],
        ["E", -5],
        ["F", -4],
        ["F#", -3],
        ["Gb", -3],
        ["G", -2],
        ["G#", -1],
        ["Ab", -1],
        ["A", 0],
        ["A#", 1],
        ["Bb", 1],
        ["B", 2],
    ];

    // map notes to frequencies - e.g A4 = 440, C#2 ~= 17.32
    const notes = rangeValues.reduce((ob, [range, multiplier]) => noteValues.reduce((ob, [note, semitones]) => ({
        ...ob,
        [note + range]: A * Math.pow(2, (semitones + (multiplier * 12)) / 12),
    }), ob), {});

    const createOscillator = context => {
        const oscillator = context.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.connect(context.destination);
        return oscillator;
    };

    const audioPlayer = (() => {
        let inited = false;
        let context = null;
        let oscillator = null;
        let now = null;

        const music = (() => {
            let seconds = 0;

            return () => {
                tune.forEach((note, i) => {
                    oscillator.frequency.setValueAtTime(notes[note] || null, now + seconds + (i * freq));
                });

                seconds += tune.length * freq;
            };
        })();

        return () => {
            if (!playMusic || inited) {
                return;
            }

            inited = true;
            context = new (window.AudioContext || window.webkitAudioContext)();
            oscillator = createOscillator(context);
            now = context.currentTime;

            // line up the first two runs of music
            music();
            music();

            // add the next run one run before it's needed
            setInterval(music, tune.length * freq * 1000);

            // start the oscillator
            oscillator.start(now);
        };
    })();

    /* event handlers */
    const up = () => {
        audioPlayer();
        store.dispatch({ type: "start" });
        store.dispatch({ type: "cancelJump" });
    };

    const down = e => {
        e.preventDefault();
        store.dispatch({ type: "jump" });
    };

    // keyboard events
    window.addEventListener("keyup", e => {
        switch (e.key) {
            case "Escape": store.dispatch({ type: "reset" }); break;
            case " ": up(e); break;
        }
    });

    window.addEventListener("keydown", e => {
        switch (e.key) {
            case " ": down(e); break;
        }
    });

    // mouse events
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    // touch events
    window.addEventListener("touchstart", down);
    window.addEventListener("touchend", up);


    /* getting things started */
    requestAnimationFrame(loop);
})(document);
