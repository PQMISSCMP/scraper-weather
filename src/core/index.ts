const express = require("express");
const app = express();
const rutas = require("./routes");

app.use(rutas);

const PORT = (process.env.PORT || 8000);

app.listen(PORT, () =>  console.log(`1-Iniciando servidor en puerto interno ${PORT}`) );
