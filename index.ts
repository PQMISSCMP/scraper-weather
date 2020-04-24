require("dotenv").config();
import { GOchatBot, GOscraperWeather } from "./src/core/repository";

setInterval(async() => {
    await GOscraperWeather();
}, 60 * 60000 * 24);


(async _ => {
    GOchatBot();
    await GOscraperWeather();
})();


