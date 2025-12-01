/* script.js
  - 直接貼到 CodePen JS 欄位或放在同一目錄下與 index.html 一起部署
  - 會 fetch API: https://freeweather.zeabur.app/api/weather/all
*/

/* --------------------
   Config / City coords
   --------------------
   我這裡放入 22 個縣市的近似中心經緯度（用於將使用者的地理位置匹配到最接近的縣市）
   若你想提高精準度，可替換為更細的邊界資料。
*/
const CITY_COORDS = {
  "基隆市": [25.128,121.739],
  "臺北市": [25.033,121.565],
  "新北市": [25.016,121.462],
  "桃園市": [24.993,121.300],
  "新竹市": [24.803,120.967],
  "新竹縣": [24.838,121.028],
  "苗栗縣": [24.559,120.822],
  "臺中市": [24.147,120.673],
  "彰化縣": [24.055,120.538],
  "南投縣": [23.838,120.987],
  "雲林縣": [23.707,120.389],
  "嘉義市": [23.480,120.449],
  "嘉義縣": [23.460,120.241],
  "臺南市": [23.000,120.227],
  "高雄市": [22.627,120.301],
  "屏東縣": [22.676,120.487],
  "宜蘭縣": [24.702,121.737],
  "花蓮縣": [23.976,121.604],
  "臺東縣": [22.757,121.144],
  "澎湖縣": [23.566,119.583],
  "金門縣": [24.432,118.318],
  "連江縣": [26.159,119.941]
};

/* UI Elements */
const apiUrl = 'https://freeweather.zeabur.app/api/weather/all';
const citySelect = document.getElementById('citySelect');
const refreshBtn = document.getElementById('refreshBtn');
const cityNameEl = document.getElementById('cityName');
const updateTimeEl = document.getElementById('updateTime');
const mainIconEl = document.getElementById('mainIcon');
const tempBigEl = document.getElementById('tempBig');
const tempRangeEl = document.getElementById('tempRange');
const comfortEl = document.getElementById('comfort');
const forecastGrid = document.getElementById('forecastGrid');
const rainProbEl = document.getElementById('rainProb');
const windSpeedEl = document.getElementById('windSpeed');
const adviceEl = document.getElementById('advice');

/* local state */
let allData = [];
let currentCity = null;

/* ----------------------
   Utility: distance Haversine
   ---------------------- */
