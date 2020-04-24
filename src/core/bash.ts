import { GOscraperWeather } from "./repository";

setInterval(async() => {
    await GOscraperWeather();
}, 60 * 60000 * 24);


(async _ => {
    await GOscraperWeather();
})();
