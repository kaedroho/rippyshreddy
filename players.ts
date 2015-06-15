/// <reference path="lib/types.ts" />

module RippyShreddy {

interface Input {
    move: number;
    jump: boolean;
    duck: boolean;
    lookAt: Vector2;
    attack: boolean;
}

export interface Player {
    input: Input;
    getDisplayName(): string;
}

export class AIPlayer implements Player {
    input: Input = {
        move: 0,
        jump: false,
        duck: false,
        lookAt: [0, 0],
        attack: false,
    };

    getDisplayName() {
        return "John";
    }
}

export class LocalPlayer implements Player {
    input: Input = {
        move: 0,
        jump: false,
        duck: false,
        lookAt: [0, 0],
        attack: false,
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
        if ('attack' in input) {
            this.input.attack = input.attack;
        }
    }

    getDisplayName() {
        return "Bob";
    }
}

}