function deg2rad(d){ return d * Math.PI / 180; }
function haversine(lat1, lon1, lat2, lon2){
  const R = 6371; // km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ----------------------
   Fetch API and populate
   ---------------------- */
async function fetchWeather(){
  try{
    const res = await fetch(apiUrl);
    if(!res.ok) throw new Error('API fetch error');
    const json = await res.json();
    if(!json.success) throw new Error('API returned no success');
    allData = json.data || [];
    populateCitySelect(allData);
    return allData;
  }catch(err){
    console.error(err);
    alert('無法取得天氣資料，請稍後再試。');
  }
}

/* Populate dropdown from API response (保證 22 筆) */
function populateCitySelect(data){
  const cityNames = data.map(d => d.city);
  // Ensure all 22 city options (use CITY_COORDS keys order)
  const ordered = Object.keys(CITY_COORDS).filter(c => cityNames.includes(c));
  citySelect.innerHTML = ordered.map(c => `<option value="${c}">${c}</option>`).join('');
}

/* ----------------------
   Select nearest city by geolocation
   ---------------------- */
function pickNearestCity(lat, lon){
  let best = null;
  let bestDist = Infinity;
  for(const city in CITY_COORDS){
    const [cyLat, cyLon] = CITY_COORDS[city];
    const d = haversine(lat, lon, cyLat, cyLon);
    if(d < bestDist){
      bestDist = d;
      best = city;
    }
  }
  return best;
}

/* ----------------------
   Map weather description to an icon (簡易)
   ---------------------- */
function weatherToIcon(desc){
  desc = (desc || '').toLowerCase();
  if(desc.includes('晴')) return '☀️';
  if(desc.includes('雨') || desc.includes('陣雨') || desc.includes('短暫雨')) return '🌧️';
  if(desc.includes('陰')) return '☁️';
  if(desc.includes('多雲')) return '⛅';
  if(desc.includes('雷')) return '⛈️';
  if(desc.includes('雪')) return '❄️';
  return '🌫️';
}

/* ----------------------
   Render UI for selected city
   ---------------------- */
function renderCity(city){
  const record = allData.find(d => d.city === city);
  if(!record){
    cityNameEl.textContent = city + '（無資料）';
    return;
  }
  currentCity = city;
  cityNameEl.textContent = record.city;
  updateTimeEl.textContent = record.updateTime || '';

  // Choose the first forecast block as "current landing" and present a summary;
  // The API returns 3 forecast blocks; we'll show the first block prominently and all three in grid
  const forecasts = record.forecasts || [];
  const main = forecasts[0] || {};
  const minT = main.minTemp || '--';
  const maxT = main.maxTemp || '--';
  const weather = main.weather || '';
  const rain = main.rain || '--';
  const comfort = main.comfort || '';

  mainIconEl.textContent = weatherToIcon(weather);
  tempBigEl.textContent = maxT.replace('°C','') + '°C';
  tempRangeEl.textContent = `${minT} — ${maxT}`;
  comfortEl.textContent = comfort;
  rainProbEl.textContent = rain;
  windSpeedEl.textContent = main.windSpeed || '—';

  // advice (very simple rule-based)
  let adv = '';
  const rainNum = parseInt(rain) || 0;
  if(rainNum >= 60) adv = '外出請攜帶雨具，路面注意溼滑。';
  else if(rainNum >= 30) adv = '偶有短時雨，外出建議帶輕便雨具。';
  else adv = '天氣穩定，適合外出活動。';

  // temperature-based dressing suggestion
  const maxTempNum = parseInt(maxT) || 999;
  if(maxTempNum <= 15) adv += ' 氣溫偏低，建議多穿一件外套。';
  else if(maxTempNum <= 20) adv += ' 晚間或早晨稍涼，建議備件薄外套。';
  else adv += ' 溫暖舒適，輕鬆外出即可。';

  adviceEl.textContent = adv;

  // Forecast grid (show three blocks)
  forecastGrid.innerHTML = '';
  forecasts.slice(0,3).forEach(f => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    const start = f.startTime ? f.startTime.replace(' ','\n') : '';
    card.innerHTML = `
      <h4>${f.startTime ? f.startTime.split(' ')[0] : ''}</h4>
      <div class="fw">${weatherToIcon(f.weather)} ${f.weather || '—'}</div>
      <div class="small">降雨: ${f.rain || '—'} &nbsp; 溫度: ${f.minTemp || '—'} / ${f.maxTemp || '—'}</div>
      <div class="small">舒適度: ${f.comfort || '—'}</div>
    `;
    forecastGrid.appendChild(card);
  });

  // set selected option
  if(citySelect.value !== city) citySelect.value = city;
}

/* ----------------------
   Init: get data & geolocate
   ---------------------- */
async function init(){
  await fetchWeather();

  // Try geolocation
  if('geolocation' in navigator){
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const nearest = pickNearestCity(lat, lon);
      if(allData && allData.length){
        const avail = allData.map(d=>d.city);
        const target = avail.includes(nearest) ? nearest : (avail.includes('臺北市') ? '臺北市' : avail[0]);
        renderCity(target);
      }
    }, err => {
      // permission denied or error -> fallback to Taipei if available
      const target = (allData.find(d => d.city === '臺北市') ? '臺北市' : (allData[0] && allData[0].city));
      renderCity(target);
    }, {timeout:7000});
  }else{
    const target = (allData.find(d => d.city === '臺北市') ? '臺北市' : (allData[0] && allData[0].city));
    renderCity(target);
  }
}

/* Event listeners */
citySelect.addEventListener('change', (e) => {
  renderCity(e.target.value);
});

refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '↻';
  await fetchWeather();
  // Re-render current city if exists
  if(currentCity) renderCity(currentCity);
  refreshBtn.disabled = false;
  refreshBtn.textContent = '⟳';
});

/* Run */
init();
