// create basic server to server the files in the root directory
const express = require("express")

const app = express()

app.use(express.static("./"))

app.listen(5000, () => {
    console.log("Server is running on port 5000")
})



