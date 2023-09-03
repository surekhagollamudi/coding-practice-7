const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const getStates = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const getDistricts = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const statesList = `
           SELECT 
               *
           FROM 
              state;`;

  const stateArray = await db.all(statesList);
  response.send(stateArray.map((eachState) => getStates(eachState)));
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const singleState = `
            SELECT *
            FROM 
               state
            WHERE 
               state_id = ${stateId};`;

  const result = await db.all(singleState);
  response.send(getStates(result));
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const districtList = `
                INSERT INTO
                 district(district_name, state_id, cases, cured, active, deaths)
                 VALUES
                 (
                     '${districtName}',
                     '${stateId}',
                     '${cases}',
                     '${cured}',
                     '${active}',
                     '${deaths}'
                 );`;

  const districtArray = await db.run(districtList);
  const newDistrict = districtArray.lastId;
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const districtArray = `
             SELECT *
             FROM district 
             WHERE 
                district_id = ${districtId};`;

  const districtList = await db.all(districtArray);
  response.send(getDistricts(districtList));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
         DELETE FROM district
         WHERE 
            district_id = ${districtId};`;

  const result = await db.run(deleteDistrict);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `
              UPDATE district
              SET 
                 district_name = '${districtName}',
                 state_id = ${stateId},
                 cases = ${cases},
                 cured = ${cured},
                 active = ${active},
                 deaths = ${deaths}
              WHERE district_id = ${districtId};`;

  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const stateStats = `
           SELECT 
               SUM(cases),
               SUM(cured),
               SUM(active),
               SUM(deaths)
            FROM district
            WHERE 
               state_id = ${stateId};`;

  const stats = await db.all(stateStats);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured"],
    totalActive: stats["SUM(active"],
    totalDeaths: stats["SUM(deaths"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  try {
  } catch (e) {}

  const details = `
            SELECT 
               state_name
            FROM 
                state
                NATURAL JOIN district
            WHERE 
                 district_id = ${districtId};`;
  const stateName = await db.get(details);
  response.send(getDistricts(stateName));
});

module.exports = app;
