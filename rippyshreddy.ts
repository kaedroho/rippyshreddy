/// <reference path="lib/types.ts" />
/// <reference path="lib/assets.ts" />
/// <reference path="camera.ts" />
/// <reference path="maps.ts" />
/// <reference path="players.ts" />
/// <reference path="scene.ts" />
/// <reference path="stickmen.ts" />

module RippyShreddy {

function startGame(canvas: HTMLCanvasElement, ws: WebSocket): void {
    const context = <Context2D>canvas.getContext('2d');

    const map = new TwoFortMap();
    const scene = new Scene(map);
    let human = null;
    const camera = new Camera(0, 0, 2000);

    let lastFrame = Date.now();
    let lastTick = Date.now();

    let moveLeft = false;
    let moveRight = false;
    let jump = false;
    let duck = false;
    let attack = false;

    let mouseX = null;
    let mouseY = null;

    function frame() {
        const time = Date.now();
        const dt = (time - lastFrame) / 1000;
        const at = (time - lastTick) / 1000;
        lastFrame = time;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (human) {
            const stickman = scene.getStickman(human);
            if (stickman) {
                const position = stickman.getPosition();
                camera.moveTo(position[0], position[1], 2400);
            }
        }

        context.save();
        camera.transformContext(context, at);

        scene.draw(context, at);

        context.restore();

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function updateCanvasSize() {
        if (canvas.width !== canvas.offsetWidth) {
            canvas.width = canvas.offsetWidth;
        }
        if (canvas.height !== canvas.offsetHeight) {
            canvas.height = canvas.offsetHeight;
        }
    }

    updateCanvasSize();

    function tick() {
        lastTick = Date.now();

        // Update canvas size
        updateCanvasSize();

        // Update camera
        camera.update(0.03);

        // Input
        let move = 0;
        if (moveRight) move++;
        if (moveLeft) move--;

        const input = {
            move: move,
            jump: jump,
            duck: duck,
            lookAt: <Vector2>camera.screenToScene(canvas, mouseX, mouseY),
            attack: attack,
        };

        if (human) {
            human.setInput(input);
        }

        ws.send(JSON.stringify({
            type: 'input',
            input: input
        }));

        // Update scene
        scene.tick(0.03);
    }

    setInterval(tick, 30);

    ws.onmessage = function(message) {
        const data = JSON.parse(message.data);

        if (data.type == 'update') {
            for (const playerData of data.players) {
                const player = scene.getPlayerById(playerData.id);

                if (player) {
                    // Update input
                    if (playerData.input) {
                        player.input = playerData.input;
                    }

                    // Update stickman
                    const stickman = scene.getStickman(player);
                    const stickmanData = playerData.stickman;
                    if (stickman) {
                        stickman.setPosition(stickmanData.pos);
                    } else {
                        if (stickmanData) {
                            scene.spawnPlayer(player);
                        }
                    }
                }
            }
        } else if (data.type == 'welcome') {
            human = new LocalPlayer(data.id);
            scene.addPlayer(human);

            console.log(data.players);

            for (const playerData of data.players) {
                const player = new LocalPlayer(playerData.id);
                scene.addPlayer(player);
            }

        } else if (data.type == 'playerJoin') {
            if (data.id === human.id) {
                return;
            }

            const player = new LocalPlayer(data.id);
            scene.addPlayer(player);
        }
    }

    // Handle any messages that have been recieved before the handler was registered
    if (ws['savedMessages']) {
        for (const message of ws['savedMessages']) {
            ws.onmessage(message);
        }
    }

    let upKey = false;
    let leftKey = false;
    let downKey = false;
    let rightKey = false;
    let wKey = false;
    let aKey = false;
    let sKey = false;
    let dKey = false;

    document.body.onkeydown = function(event) {
        if (event.keyCode === 37) {
            leftKey = moveLeft = true;
        } else if (event.keyCode === 39) {
            rightKey = moveRight = true;
        } else if (event.keyCode === 38) {
            upKey = jump = true;
        } else if (event.keyCode === 40) {
            downKey = duck = true;
        } else if (event.keyCode === 87) {
            wKey = jump = true;
        } else if (event.keyCode === 65) {
            aKey = moveLeft = true;
        } else if (event.keyCode === 83) {
            sKey = duck = true;
        } else if (event.keyCode === 68) {
            dKey = moveRight = true;
        } else {
            return;
        }

        event.preventDefault();
        return false;
    };

    document.body.onkeyup = function(event) {
        if (event.keyCode === 37) {
            leftKey = false;
            moveLeft = aKey;
        } else if (event.keyCode === 39) {
            rightKey = false;
            moveRight = dKey;
        } else if (event.keyCode === 38) {
            upKey = false;
            jump = wKey;
        } else if (event.keyCode === 40) {
            downKey = false;
            duck = sKey;
        } else if (event.keyCode === 87) {
            wKey = false;
            jump = upKey;
        } else if (event.keyCode === 65) {
            aKey = false;
            moveLeft = leftKey;
        } else if (event.keyCode === 83) {
            sKey = false;
            duck = downKey;
        } else if (event.keyCode === 68) {
            dKey = false;
            moveRight = rightKey;
        } else {
            return;
        }

        event.preventDefault();
        return false;
    };

    canvas.onmousemove = function(event) {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;

        event.preventDefault();
        return false;
    };

    canvas.onmousedown = function(event) {
        if (event.button === 0) {
            attack = true;
        }

        event.preventDefault();
        return false;
    };

    canvas.onmouseup = function(event) {
        if (event.button === 0) {
            attack = false;
        }

        event.preventDefault();
        return false;
    };
}

export function main(canvas: HTMLCanvasElement, serverURL: string) {
    const ws = new WebSocket(serverURL);

    // Save messages recieved before we register actual signal handler
    ws['savedMessages'] = [];
    ws.onmessage = function(message) {
        ws['savedMessages'].push(message);
    }

    ws.onopen = function() {
        Assets.loadAssets('/media/', function(totalAssets: number, assetsLoaded: number) {
            if (totalAssets == assetsLoaded) {
                // All assets loaded. Start the game!
                startGame(canvas, ws);
            }
        });

        window.onbeforeunload = function() {
            ws.close();
        };
    };
}

}
