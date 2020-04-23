import express from "express";
import {  getPronostico } from "./controller";

const app = express();

app.get('/pronosticos/:idCiudad', getPronostico);

export = app;
