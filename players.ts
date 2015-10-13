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
        id: number;
        input: Input;
        getDisplayName(): string;
    }

    export class AIPlayer implements Player {
        id: number = null;
        input: Input = {
            move: 0,
            jump: false,
            duck: false,
            lookAt: [0, 0],
            attack: false,
        };

        constructor(id: number) {
            this.id = id;
        }

        getDisplayName() {
            return "John";
        }
    }

    export class LocalPlayer implements Player {
        id: number = null;
        input: Input = {
            move: 0,
            jump: false,
            duck: false,
            lookAt: [0, 0],
            attack: false,
        };

        constructor(id: number) {
            this.id = id;
        }

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
