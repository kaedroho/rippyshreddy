interface Input {
    move: number;
    jump: boolean;
    duck: boolean;
    lookAt: Vector2;
}

interface Player {
    input: Input;
    getDisplayName(): string;
}

class AIPlayer implements Player {
    input: Input = {
        move: 0,
        jump: false,
        duck: false,
        lookAt: [0, 0],
    };

    getDisplayName() {
        return "John";
    }
}

class LocalPlayer implements Player {
    input: Input = {
        move: 0,
        jump: false,
        duck: false,
        lookAt: [0, 0],
    };

    setInput(input: Input) {
        if ('move' in input) {
            this.input.move = input.move;
        }
        if ('jump' in input) {
            this.input.jump = input.jump;
        }
        if ('duck' in input) {
            this.input.duck = input.duck;
        }
        if ('lookAt' in input) {
            this.input.lookAt = input.lookAt;
        }
    }

    getDisplayName() {
        return "Bob";
    }
}
