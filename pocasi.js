const showError = (inputId, message) => {
  const newSpan = document.createElement("span");
  newSpan.innerText = message;
  document.getElementById(inputId).parentElement.appendChild(newSpan);
};
const print = (message) => {
  document.getElementById("text").value += `${typeof message === "string" ? message : JSON.stringify(message, null, 2)}`;
};
window.document.getElementById("form").addEventListener("submit", (evt) => {
  evt.preventDefault(); // do event listeneru předá jako parametr tu eventu (evt) a zde jí zabrání tomu, co by normálně dělal formulář při submit
});
window.document.getElementById("pocasi").addEventListener("click", async () => {
// window.document.getElementById("pocasi").addEventListener("click", function (event) {
  // clear("text");
  document.getElementById("text").value = "";
  const formData = new FormData(window.document.getElementById("form"));
  const text = formData.get("mesta")?.trim(); // už tady trimovat, kdyby uživatel zadal tři mezery, tak aby následně ukázal chybu

  if (!text) {
    showError("mesta", "Zadej města!");
    return;
  }
  // let inputText = document.getElementById("text").value;
  // let poleMest = text.split(";").map((item) => item.trim()); // map() slouží k vytvoření nového pole tak, že projde každou položku původního pole a aplikuje na ni funkci, kterou jí předáš.
  let poleMest = text.split(";");
  if (poleMest.length > 3) {
    showError("mesta", "To je moc. Max tři města!");
    return;
  }
  const poleMest2 = new Set(poleMest);
  if (poleMest.length !== poleMest2.size) {
    showError("mesta", "Vidím, že minimálně dvě města jsou shodná!");
    return;
  }
  /* for (const mesto of poleMest2) {
    console.log(mesto);
    // let cityCoords = await getCityCoords(mesto);
  } */
  const poleMest3 = Array.from(poleMest2.values());
  // tady bylo try catch, v try byly obě await Promisy, ale není to potreba, protože vracíme vždy hodnotu, při chybě undefined
  // const allCoordinates = await Promise.all([getCityCoords(poleMest3[0] ?? null), getCityCoords(poleMest3[1] ?? null), getCityCoords(poleMest3[2] ?? null)]);
  // následná allSettled bude čekat na všechny tři promisy,spustí více promisů najednou a čeká na jejich dokončení, bez ohledu na to, zda byly splněny (fulfilled) nebo zamítnuty (rejected).nezastaví se při prvním selhání na rozdíl od Promise.all()
  // PŘI REJECTED VRACÍ METODA UNDEFINED, TO JE TŘEBA OŠETŘIT, ALE VŽDYCKY NĚCO VRACÍ
  // pomocí map projede položky pole, proto nebudou převáděny města, které tam nejsou,
  // např. když jedno město, nebude volat pro druhé a třetí funkci GetCoords
  const allCoordinates = await Promise.allSettled(poleMest3.map((mesto) => getCityCoords(mesto)));
  console.log(allCoordinates);

  // do okCoordinates se odfiltruje rejected a ty, co nemají hodnotu
  const okCoordinates = allCoordinates
    .filter((oneResult) => oneResult.status === "fulfilled" && oneResult.value) // tím se ošetří, když metoda vrátí uundefined
    .map((oneResult) => oneResult.value);

  // tady budou ty rejected
  // const failedCoordinates = allCoordinates.filter((oneResult) => oneResult.status === "rejected");
  // už nebude posílat do GetForecats undefined, takže nebude problém s destructoringem. Byl problé už v definici funkce v parametru, kdy měl rozložit souřadncie na lat a long
  // map to projíždí, do coordinates dává nové pole,do index index a volá pro každou položku pole getForecast s městem podle indexu
  await Promise.allSettled(okCoordinates.map((coordinates, index) => {
    return getForecast(coordinates, poleMest3[index]);
  }));
});

const getCityCoords = async (cityName) => {
  if (cityName) {
    console.log(cityName);
    console.log(cityName?.typeof);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=10&language=en&format=json`);
      if (!response.ok) {
        throw new Error(`Could not find location: status code ${response.status}`);
      }
      const jsonResponse = await response.json(); // rest api vraci text, tj. json, tato metoda udělá javascriptový objekt
      // print(jsonResponse);
      if (jsonResponse) {
        const x = jsonResponse.results?.[0];
        return { latitude: x.latitude, longitude: x.longitude };
        // print(`${latitude}, ${longitude}`);
      } else {
        print("data nejsou k dispozici");
        return undefined;
      }
    } catch (e) {
      // return ("Blbé v getCityCoords: " + e.message);
      print ("Blbé v getCityCoords: " + e.message); // metoda dfinovaná výše, vypíše v textarea
      return undefined;
    }
  }
};

const getForecast = async ({ latitude, longitude }, cityName) => {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`);
    if (!response.ok) {
      throw new Error(`Could not find forecast: status code ${response.status}`);
    }
    const jsonResponse = await response.json();

    const max = jsonResponse.daily.temperature_2m_max[0];
    const min = jsonResponse.daily.temperature_2m_min[0];
    const average = ((max + min) / 2).toFixed(2);
    // print ({ average: average + jsonResponse.daily_units.temperature_2m_max }); // funkce print napíše do textarea
    print(`Průměrná teplota pro ${cityName} je: ${average + jsonResponse.daily_units.temperature_2m_max}\n`);
    print(`Minimální teplota je: ${min + jsonResponse.daily_units.temperature_2m_max} a maximální teplota je: ${max + jsonResponse.daily_units.temperature_2m_max}\n`);// funkce print napíše do textarea
    // print({ max: max, min: min + jsonResponse.daily_units.temperature_2m_max }); // funkce print napíše do textarea
    return `Průměrná teplota pro ${cityName} je: ${average}\n`;
  } catch (e) {
    // return ("Blbé v getForecast: " + e.message);
    print("Blbé v getForecast: " + e.message);
    return undefined;
  }
};
