module RippyShreddy {

export module Assets {
    var assets = [];
    var assetLock = false;

    export class Asset {
        constructor() {
            if (assetLock) {
                throw "Cannot load asset. Asset lock set."
            }

            assets.push(this);
        }

        load(baseURL: string, callback: () => void) { }
    }

    export class ImageAsset extends Asset {
        private src: string;
        public image: HTMLImageElement;

        constructor(src: string) {
            super();

            this.src = src;
            this.image = null;
        }

        load(baseURL: string, callback: () => void) {
            this.image = new Image();
            this.image.src = baseURL + this.src;
            this.image.onload = callback;
        }
    }

    export function loadAssets(baseURL: string, updateProgress: (totalAssets: number, assetsLoaded: number) => void) {
        if (assetLock) {
            throw "Assets already loaded.";
        }

        // Set assetLock to prevent any more assets being added
        assetLock = true;

        var assetsLoaded = 0;

        for (var i = 0; i < assets.length; i++) {
            var asset = assets[i];
            asset.load(baseURL, function() {
                assetsLoaded++;
                updateProgress(assets.length, assetsLoaded);
            });
        }
    }
}

}
