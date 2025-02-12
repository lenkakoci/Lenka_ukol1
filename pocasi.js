const showError = (inputId, message) => {
  const newSpan = document.createElement("span");
  newSpan.innerText = message;
  document.getElementById(inputId).parentElement.appendChild(newSpan);
};
const print = (message) => {
  document.getElementById("text").value += `${typeof message === "string" ? message : JSON.stringify(message, null, 2)}`;
};

window.document.getElementById("pocasi").addEventListener("click", async () => {
// window.document.getElementById("pocasi").addEventListener("click", function (event) {
  // clear("text");
  const formData = new FormData(window.document.getElementById("form"));
  const text = formData.get("mesta");

  if (!text) {
    showError("mesta", "Zadej města!");
    return;
  }
  // let inputText = document.getElementById("text").value;
  let poleMest = text.split(";").map((item) => item.trim());
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
  try {
    const allCoordinates = await Promise.all([getCityCoords(poleMest3[0] ?? null), getCityCoords(poleMest3[1] ?? null), getCityCoords(poleMest3[2] ?? null)]);
    console.log(allCoordinates);
    if (allCoordinates.length === 0) {
      window.alert("Nevrátil žádné souřadnice");
    } else {
      await Promise.all([getForecast(allCoordinates[0] ?? null, poleMest3[0] ?? null), getForecast(allCoordinates[1] ?? null, poleMest3[1] ?? null), getForecast(allCoordinates[2] ?? null, poleMest3[2] ?? null)]);
    }
    // print (allCoordinates);
    // const cityCoords = await getCityCoords("Praha");
    // await getForecast(cityCoords);
  } catch (e) {
    window.alert("Blbé v GetElement by ID" + e.message);
  }
});

const getCityCoords = async (cityName) => {
  if (cityName) {
    console.log(cityName);
    console.log(cityName?.typeof); // proč píše undefined???????
    console.log("sdfs");
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
        return;
      }
    } catch (e) {
      // return ("Blbé v getCityCoords: " + e.message);
      window.alert("Blbé v getCityCoords: " + e.message); // vypíše v prohlížeči
    }
  }
};

const getForecast = async ({ latitude, longitude }, cityName) => {
  if (latitude && longitude && cityName) {
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
      print(`Průměrná teplota pro ${cityName} je: ${average}\n`);
      // print({ max: max, min: min + jsonResponse.daily_units.temperature_2m_max });
    } catch (e) {
      // return ("Blbé v getForecast: " + e.message);
      window.alert("Blbé v getForecast: " + e.message);
    }
  }
};
