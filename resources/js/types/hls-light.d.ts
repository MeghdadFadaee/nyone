// this well reduces hls-vendor from +500KB to +300KB n builds

declare module 'hls.js/light' {
    import Hls from 'hls.js';

    export * from 'hls.js';
    export default Hls;
}
