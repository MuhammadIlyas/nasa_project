const { parse } = require("csv-parse");
const fs = require("fs");
const path = require("path");

const planets = require("./planets.mongo");
//const habitablePlanets = [];
function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] == "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          //  await planets.create({
          //   keplerName: data.kepler_name,
          //  });
          // habitablePlanets.push(data);
          savePlanet(data);
        }
      })
      .on("end", async() => {
        resolve();
        const countPlanets = (await getAllPlanets()).length;
        //console.log(habitablePlanets.map((habitablePlanet) => {return habitablePlanet['kepler_name']}));
        console.log(`${countPlanets} habitable planets...`);
      })
      .on("error", (err) => {
        reject(err);
        //console.log(err);
      });
  });
}

async function getAllPlanets() {
  return await planets.find({});
  // return await planets.find({}, {
  //   _id: 0,
  //   __v:0,
  // });
}

async function savePlanet(planet) {
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      {
        keplerName: planet.kepler_name,
      },
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.log(err);
  }
}
module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
