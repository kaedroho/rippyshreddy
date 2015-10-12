module RippyShreddy {
    export type Context2D = CanvasRenderingContext2D;
    export type Vector2 = [number, number];

    export interface CollisionResult {
        position: Vector2;
        normal: Vector2;
    }
}
