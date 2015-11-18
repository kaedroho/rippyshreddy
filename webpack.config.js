module.exports = {
    context: __dirname + "/build",
    entry: "./rippyshreddy",
    output: {
        path: __dirname + "/dist",
        filename: "rs-[hash].js"
    }
}
