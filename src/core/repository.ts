import cheerio from "cheerio";
import { CiudadesModel, PronosticoModel } from "./model";
import { Pool } from "pg";
// const Telegraf = require('telegraf')
import Telegraf from "telegraf";
import axios from "axios";

// const pool = new Pool({
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT
// });

const pool = new Pool({
    user: 'test125',
    password: 'test125',
    host: 'srv.cimapm.com',
    database: 'test',
    port: 30410
});

export const GOscraperWeather = async () => {

    try {
        
        console.log('SE INICIA EL PROCESO DE SCRAPING');
        const ciudades = await getLinksToScraping();
        await truncatePronosticos();
        for (const ciudad of ciudades) {
            const urlToScrap = `https://www.accuweather.com/en/cl/${ciudad.city}/${ciudad.id}/daily-weather-forecast/${ciudad.id}`;
            // console.log(`obteniendo html de ${ciudad.city}`);
            setTimeout(() => console.log(`obteniendo html de ${ciudad.city}`), 1);
            const { data: html } = await axios.get(urlToScrap);
            const selector = cheerio.load(html);
            const items = selector('.content-module .non-ad > a').toArray();

            items.slice(0, 7).map(item => {
                const $item = selector(item);
                const pronostico: PronosticoModel = {
                    id: ciudad.id,
                    fecha: $item.find('.date > .sub').remove().text().replace(/[\n\t\r]/g, "").trim(),
                    minima: Number.parseInt($item.find('.temps > .low').text().replace(/[/°]/g, "").trim()),
                    maxima: Number.parseInt($item.find('.temps > .high').text().replace(/[°]/g, "").trim()),
                };
                insertNewPronostico(pronostico);
            })
        }

        // pool.end();

    } catch (error) {
        console.log(error);
    }
}

const truncatePronosticos = async (): Promise<boolean> => {
    // console.log('Intentando truncar pronosticos...');
    setTimeout(() => console.log('Intentando truncar pronosticos... '), 1);
    try {
        pool.query("truncate table public.scrap_pronosticos");
        return true;
    } catch (error) {
        throw new Error('error al truncar pronosticos');
    }
}


const insertNewPronostico = async (pronostico: PronosticoModel) => {
    const text = 'INSERT INTO public.scrap_pronosticos("idCiudad", "fecha", "minima", "maxima") VALUES($1, $2, $3, $4) RETURNING *'
    const values = [pronostico.id, pronostico.fecha, pronostico.minima, pronostico.maxima];
    const { rows } = await pool.query(text, values);
    
    setTimeout(() => console.log(rows), 1);
}

const getLinksToScraping = async (): Promise<CiudadesModel[]> => {
    // console.log('leyendo links...');
    setTimeout(() => console.log('leyendo links...'), 1);
    try {
        const { rows } = await pool.query("SELECT id, city from public.scrap_links");
        // console.log('links obtenidos ');
        setTimeout(() => console.log('links obtenidos  '), 1);
        return rows;
    } catch (error) {
        throw Error('Error al obtener links');
    }
}



export const obtenerPronosticoByIdCiudad = async (idCiudad: number) => {
    try {
        // console.log(id);
        const query =  {
            text: 'SELECT "fecha", "minima", "maxima" from public.scrap_pronosticos where "idCiudad" = $1',
            values: [idCiudad]
        }
        const { rows } = await pool.query(query);
        return rows;
    } catch (error) {
        throw new Error(error.message);
    }
}


export const GOchatBot = () => {

    const token = process.env.BOT_TOKEN || '1095194766:AAHxSor3ES1-KPGspPZHkryZmAURgHD9IFw';
    const bot = new Telegraf(token)
    
    bot.start((ctx) => ctx.reply('Welcome'))
    
    bot.help((ctx) => {
        ctx.reply('Hable para ver opciones o escriba /tiempo [CIUDAD] para obtener el tiempo.')
    })

    bot.on("voice", (ctx) => {
        ctx.reply('bien dicho')
    });

    bot.command('tiempo', (ctx) => {
        const ciudad = ctx.update.message?.text?.split(" ")[1].toLocaleLowerCase() || '';
        ctx.reply('te daremos el tiempo de '+ ciudad);
    });

    bot.launch()
    console.log('bot activado');

}