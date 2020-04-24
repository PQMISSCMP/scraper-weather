import cheerio from "cheerio";
import { PronosticoModel } from "./model";
import Telegraf from "telegraf";
import axios from "axios";
import * as pg from "./DB"

let regInsertados = 0;
const pool = pg.getPool();
const log = console.log;

/**
 * Consulta las ciudades a escrapear, realiza el scraping y luego envia data recuperada para persistir
 */
export const GOscraperWeather = async () => {
    try {
        log('SE INICIA EL PROCESO DE SCRAPING');
        log('* leyendo links...');
        let ciudades = await getLinksToScraping();
        if (!ciudades || ciudades.length === 0) return;
        await truncatePronosticos();
        for (const ciudad of ciudades) {
            const urlToScrap = `https://www.accuweather.com/en/cl/${ciudad.city}/${ciudad.id}/daily-weather-forecast/${ciudad.id}`;
            log(`* obteniendo html de ${ciudad.city}`);
            const { data: html } = await axios.get(urlToScrap);
            log(`* escrapeando ${ciudad .city} y persistiendo asincrono`);
            const selector = cheerio.load(html);
            const items = selector('.content-module .non-ad > a').toArray();
            items.slice(0, 7).map(async item => {
                const $item = selector(item);
                const pronostico: PronosticoModel = {
                    id: ciudad.id,
                    nombre: ciudad.city,
                    fecha: $item.find('.date > .sub').remove().text().replace(/[\n\t\r]/g, "").trim(),
                    minima: Number.parseInt($item.find('.temps > .low').text().replace(/[/°]/g, "").trim()),
                    maxima: Number.parseInt($item.find('.temps > .high').text().replace(/[°]/g, "").trim()),
                };
                insertNewPronostico(pronostico);
            });
        }
    } catch (error) {
        log(error.message);
    }

}



/**
 * Obtiene las ciudades a escrapear
 */
const getLinksToScraping = async () => {
    try {
        const { rows } = await pool.query("SELECT id, city from public.scrap_links");
        return rows;
    } catch (error) {
        log('[X] Error al obtener links, reintentando....');
        getLinksToScraping();
    }
}



/**
 * Elimina los datos previos ingresado de los pronosticos
 */
const truncatePronosticos = async () => {
    log('* Truncando datos de pronosticos');
    try {
        pool.query("truncate table public.scrap_pronosticos");
        return true;
    } catch (error) {
        log(`[X] ${error.message} error al truncar pronosticos, reintentando....`);
        truncatePronosticos();
    }
}



/**
 * @param pronostico 
 * Persiste en postgres los pronosticos de tiempos obtenidos del scraping
 */
const insertNewPronostico = async (pronostico: PronosticoModel) => {
    try {
        const text = 'INSERT INTO public.scrap_pronosticos("id_ciudad","nombre_ciudad", "fecha", "minima", "maxima") VALUES($1, $2, $3, $4, $5) RETURNING *'
        const values = [pronostico.id, pronostico.nombre, pronostico.fecha, pronostico.minima, pronostico.maxima];
        const { rowCount } = await pool.query(text, values);
        if (rowCount === 1) { regInsertados += 1; }
        if (regInsertados === 21) { log('SCRAPING FINALIZADO') };

    } catch (error) {
        log(`[X] ${error.message} error al insertar pronostico, reintentando...`);
        insertNewPronostico(pronostico);
    }
}



/**
 * @param idCiudad 
 * Obtiene el pronostico del tiempo para 7 dias dado una determinada ciudad 
 */
export const obtenerPronosticoByNombreCiudad = async (idCiudad: string) => {

    try {

        const query = {
            text: 'SELECT id_ciudad, "fecha", "minima", "maxima" from public.scrap_pronosticos where "nombre_ciudad" = $1',
            values: [idCiudad]
        }
        const { rows } = await pool.query(query);
        return rows.map(item => {
            return {
                id_ciudad: item.id_ciudad,
                fecha: `${item.fecha.split("/")[1]}/${item.fecha.split("/")[0]}`,
                minima: item.minima,
                maxima: item.maxima
            }
        }).sort((a, b) => Number.parseInt(a.fecha.replace("/", "")) - Number.parseInt(b.fecha.replace("/", "")));

    } catch (error) {
        log(`[X] ${error.message} error al obtener pronostico por ciudad`);
        await obtenerPronosticoByNombreCiudad(idCiudad);
    }
}



export const GOchatBot = () => {

    const bot = new Telegraf(process.env.BOT_TOKEN || '');

    bot.catch((err: any, ctx: any) => {
        console.error(`[X] Ooops, error capturado ${ctx.updateType}`, err)
    });

    bot.start((ctx) => ctx.reply('Bienvenido, obten conmigo información del Clima. Escribe /help para más información'));

    bot.help((ctx) => {
        ctx.reply('Escriba /clima para obtener información de clima.');
    });

    bot.on("voice", (ctx) => {
        ctx.reply('bien dicho');

    });


    bot.command('clima', async (ctx) => {

        let stringClima: string;
        const text = ctx.message?.text;
        if (text?.split(" ").length === 1) {
            ctx.reply('Para conocer el tiempo debes indicar tambien la ciudad');
        } else {

            const ciudad = text?.split(" ")[1] || '';
            const pronosticos = await obtenerPronosticoByNombreCiudad(ciudad) || [];
            if (pronosticos.length === 0) { ctx.reply(`No tenemos información del tiempo para ${tpUpperFirst(ciudad)}, intenta con otra ciudad.`); return }

            stringClima = `El pronostico del tiempo para la ciudad de ${tpUpperFirst(ciudad)} los siguientes siete dias es:\n`;
            for (const pronostico of pronosticos) {
                stringClima += `- para el día ${pronostico.fecha} la mínima es ${pronostico.minima}º y la máxima: ${pronostico.maxima}º \n`;
            }
            ctx.reply(stringClima);
        }

    });

    bot.launch();

    log('bot activado  🤖');

}

const tpUpperFirst = (ciudad: string) => {
    return ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
}