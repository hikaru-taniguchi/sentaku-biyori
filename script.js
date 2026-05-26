const city = "Sapporo";

function getApiKey() {
  const saved = localStorage.getItem("openweather_api_key");
  if (saved) return saved;

  const input = window.prompt(
    "OpenWeather APIキーを入力してください（初回のみ保存されます）"
  );

  if (!input) return null;

  const apiKey = input.trim();
  if (!apiKey) return null;

  localStorage.setItem("openweather_api_key", apiKey);
  return apiKey;
}

function showError(message) {
  document.getElementById("result").innerHTML = `
    <div class="error-box">
      <h2>⚠️ データ取得に失敗しました</h2>
      <p>${message}</p>
      <p>APIキーを修正する場合は、ブラウザの LocalStorage から <code>openweather_api_key</code> を削除してください。</p>
    </div>
  `;
}

async function getForecast() {
  const apiKey = getApiKey();

  if (!apiKey) {
    showError("APIキーが未入力です。ページを再読み込みして入力してください。");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=ja&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data?.list || data.cod !== "200") {
      const msg = data?.message || "OpenWeather API からエラー応答が返されました。";
      throw new Error(msg);
    }

    const forecasts = data.list.slice(0, 8);

    let bestTime = null;
    let bestScore = -1;
    let html = `<h2>📅 今日のセンタク予報</h2><div class="forecast-grid">`;

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
  } catch (error) {
    showError(`原因: ${error.message}`);
  }
}

function calcDryScore(temp, humidity, wind, rainProb) {
  const score = temp * 2 + wind * 3 - humidity * 0.8 - rainProb * 0.5 + 60;
  return Math.max(0, Math.min(100, Math.round(score)));
}

getForecast();
