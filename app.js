const express = require("express");
const exphbs = require('express-handlebars');

const app = express();
app.use(express.json());
const configRoutes = require("./routes");

configRoutes(app);

const port = 3000;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.listen(port, () => {
    console.log("The server is up and running !!!");
    console.log(`The routes are running on http://localhost:${port}`);
});