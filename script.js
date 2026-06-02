const city = "Sapporo";

const sampleData = {
  list: [
    {
      dt: Math.floor(Date.now() / 1000),
      main: { temp: 22, humidity: 55 },
      wind: { speed: 3 },
      weather: [{ description: "晴れ", icon: "01d" }],
      pop: 0.1,
    },
    {
      dt: Math.floor(Date.now() / 1000) + 10800,
      main: { temp: 24, humidity: 50 },
      wind: { speed: 4 },
      weather: [{ description: "晴れ", icon: "01d" }],
      pop: 0.05,
    },
    {
      dt: Math.floor(Date.now() / 1000) + 21600,
      main: { temp: 21, humidity: 65 },
      wind: { speed: 2 },
      weather: [{ description: "くもり", icon: "03d" }],
      pop: 0.2,
    },
  ],
};

function getApiKey() {
  return localStorage.getItem("openweather_api_key");
}

function renderForecast(data, isDemo = false) {
  const forecasts = data.list.slice(0, 8);

  let bestTime = null;
  let bestScore = -1;
  let html = `<h2>📅 今日のセンタク予報</h2>`;

  if (isDemo) {
    html += `<p class="demo-note">※これはデモ用のサンプル天気データです。</p>`;
  }

  html += `<div class="forecast-grid">`;

  forecasts.forEach((f) => {
    const dateTime = new Date(f.dt * 1000).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
    });

    const temp = f.main.temp;
    const humidity = f.main.humidity;
    const wind = f.wind.speed;
    const weather = f.weather[0].description;
    const icon = f.weather[0].icon;
    const rainProb = f.pop * 100;

    const score = calcDryScore(temp, humidity, wind, rainProb);

    if (score > bestScore) {
      bestScore = score;
      bestTime = dateTime;
    }

    html += `
      <div class="forecast-item">
        <h3>${dateTime}</h3>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${weather}" class="weather-icon">
        <p>${weather}</p>
        <p><strong>${score}</strong> 点</p>
      </div>
    `;
  });

  html += `</div>`;
  document.getElementById("result").innerHTML = html;

  document.getElementById("summary-date").textContent =
    `📅 日付：${new Date().toLocaleDateString("ja-JP")}`;
  document.getElementById("summary-best").textContent =
    `☀️ ベスト時間帯：${bestTime}（スコア ${bestScore}）`;
}

async function getForecast() {
  const apiKey = getApiKey();

  if (!apiKey) {
    renderForecast(sampleData, true);
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=ja&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data?.list || data.cod !== "200") {
      throw new Error(data?.message || "OpenWeather APIからエラー応答が返されました。");
    }

    renderForecast(data);
  } catch (error) {
    renderForecast(sampleData, true);
  }
}

function calcDryScore(temp, humidity, wind, rainProb) {
  const score = temp * 2 + wind * 3 - humidity * 0.8 - rainProb * 0.5 + 60;
  return Math.max(0, Math.min(100, Math.round(score)));
}

getForecast();
