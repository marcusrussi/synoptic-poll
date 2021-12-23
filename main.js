import fetch from 'node-fetch'
import _ from 'lodash'

const {
  SYNOPTIC_KEY,
  MOLECULE_TOKEN,
  MOLECULE_ENDPOINT
} = process.env

function postObservation(obs) {
  return fetch(MOLECULE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MOLECULE_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(obs)
  })
}

function extractObservation(json) {
  const obs        = json.STATION[0].OBSERVATIONS
  const station_id = json.STATION[0].STID

  const time = obs.wind_gust_value_1.date_time

  const re = /_value_1d?$/
  const conciseobs = _.map(
    obs,
    ({value}, metric) => [re[Symbol.replace](metric, ''), value]
  )

  return {
    time,
    station_id,
    ...Object.fromEntries(conciseobs)
  }
}

function fetchLatest(station, apiKey) {
  var url = new URL("https://api.synopticdata.com/v2/stations/latest")

  const params = {
    token: apiKey,
    units: 'english',
    within: 30,
    stid: station
  }

  url.search = new URLSearchParams(params).toString()

  return fetch(url).then(d => d.json())
}

async function loadLatest() {
  console.log("  Fetching from Synoptic")
  const latestSynoptic = await fetchLatest("VTBLG", SYNOPTIC_KEY)
  console.log("  ...complete")

  const readyForMolecule = extractObservation(latestSynoptic)

  console.log("  POSTing:")
  console.log(readyForMolecule)

  return await postObservation(readyForMolecule)
}

const interval = setInterval(loadLatest, 5 * 60 * 1000)

process.on("SIGINT", function () {
  clearInterval(interval);
  process.exit(0);
});

process.on("SIGTERM", function () {
  clearInterval(interval);
  process.exit(0);
});
