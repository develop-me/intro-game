((d) => {
    /* debugging */
    const SHOW_BOUNDING_BOXES = false;

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
    const shapes = ["rect", "circle", "ellipse", "line", "polyline", "polygon", "path"];


    /* useful functions */
    const collision = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const last = arr => arr[arr.length - 1];

    const nextPos = prev => prev + rand(minObstacleDistance + obstacleWidth, maxObstacleDistance + obstacleWidth);

    const range = (start, stop) => Array(stop - start + 1).fill().map((_, i) => start + i);

    const ground = n => n < playerYOffset ? n : playerYOffset;

    const clone = (el, positions) => {
        el.remove();
        el.removeAttribute("id");
        return positions.map(() => el.cloneNode(true));
    };

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

    const sceneEl = d.getElementById("scene");
    sceneEl.style.height = `${height}px`;
    sceneEl.style.width = `${width}px`;

    const landscapePositions = range(0, Math.ceil(width / landscapeWidth) + 1).map(i => i * landscapeWidth);
    const landscapes = clone(d.getElementById("landscape"), landscapePositions);

    landscapes.forEach(el => {
        fragment.append(el);
        el.style.width = `${landscapeWidth}px`;
    });

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

    const boxes = Array.from(obstacleEl.querySelectorAll(shapes.join(","))).map(el => el.getBBox());

    const generateObstaclePositions = () => range(0, Math.ceil(width / minObstacleDistance)).reduce(lefts => lefts.concat(nextPos(last(lefts))), [obstacleXOffset]).map(left => ({
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

    obstacles.forEach(el => {
        fragment.append(el);

        Object.assign(el.style, {
            height: `${obstacleHeight}px`,
            width: `${obstacleWidth}px`,
            top: `${obstacleYOffset}px`,
        });
    });

    obstacleDiv.remove(); // remove the div to keep things tidy

    const obstacleBBs = obstaclePositions.map(ob => ob.boxes.map(() => {
        const el = d.createElement("div");

        if (SHOW_BOUNDING_BOXES) {
            el.classList.add("bounding-box");
            fragment.append(el);
        }

        return el;
    }));

    const playerEl = d.getElementById("player");
    playerEl.style.height = `${playerSize}px`;
    playerEl.style.width = `${playerSize}px`;

    const playerElBB = d.createElement("div");

    if (SHOW_BOUNDING_BOXES) {
        playerElBB.classList.add("bounding-box");
        fragment.append(playerElBB);
    }

    const scoreEl = d.getElementById("score");

    const gameOverEl = d.getElementById("game-over");
    const introEl = d.getElementById("intro");

    sceneEl.append(fragment);


    /* initial state */
    const initial = {
        started: false,
        score: 0,
        player: {
            top: playerYOffset,
            left: playerXOffset,
            bottom: playerYOffset + playerSize,
            right: playerXOffset + playerSize,
            velocityY: 0,
        },
        landscapes: landscapePositions,
        clouds: cloudsPositions,
        obstacles: obstaclePositions,
    };


    /* reducer functions */
    const startJump = state => {
        if (state.started && state.player.top === playerYOffset) {
            state.player.velocityY = initialVelocity;
        }

        return state;
    };

    const cancelJump = state => {
        const newVelocity = initialVelocity / 2;

        if (state.started && !(state.player.top === playerYOffset) && state.player.velocityY > newVelocity) {
            state.player.velocityY = newVelocity;
        }

        return state;
    };

    const jumpTick = (multiplier, state) => {
        const top = ground(state.player.top - (state.player.velocityY * multiplier));

        state.player.top = top;
        state.player.bottom = top + playerSize;
        state.player.velocityY -= gravity * multiplier;

        return state;
    };

    const landscapeTick = (multiplier, state) => {
        state.landscapes.forEach((_, i) => { // forEach to avoid gc
            const pos = state.landscapes[i] - (landscapeSpeed * multiplier);
            state.landscapes[i] = pos < -landscapeWidth ? pos + (state.landscapes.length * landscapeWidth) : pos;
        });

        return state;
    };

    const cloudsTick = (multiplier, state) => {
        state.clouds.forEach((_, i) => { // forEach to avoid gc
            const pos = state.clouds[i] - (cloudsSpeed * multiplier);
            state.clouds[i] = pos < -cloudsWidth ? pos + (state.clouds.length * cloudsWidth) : pos;
        });

        return state;
    };

    const obstaclesTick = (multiplier, state) => {
        state.obstacles.forEach((o, i) => {
            const dl = speed * multiplier;
            const prev = state.obstacles[(i === 0 ? state.obstacles.length : i) - 1].left;
            const offset = (o.left - dl) < -obstacleWidth ? nextPos(prev) - o.left : -dl;

            o.left += offset;
            o.boxes.forEach((_, i) => {
                o.boxes[i].left += offset;
                o.boxes[i].right += offset;
            });
        });

        return state;
    };

    const collisionsTick = state => {
        const gameOver = state.obstacles.some(ob => ob.boxes.some(box => collision(state.player, box)));

        if (gameOver) {
            state.started = false;
        }

        return state;
    };

    const scoreTick = (dt, state) => {
        state.score += Math.ceil(dt * speed / 10);
        return state;
    };

    const tick = (state, { dt }) => {
        if (state.started) {
            const m = dt / 1000;
            return jumpTick(m, obstaclesTick(m, cloudsTick(m, landscapeTick(m, collisionsTick(scoreTick(dt, state))))));
        }

        return state;
    };

    const reset = (() => {
        const copy = JSON.stringify(initial);
        let firstRun = true;

        return () => {
            let state = JSON.parse(copy);
            state.obstacles = firstRun ? state.obstacles : generateObstaclePositions();
            firstRun = false;
            return state;
        };
    })();

    const start = state => {
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
        scoreEl.textContent = state.score.toLocaleString();
        playerEl.style.transform = translate(state.player.left, state.player.top);

        landscapes.forEach((el, i) => {
            el.style.transform = translate(state.landscapes[i], 0);
        });

        clouds.forEach((el, i) => {
            el.style.transform = translate(state.clouds[i], 0);
        });

        obstacles.forEach((el, i) => {
            el.style.transform = translate(state.obstacles[i].left, 0);
        });
    };

    const renderBoundingBoxes = state => {
        // show bounding boxes
        if (SHOW_BOUNDING_BOXES) {
            Object.assign(playerElBB.style, {
                transform: translate(state.player.left, state.player.top),
                height: state.player.bottom - state.player.top + "px",
                width: state.player.right - state.player.left + "px",
            });

            obstacleBBs.forEach((boxes, i) => {
                boxes.forEach((el, j) => {
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

    const render = (() => {
        let lastScore = null;
        let lastStarted = null;

        return state => {
            if (state.score !== lastScore || state.started !== lastStarted) {
                renderMovement(state);
                renderBoundingBoxes(state);

                // game over when started is false and score is not 0
                const method = (!state.started && state.score !== 0) ? "remove" : "add";
                gameOverEl.classList[method]("hidden");

                const imethod = (!state.started && state.score === 0) ? "remove" : "add";
                introEl.classList[imethod]("hidden");
            }

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


    /* keyboard events */
    const up = () => {
        store.dispatch({ type: "start" });
        store.dispatch({ type: "cancelJump" });
    };

    const down = () => {
        store.dispatch({ type: "jump" });
    };

    window.addEventListener("keyup", e => {
        switch (e.key) {
            case "Escape": store.dispatch({ type: "reset" }); break;
            case " ": up(); break;
        }
    });

    window.addEventListener("keydown", e => {
        switch (e.key) {
            case " ": down(); break;
        }
    });

    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    window.addEventListener("touchstart", down);
    window.addEventListener("touchend", up);


    /* getting things started */
    requestAnimationFrame(loop);
})(document);
