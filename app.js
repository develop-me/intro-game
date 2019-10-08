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

    const obstacleEl = obstacleDiv.querySelector("svg");
    obstacleEl.classList.add("obstacle");

    // get the boxes of all relevant svg elements
    const boxes = Array.from(obstacleEl.querySelectorAll(shapes.join(","))).map(el => el.getBBox());

    // generates the correct number of obstacle positions
    const obRange = range(0, Math.ceil(width / minObstacleDistance)); // number of obstacles

    // tracks the left of the obstacle and all the bounding boxes for collision detection
    const nextLeft = lefts => lefts.concat(nextPos(last(lefts))); // add a new left value

    const generateObstaclePositions = () => obRange.reduce(nextLeft, [obstacleXOffset]).map(left => ({
        left,
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
        state.landscapes.forEach((_, i) => { // forEach to avoid gc
            const pos = state.landscapes[i] - (landscapeSpeed * multiplier);
            // wrap around if off-left
            state.landscapes[i] = pos < -landscapeWidth ? pos + (state.landscapes.length * landscapeWidth) : pos;
        });

        return state;
    };

    const cloudsTick = (multiplier, state) => {
        // move each cloud leftwards
        state.clouds.forEach((_, i) => { // forEach to avoid gc
            const pos = state.clouds[i] - (cloudsSpeed * multiplier);
            // wrap around if off-left
            state.clouds[i] = pos < -cloudsWidth ? pos + (state.clouds.length * cloudsWidth) : pos;
        });

        return state;
    };

    const obstaclesTick = (multiplier, state) => {
        // move each obstacle
        state.obstacles.forEach((o, i) => { // forEach to avoid gc
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

            // update bounding boxes
            o.boxes.forEach((_, i) => { // forEach to avoid gc
                o.boxes[i].left += offset;
                o.boxes[i].right += offset;
            });
        });

        return state;
    };

    const collisionsTick = state => {
        // check if there are any collisions
        // if any obstacles' boxes collide with the player, then game over
        const gameOver = state.obstacles.some(ob => ob.boxes.some(box => collision(state.player, box)));

        if (gameOver) {
            state.started = false;
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
        obstacles.forEach((el, i) => {
            el.style.transform = translate(state.obstacles[i].left, 0);
        });

        // move buildings
        landscapes.forEach((el, i) => {
            el.style.transform = translate(state.landscapes[i], 0);
        });

        // move clouds
        clouds.forEach((el, i) => {
            el.style.transform = translate(state.clouds[i], 0);
        });
    };

    const renderBoundingBoxes = state => {
        // show bounding boxes
        if (DEBUG) {
            // move player bounding box
            Object.assign(playerElBB.style, {
                transform: translate(state.player.left, state.player.top),
                height: state.player.bottom - state.player.top + "px",
                width: state.player.right - state.player.left + "px",
            });

            // move obstacle bounding boxes
            obstacleBBs.forEach((boxes, i) => {
                // each obstacle is made of many bounding boxes
                boxes.forEach((el, j) => {
                    // get current box's state
                    const ob = state.obstacles[i].boxes[j];

                    Object.assign(el.style, {
                        transform: translate(ob.left, ob.top),
                        height: ob.bottom - ob.top + "px",
                        width: ob.right - ob.left + "px",
                    });
                });
            });
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
                renderBoundingBoxes(state);

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


    /* event handlers */
    const up = () => {
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
