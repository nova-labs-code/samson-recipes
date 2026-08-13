(() => {
    "use strict";

    // =========================================================
    // CONFIG
    // =========================================================

    const ROBBER_IMAGE =
        "https://nova-labs-code.github.io/SamsonRecipesImages/Blob1.png";

    const COP_IMAGE = "https://nova-labs-code.github.io/SamsonRecipesImages/Blob2.png";

    const ROBBER_SIZE = 70;
    const COP_SIZE = 70;

    const WALK_SPEED = 45;
    const STEAL_SPEED = 65;
    const ESCAPE_SPEED = 78;
    const COP_SPEED = 95;

    // Slower than the chase speed on purpose — once the word is back,
    // the cop should stroll off screen instead of bolting at full speed.
    const COP_LEAVE_SPEED = 140;

    const WALL_BUFFER = 20;
    const WALL_LOOK_AHEAD = 80;

    const STEAL_INTERVAL = 15000;

    // =========================================================
    // STATE
    // =========================================================

    let robberMode = "wander";
    let copMode = "none";

    let stolen = null;
    let cop = null;

    let x = 100;
    let y = 100;

    let vx = WALK_SPEED;
    let vy = 0;

    let copX = 0;
    let copY = 0;

    let wanderTimer = 0;
    let stealTimer = null;

    // Auto-removes the cop shortly after he spawns, regardless of
    // whether he caught the robber, so he never lingers on screen
    // long enough to visibly affect page layout.
    let copAutoDeleteTimer = null;

    let animationTime = 0;

    // =========================================================
    // ROBBER
    // =========================================================

    const robber =
        document.createElement("img");

    robber.src =
        ROBBER_IMAGE;

    robber.alt = "";

    robber.setAttribute(
        "aria-hidden",
        "true"
    );

    robber.dataset.aprilFools =
        "robber";

    Object.assign(
        robber.style,
        {
            position: "absolute",
            width: ROBBER_SIZE + "px",
            height: ROBBER_SIZE + "px",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            zIndex: "999999",
            margin: "0",
            padding: "0",
            left: "0px",
            top: "0px",
            display: "block",
            transformOrigin: "50% 50%"
        }
    );

    document.body.appendChild(
        robber
    );

    // =========================================================
    // PAGE SIZE
    // =========================================================

    function getPageSize() {
        return {
            width: Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth,
                window.innerWidth
            ),

            height: Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
                window.innerHeight
            )
        };
    }

    // =========================================================
    // ROBBER BOUNDS
    // =========================================================

    function getBounds() {
        const page =
            getPageSize();

        return {
            minX: WALL_BUFFER,

            minY: WALL_BUFFER,

            maxX: Math.max(
                WALL_BUFFER,
                page.width -
                    ROBBER_SIZE -
                    WALL_BUFFER
            ),

            maxY: Math.max(
                WALL_BUFFER,
                page.height -
                    ROBBER_SIZE -
                    WALL_BUFFER
            )
        };
    }

    // =========================================================
    // SAFE POSITION
    // =========================================================

    function keepRobberInside() {
        const bounds =
            getBounds();

        if (!Number.isFinite(x)) {
            x = bounds.minX;
        }

        if (!Number.isFinite(y)) {
            y = bounds.minY;
        }

        if (!Number.isFinite(vx)) {
            vx = WALK_SPEED;
        }

        if (!Number.isFinite(vy)) {
            vy = 0;
        }

        x =
            Math.max(
                bounds.minX,
                Math.min(
                    bounds.maxX,
                    x
                )
            );

        y =
            Math.max(
                bounds.minY,
                Math.min(
                    bounds.maxY,
                    y
                )
            );
    }

    // =========================================================
    // NORMALIZE
    // =========================================================

    function normalize(dx, dy) {
        const length =
            Math.hypot(
                dx,
                dy
            );

        if (
            !Number.isFinite(length) ||
            length < 0.001
        ) {
            return {
                x: 1,
                y: 0
            };
        }

        return {
            x: dx / length,
            y: dy / length
        };
    }

    // =========================================================
    // WALL STEERING
    // =========================================================

    function wallSteering() {
        const bounds =
            getBounds();

        let sx = 0;
        let sy = 0;

        const left =
            x -
            bounds.minX;

        const right =
            bounds.maxX -
            x;

        const top =
            y -
            bounds.minY;

        const bottom =
            bounds.maxY -
            y;

        if (
            left <
            WALL_LOOK_AHEAD
        ) {
            sx +=
                1 -
                left /
                    WALL_LOOK_AHEAD;
        }

        if (
            right <
            WALL_LOOK_AHEAD
        ) {
            sx -=
                1 -
                right /
                    WALL_LOOK_AHEAD;
        }

        if (
            top <
            WALL_LOOK_AHEAD
        ) {
            sy +=
                1 -
                top /
                    WALL_LOOK_AHEAD;
        }

        if (
            bottom <
            WALL_LOOK_AHEAD
        ) {
            sy -=
                1 -
                bottom /
                    WALL_LOOK_AHEAD;
        }

        return {
            x: sx,
            y: sy
        };
    }

    // =========================================================
    // RANDOM DIRECTION
    // =========================================================

    function chooseRandomDirection() {
        const angle =
            Math.random() *
            Math.PI *
            2;

        const direction =
            normalize(
                Math.cos(angle),
                Math.sin(angle)
            );

        vx =
            direction.x *
            WALK_SPEED;

        vy =
            direction.y *
            WALK_SPEED;
    }

    // =========================================================
    // WANDER
    // =========================================================

    function updateWander(dt) {
        wanderTimer -= dt;

        if (
            wanderTimer <= 0
        ) {
            chooseRandomDirection();

            wanderTimer =
                1200 +
                Math.random() *
                    3000;
        }

        const current =
            normalize(
                vx,
                vy
            );

        const wall =
            wallSteering();

        let dx =
            current.x +
            wall.x * 3;

        let dy =
            current.y +
            wall.y * 3;

        const direction =
            normalize(
                dx,
                dy
            );

        const targetVX =
            direction.x *
            WALK_SPEED;

        const targetVY =
            direction.y *
            WALK_SPEED;

        const turn =
            Math.min(
                1,
                dt / 500
            );

        vx +=
            (
                targetVX -
                vx
            ) *
            turn;

        vy +=
            (
                targetVY -
                vy
            ) *
            turn;

        let speed =
            Math.hypot(
                vx,
                vy
            );

        if (
            speed < 10
        ) {
            chooseRandomDirection();

            speed =
                Math.hypot(
                    vx,
                    vy
                );
        }

        if (
            speed >
            WALK_SPEED
        ) {
            vx =
                vx /
                speed *
                WALK_SPEED;

            vy =
                vy /
                speed *
                WALK_SPEED;
        }

        const seconds =
            dt / 1000;

        x +=
            vx *
            seconds;

        y +=
            vy *
            seconds;

        keepRobberInside();
    }

    // =========================================================
    // FIND VISIBLE WORDS
    // =========================================================

    function findWords() {
        const words = [];

        const walker =
            document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT
            );

        let node;

        while (
            (node =
                walker.nextNode())
        ) {
            const parent =
                node.parentElement;

            if (!parent) {
                continue;
            }

            if (
                parent.closest(
                    "[data-april-fools]"
                )
            ) {
                continue;
            }

            if (
                parent.closest(
                    "script,style,noscript,textarea,input,select,button"
                )
            ) {
                continue;
            }

            if (
                !node.nodeValue ||
                !node.nodeValue.trim()
            ) {
                continue;
            }

            const style =
                getComputedStyle(
                    parent
                );

            if (
                style.display === "none" ||
                style.visibility ===
                    "hidden" ||
                style.opacity === "0"
            ) {
                continue;
            }

            const regex =
                /\b[\p{L}][\p{L}'-]{2,}\b/gu;

            let match;

            while (
                (match =
                    regex.exec(
                        node.nodeValue
                    ))
            ) {
                const range =
                    document.createRange();

                range.setStart(
                    node,
                    match.index
                );

                range.setEnd(
                    node,
                    match.index +
                        match[0].length
                );

                const rect =
                    range.getBoundingClientRect();

                if (
                    rect.width <= 0 ||
                    rect.height <= 0
                ) {
                    continue;
                }

                // Only currently visible text.
                if (
                    rect.bottom < 0 ||
                    rect.top >
                        window.innerHeight ||
                    rect.right < 0 ||
                    rect.left >
                        window.innerWidth
                ) {
                    continue;
                }

                words.push({
                    node,

                    parent,

                    word:
                        match[0],

                    start:
                        match.index,

                    end:
                        match.index +
                        match[0].length,

                    x:
                        rect.left +
                        window.scrollX +
                        rect.width / 2,

                    y:
                        rect.top +
                        window.scrollY +
                        rect.height / 2
                });
            }
        }

        return words;
    }

    // =========================================================
    // START STEAL
    // =========================================================

    function startSteal() {
        if (
            stolen ||
            robberMode !== "wander" ||
            copMode !== "none"
        ) {
            return;
        }

        const words =
            findWords();

        if (
            words.length === 0
        ) {
            scheduleSteal();

            return;
        }

        const target =
            words[
                Math.floor(
                    Math.random() *
                        words.length
                )
            ];

        stolen = {
            node: target.node,
            parent: target.parent,

            word: target.word,

            start: target.start,
            end: target.end,

            targetX: target.x,
            targetY: target.y,

            placeholder: null,

            robberWord: null,
            copWord: null
        };

        // IMPORTANT:
        // Set velocity once immediately.
        const dx =
            stolen.targetX -
            (
                x +
                ROBBER_SIZE / 2
            );

        const dy =
            stolen.targetY -
            (
                y +
                ROBBER_SIZE / 2
            );

        const direction =
            normalize(
                dx,
                dy
            );

        vx =
            direction.x *
            STEAL_SPEED;

        vy =
            direction.y *
            STEAL_SPEED;

        robberMode =
            "stealing";
    }

    // =========================================================
    // REFRESH STEAL TARGET
    // =========================================================

    /*
     * Re-validates the stolen target against the live DOM and
     * refreshes its on-page coordinates every frame. This is
     * what prevents the robber from getting stuck: previously
     * the target position was captured once in startSteal()
     * and never updated, so if the word moved (reflow, a
     * framework re-render, script-inserted content shifting
     * layout) or was removed/replaced entirely, the robber
     * would walk toward a stale, empty spot forever.
     *
     * Returns true if the target is still valid and up to date,
     * false if the steal attempt should be abandoned.
     */
    function refreshStealTarget() {
        if (!stolen) {
            return false;
        }

        // Node was removed from the DOM (e.g. a JS framework
        // re-rendered its container and replaced the text node).
        if (
            !stolen.node.parentNode
        ) {
            return false;
        }

        // The text at this position no longer matches what we
        // grabbed — content shifted or was rewritten underneath us.
        if (
            stolen.node.nodeValue.slice(
                stolen.start,
                stolen.end
            ) !== stolen.word
        ) {
            return false;
        }

        const range =
            document.createRange();

        range.setStart(
            stolen.node,
            stolen.start
        );

        range.setEnd(
            stolen.node,
            stolen.end
        );

        const rect =
            range.getBoundingClientRect();

        // Word is no longer rendered (display:none, detached
        // layout, zero-size container, etc.)
        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return false;
        }

        stolen.targetX =
            rect.left +
            window.scrollX +
            rect.width / 2;

        stolen.targetY =
            rect.top +
            window.scrollY +
            rect.height / 2;

        return true;
    }

    // =========================================================
    // STEAL MOVEMENT
    // =========================================================

    function updateStealing(dt) {
        if (!stolen) {
            robberMode =
                "wander";

            chooseRandomDirection();

            return;
        }

        // Keep the target position in sync with the live DOM
        // every frame instead of trusting a stale snapshot.
        if (!refreshStealTarget()) {
            resetEverything();

            return;
        }

        const centerX =
            x +
            ROBBER_SIZE / 2;

        const centerY =
            y +
            ROBBER_SIZE / 2;

        const dx =
            stolen.targetX -
            centerX;

        const dy =
            stolen.targetY -
            centerY;

        const distance =
            Math.hypot(
                dx,
                dy
            );

        if (
            distance <= 30
        ) {
            stealWord();

            return;
        }

        /*
         * IMPORTANT:
         * Wall avoidance is deliberately OFF during stealing.
         * A stolen word can sit right up against (or past) the
         * WALL_LOOK_AHEAD buffer near an edge, and mixing in
         * wallSteering() there made him fight himself — pulled
         * toward the word by dx/dy but pushed away from the
         * edge by the wall term, so he'd hover just outside
         * grab range and never close the last few pixels.
         *
         * Instead he beelines straight for the word no matter
         * how close to the edge it is. keepRobberInside() below
         * still hard-clamps his position so he can never actually
         * leave the page — it just no longer steers him away
         * pre-emptively. Once he grabs the word, "escape" mode
         * re-enables full wall steering, which naturally pulls
         * him back off the edge and out into the open.
         */

        const direction =
            normalize(
                dx,
                dy
            );

        vx =
            direction.x *
            STEAL_SPEED;

        vy =
            direction.y *
            STEAL_SPEED;

        const seconds =
            dt / 1000;

        x +=
            vx *
            seconds;

        y +=
            vy *
            seconds;

        keepRobberInside();

        // Never let wall clamping freeze him.
        if (
            Math.hypot(
                vx,
                vy
            ) < 10
        ) {
            const fallback =
                normalize(
                    dx || 1,
                    dy || 1
                );

            vx =
                fallback.x *
                STEAL_SPEED;

            vy =
                fallback.y *
                STEAL_SPEED;
        }
    }

    // =========================================================
    // STEAL THE WORD
    // =========================================================

    function stealWord() {
        if (!stolen) {
            return;
        }

        const data =
            stolen;

        if (
            !data.node.parentNode
        ) {
            resetEverything();

            return;
        }

        if (
            data.node.nodeValue.slice(
                data.start,
                data.end
            ) !== data.word
        ) {
            resetEverything();

            return;
        }

        const range =
            document.createRange();

        range.setStart(
            data.node,
            data.start
        );

        range.setEnd(
            data.node,
            data.end
        );

        const placeholder =
            document.createElement(
                "span"
            );

        placeholder.dataset.aprilFools =
            "placeholder";

        range.deleteContents();

        range.insertNode(
            placeholder
        );

        data.placeholder =
            placeholder;

        // Create the held word.
        const style =
            getComputedStyle(
                data.parent
            );

        const held =
            document.createElement(
                "span"
            );

        held.textContent =
            data.word;

        held.dataset.aprilFools =
            "robber-word";

        Object.assign(
            held.style,
            {
                position: "absolute",

                zIndex:
                    "1000001",

                pointerEvents:
                    "none",

                whiteSpace:
                    "nowrap",

                fontFamily:
                    style.fontFamily,

                fontSize:
                    style.fontSize,

                fontWeight:
                    style.fontWeight,

                fontStyle:
                    style.fontStyle,

                lineHeight:
                    style.lineHeight,

                letterSpacing:
                    style.letterSpacing,

                color:
                    style.color,

                textTransform:
                    style.textTransform
            }
        );

        document.body.appendChild(
            held
        );

        data.robberWord =
            held;

        robberMode =
            "escape";

        chooseEscapeDirection();

        // Cop arrives after the theft.
        setTimeout(
            () => {
                if (
                    stolen === data &&
                    copMode === "none"
                ) {
                    createCop();
                }
            },
            1200 +
                Math.random() *
                    2500
        );
    }

    // =========================================================
    // ESCAPE DIRECTION
    // =========================================================

    function chooseEscapeDirection() {
        const angle =
            Math.random() *
            Math.PI *
            2;

        const direction =
            normalize(
                Math.cos(angle),
                Math.sin(angle)
            );

        vx =
            direction.x *
            ESCAPE_SPEED;

        vy =
            direction.y *
            ESCAPE_SPEED;
    }

    // =========================================================
    // ESCAPE
    // =========================================================

    function updateEscape(dt) {
        if (!stolen) {
            robberMode =
                "wander";

            chooseRandomDirection();

            return;
        }

        const wall =
            wallSteering();

        const direction =
            normalize(
                vx +
                    wall.x * 4,

                vy +
                    wall.y * 4
            );

        vx =
            direction.x *
            ESCAPE_SPEED;

        vy =
            direction.y *
            ESCAPE_SPEED;

        const seconds =
            dt / 1000;

        x +=
            vx *
            seconds;

        y +=
            vy *
            seconds;

        keepRobberInside();
    }

    // =========================================================
    // CREATE COP
    // =========================================================

    function createCop() {
        if (
            cop ||
            !stolen
        ) {
            return;
        }

        cop =
            document.createElement(
                "img"
            );

        cop.src =
            COP_IMAGE;

        cop.alt = "";

        cop.setAttribute(
            "aria-hidden",
            "true"
        );

        cop.dataset.aprilFools =
            "cop";

        Object.assign(
            cop.style,
            {
                position: "absolute",

                width:
                    COP_SIZE + "px",

                height:
                    COP_SIZE + "px",

                objectFit:
                    "contain",

                pointerEvents:
                    "none",

                userSelect:
                    "none",

                WebkitUserSelect:
                    "none",

                zIndex:
                    "1000000",

                margin: "0",
                padding: "0",

                display: "block",

                left: "0px",
                top: "0px",

                transformOrigin:
                    "50% 50%"
            }
        );

        document.body.appendChild(
            cop
        );

        // Spawn just outside the visible area.
        const side =
            Math.floor(
                Math.random() * 4
            );

        if (side === 0) {
            copX =
                window.scrollX -
                COP_SIZE -
                20;

            copY =
                window.scrollY +
                Math.random() *
                    window.innerHeight;
        }
        else if (side === 1) {
            copX =
                window.scrollX +
                window.innerWidth +
                20;

            copY =
                window.scrollY +
                Math.random() *
                    window.innerHeight;
        }
        else if (side === 2) {
            copX =
                window.scrollX +
                Math.random() *
                    window.innerWidth;

            copY =
                window.scrollY -
                COP_SIZE -
                20;
        }
        else {
            copX =
                window.scrollX +
                Math.random() *
                    window.innerWidth;

            copY =
                window.scrollY +
                window.innerHeight +
                20;
        }

        copMode =
            "chase";
    }

    // =========================================================
    // FORCE REMOVE COP
    // =========================================================

    function forceRemoveCop() {
        copAutoDeleteTimer = null;

        if (!cop) {
            return;
        }

        cop.remove();

        cop = null;

        if (
            stolen &&
            stolen.copWord
        ) {
            stolen.copWord.remove();

            stolen.copWord =
                null;
        }

        copMode =
            "none";
    }

    // =========================================================
    // COP CHASE
    // =========================================================

    function updateCop(dt) {
        if (
            !cop ||
            !stolen
        ) {
            return;
        }

        const targetX =
            x +
            ROBBER_SIZE / 2;

        const targetY =
            y +
            ROBBER_SIZE / 2;

        const copCenterX =
            copX +
            COP_SIZE / 2;

        const copCenterY =
            copY +
            COP_SIZE / 2;

        const dx =
            targetX -
            copCenterX;

        const dy =
            targetY -
            copCenterY;

        const distance =
            Math.hypot(
                dx,
                dy
            );

        // Touching the robber catches him.
        if (
            distance <= 48
        ) {
            catchRobber();

            return;
        }

        const direction =
            normalize(
                dx,
                dy
            );

        const seconds =
            dt / 1000;

        copX +=
            direction.x *
            COP_SPEED *
            seconds;

        copY +=
            direction.y *
            COP_SPEED *
            seconds;
    }

    // =========================================================
    // CATCH
    // =========================================================

    function catchRobber() {
        if (
            !stolen ||
            !cop
        ) {
            return;
        }

        if (
            stolen.robberWord
        ) {
            stolen.robberWord.remove();

            stolen.robberWord =
                null;
        }

        createCopWord();

        copMode =
            "return";

        robberMode =
            "wander";

        chooseRandomDirection();
    }

    // =========================================================
    // COP HOLDS WORD
    // =========================================================

    function createCopWord() {
        if (
            !stolen ||
            stolen.copWord
        ) {
            return;
        }

        const style =
            getComputedStyle(
                stolen.parent
            );

        const word =
            document.createElement(
                "span"
            );

        word.textContent =
            stolen.word;

        word.dataset.aprilFools =
            "cop-word";

        Object.assign(
            word.style,
            {
                position: "absolute",

                zIndex:
                    "1000002",

                pointerEvents:
                    "none",

                whiteSpace:
                    "nowrap",

                fontFamily:
                    style.fontFamily,

                fontSize:
                    style.fontSize,

                fontWeight:
                    style.fontWeight,

                fontStyle:
                    style.fontStyle,

                lineHeight:
                    style.lineHeight,

                letterSpacing:
                    style.letterSpacing,

                color:
                    style.color,

                textTransform:
                    style.textTransform
            }
        );

        document.body.appendChild(
            word
        );

        stolen.copWord =
            word;
    }

    // =========================================================
    // COP RETURNS
    // =========================================================

    function updateCopReturn(dt) {
        if (
            !cop ||
            !stolen ||
            !stolen.placeholder
        ) {
            resetEverything();

            return;
        }

        const rect =
            stolen.placeholder
                .getBoundingClientRect();

        const targetX =
            rect.left +
            window.scrollX +
            rect.width / 2;

        const targetY =
            rect.top +
            window.scrollY +
            rect.height / 2;

        const copCenterX =
            copX +
            COP_SIZE / 2;

        const copCenterY =
            copY +
            COP_SIZE / 2;

        const dx =
            targetX -
            copCenterX;

        const dy =
            targetY -
            copCenterY;

        const distance =
            Math.hypot(
                dx,
                dy
            );

        if (
            distance <= 12
        ) {
            returnWord();

            return;
        }

        const direction =
            normalize(
                dx,
                dy
            );

        const seconds =
            dt / 1000;

        copX +=
            direction.x *
            COP_SPEED *
            seconds;

        copY +=
            direction.y *
            COP_SPEED *
            seconds;
    }

    // =========================================================
    // RETURN WORD
    // =========================================================

    function returnWord() {
        if (!stolen) {
            return;
        }

        const data =
            stolen;

        if (
            data.placeholder &&
            data.placeholder.parentNode
        ) {
            data.placeholder.parentNode
                .replaceChild(
                    document.createTextNode(
                        data.word
                    ),
                    data.placeholder
                );
        }

        if (
            data.copWord
        ) {
            data.copWord.remove();

            data.copWord =
                null;
        }

        stolen = null;

        copMode =
            "leave";

        // Auto-delete the cop 2 seconds after he starts leaving
        // (i.e. after the word is actually back), as a safety net
        // in case he ever fails to walk fully off screen.
        if (copAutoDeleteTimer) {
            clearTimeout(
                copAutoDeleteTimer
            );
        }

        copAutoDeleteTimer =
            setTimeout(
                forceRemoveCop,
                2000
            );

        // This timer starts AFTER
        // the word has actually been returned.
        scheduleSteal();
    }

    // =========================================================
    // COP LEAVES
    // =========================================================

    function updateCopLeave(dt) {
        if (!cop) {
            copMode =
                "none";

            return;
        }

        const centerX =
            copX +
            COP_SIZE / 2;

        const centerY =
            copY +
            COP_SIZE / 2;

        const targets = [
            {
                x:
                    window.scrollX -
                    COP_SIZE * 3,

                y:
                    centerY
            },

            {
                x:
                    window.scrollX +
                    window.innerWidth +
                    COP_SIZE * 3,

                y:
                    centerY
            },

            {
                x:
                    centerX,

                y:
                    window.scrollY -
                    COP_SIZE * 3
            },

            {
                x:
                    centerX,

                y:
                    window.scrollY +
                    window.innerHeight +
                    COP_SIZE * 3
            }
        ];

        let target =
            targets[0];

        let closest =
            Infinity;

        for (
            const candidate
            of targets
        ) {
            const distance =
                Math.hypot(
                    candidate.x -
                        centerX,
                    candidate.y -
                        centerY
                );

            if (
                distance <
                closest
            ) {
                closest =
                    distance;

                target =
                    candidate;
            }
        }

        const direction =
            normalize(
                target.x -
                    centerX,
                target.y -
                    centerY
            );

        const seconds =
            dt / 1000;

        copX +=
            direction.x *
            COP_LEAVE_SPEED *
            seconds;

        copY +=
            direction.y *
            COP_LEAVE_SPEED *
            seconds;

        if (
            closest < 30
        ) {
            cop.remove();

            cop = null;

            copMode =
                "none";

            if (copAutoDeleteTimer) {
                clearTimeout(
                    copAutoDeleteTimer
                );

                copAutoDeleteTimer =
                    null;
            }
        }
    }

    // =========================================================
    // RENDER ROBBER
    // =========================================================

    function renderRobber() {
        robber.style.left =
            x + "px";

        robber.style.top =
            y + "px";

        const pulse =
            Math.sin(
                animationTime *
                    0.006
            );

        const pulse2 =
            Math.sin(
                animationTime *
                    0.009
            );

        const moving =
            Math.hypot(
                vx,
                vy
            ) > 5;

        const scaleX =
            1 +
            pulse *
                0.035;

        const scaleY =
            1 -
            pulse *
                0.025 +
            pulse2 *
                0.012;

        let angle = 0;

        if (moving) {
            angle =
                Math.max(
                    -3,
                    Math.min(
                        3,
                        vx *
                            0.018
                    )
                );
        }

        robber.style.transform =
            `
            scaleX(${vx < -2
                ? -scaleX
                : scaleX})
            scaleY(${scaleY})
            rotate(${angle}deg)
            `;
    }

    // =========================================================
    // RENDER ROBBER WORD
    // =========================================================

    function renderRobberWord() {
        if (
            !stolen ||
            !stolen.robberWord
        ) {
            return;
        }

        const word =
            stolen.robberWord;

        word.style.left =
            (
                x +
                ROBBER_SIZE / 2 -
                word.offsetWidth / 2
            ) + "px";

        word.style.top =
            (
                y +
                ROBBER_SIZE +
                3
            ) + "px";
    }

    // =========================================================
    // RENDER COP
    // =========================================================

    function renderCop() {
        if (!cop) {
            return;
        }

        cop.style.left =
            copX + "px";

        cop.style.top =
            copY + "px";

        const pulse =
            Math.sin(
                animationTime *
                    0.007
            );

        const pulse2 =
            Math.sin(
                animationTime *
                    0.011
            );

        cop.style.transform =
            `
            scaleX(${1 +
                pulse *
                    0.035})
            scaleY(${1 -
                pulse *
                    0.025})
            rotate(${pulse2 * 2}deg)
            `;
    }

    // =========================================================
    // RENDER COP WORD
    // =========================================================

    function renderCopWord() {
        if (
            !stolen ||
            !stolen.copWord
        ) {
            return;
        }

        const word =
            stolen.copWord;

        word.style.left =
            (
                copX +
                COP_SIZE / 2 -
                word.offsetWidth / 2
            ) + "px";

        word.style.top =
            (
                copY +
                COP_SIZE +
                3
            ) + "px";
    }

    // =========================================================
    // RESET
    // =========================================================

    function resetEverything() {
        if (stolen) {
            if (
                stolen.placeholder &&
                stolen.placeholder.parentNode
            ) {
                stolen.placeholder.parentNode
                    .replaceChild(
                        document.createTextNode(
                            stolen.word
                        ),
                        stolen.placeholder
                    );
            }

            if (
                stolen.robberWord
            ) {
                stolen.robberWord.remove();
            }

            if (
                stolen.copWord
            ) {
                stolen.copWord.remove();
            }
        }

        stolen = null;

        if (cop) {
            cop.remove();

            cop = null;
        }

        if (copAutoDeleteTimer) {
            clearTimeout(
                copAutoDeleteTimer
            );

            copAutoDeleteTimer =
                null;
        }

        robberMode =
            "wander";

        copMode =
            "none";

        keepRobberInside();

        chooseRandomDirection();

        scheduleSteal();
    }

    // =========================================================
    // STEAL TIMER
    // =========================================================

    function scheduleSteal() {
        if (stealTimer) {
            clearTimeout(
                stealTimer
            );
        }

        stealTimer =
            setTimeout(
                () => {
                    startSteal();
                },
                STEAL_INTERVAL
            );
    }

    // =========================================================
    // MAIN LOOP
    // =========================================================

    let lastTime =
        performance.now();

    function loop(now) {
        let dt =
            now -
            lastTime;

        lastTime =
            now;

        // Prevent giant jumps after
        // switching tabs or lag.
        dt =
            Math.max(
                0,
                Math.min(
                    dt,
                    32
                )
            );

        animationTime += dt;

        // Robber state.
        if (
            robberMode ===
            "wander"
        ) {
            updateWander(dt);
        }
        else if (
            robberMode ===
            "stealing"
        ) {
            updateStealing(dt);
        }
        else if (
            robberMode ===
            "escape"
        ) {
            updateEscape(dt);
        }

        // Cop state.
        if (
            copMode ===
            "chase"
        ) {
            updateCop(dt);
        }
        else if (
            copMode ===
            "return"
        ) {
            updateCopReturn(dt);
        }
        else if (
            copMode ===
            "leave"
        ) {
            updateCopLeave(dt);
        }

        // Render everything.
        renderRobber();
        renderRobberWord();

        renderCop();
        renderCopWord();

        requestAnimationFrame(
            loop
        );
    }

    // =========================================================
    // RESIZE
    // =========================================================

    window.addEventListener(
        "resize",
        () => {
            keepRobberInside();
        },
        {
            passive: true
        }
    );

    // =========================================================
    // START
    // =========================================================

    keepRobberInside();

    chooseRandomDirection();

    scheduleSteal();

    requestAnimationFrame(
        loop
    );
})();