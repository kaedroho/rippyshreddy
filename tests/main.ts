/// <reference path="test_maps.ts" />

declare var require: {
    (id: string): any;
    resolve(id:string): string;
    cache: any;
    extensions: any;
    main: any;
};

chai = require('chai');
