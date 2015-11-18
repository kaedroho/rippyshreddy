module.exports = {
    context: __dirname + "/build",
    entry: "./server",
    output: {
        path: __dirname + "/dist",
        filename: "rs-server-[hash].js"
    }
}
