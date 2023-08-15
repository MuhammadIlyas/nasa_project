const axios = require('axios');
const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const SPACE_X_URL = 'https://api.spacexdata.com/v4/launches/query';

//const launches =  new Map();

let DEFAULT_FLIGHT_NUMBER = 100;

// const launch = {
//     flightNumber: DEFAULT_FLIGHT_NUMBER,
//     mission: 'Kepler Explortion X',
//     rocket: 'Explorer ISI',
//     launchDate: new Date('December 27, 2030'),
//     target: 'Kepler-442 b',
//     customers: ['ZTM, NASA'],
//     upcoming: true,
//     success: true,
// }

//launches.set(launch.flightNumber, launch);

async function getLatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function saveLaunch(launch) {
  // const planet = await planets.findOne({
  //     keplerName: launch.target,
  // });

  // if (!planet) {
  //     throw new Error('No Matching Planet found');
  // }

  await launches.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}

async function populateSpaceXLaunches() {
  const response = await axios.post(SPACE_X_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers: customers,
    };

    await saveLaunch(launch);
  }
}

async function loadSpaceXLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch Data already loaded");
  } else {
    await populateSpaceXLaunches();
  }
}
async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function getAllLaunches(skip, limit) {
  //return Array.from(launches.values());
  return await launches
    .find(
      {},
      {
        _id: 0,
        __v: 0,
      }
    )
    .sort({flightNumber: -1})
    .skip(skip)
    .limit(limit);
}

async function addNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No Matching Planet found");
  }

  const flightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    flightNumber: flightNumber,
    upcoming: true,
    success: true,
    customers: ["ZTM, NASA"],
  });
  await saveLaunch(newLaunch);
}

//function addNewLaunch(launch) {
// DEFAULT_FLIGHT_NUMBER ++;

// launches.set(DEFAULT_FLIGHT_NUMBER, Object.assign(launch, {
//     flightNumber: DEFAULT_FLIGHT_NUMBER,
//     upcoming: true,
//     success: true,
//     customers: ['ZTM, NASA'],
// }));
//}

// function abortLaunchById(launchId) {
//     const aborted =  launches.get(launchId);
//     aborted.upcoming = false;
//     aborted.success = false;

//     return aborted;
// }

async function abortLaunchById(launchId) {
  const aborted = await launches.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.modifiedCount === 1;
}

module.exports = {
  getAllLaunches,
  addNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
  loadSpaceXLaunchesData,
};
