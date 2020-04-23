
import { Request, Response } from "express";
import { GOscraperWeather, obtenerPronosticoByIdCiudad } from "./repository";


export const getPronostico = async(req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    
    const { idCiudad } = req.params; 

    const pronosctico = await obtenerPronosticoByIdCiudad(Number.parseInt(idCiudad));

    res.status(200).send(pronosctico);

}

