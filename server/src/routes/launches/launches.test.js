const request = require("supertest");
const app = require("../../app");
const { mongoConnect , mongoDisconnect} = require("../../services/mongo");

const {loadPlanetsData} = require("../../models/planets.model");
describe("Launches API", () => {
    beforeAll(async () => {
      await mongoConnect();
      await loadPlanetsData();
    }, 30000);
    afterAll(async () => {
      await mongoDisconnect();
    });

  describe("Test GET /launches", () => {
    test("It should return response with 200", async () => {
      const response = await request(app).get("/launches");
      expect(response.statusCode).toBe(200);
    });
  });

   describe("Test GET /launches", () => {
     test("It should return response with 200", async () => {
       const response = await request(app)
         .get("/launches")
         .expect(200)
         .expect("Content-Type", /json/);
     });
   });

   describe("Test POST /launches", () => {
     const launch = {
       mission: "ABC",
       rocket: "B",
       launchDate: "January 10, 2023",
       target: "kepler-62 f",
     };

     const launchWithoutDate = {
       mission: "ABC",
       rocket: "B",
       target: "kepler-62 f",
     };

     const launchWithInvalidDate = {
       mission: "ABC",
       rocket: "B",
       launchDate: "helo",
       target: "kepler-62 f",
     };

     test("It should return response with 201", async () => {
       const response = await request(app)
         .post("/launches")
         .send(launch)
         .expect(201)
         .expect("Content-Type", /json/);

       const requestDate = new Date(launch.launchDate).valueOf();
       const responseDate = new Date(response.body.launchDate).valueOf();

       expect(requestDate).toBe(responseDate);
       expect(response.body).toMatchObject = launchWithoutDate;
     });
     test("Catch missing required properties", async () => {
       const response = await request(app)
         .post("/launches")
         .send(launchWithoutDate)
         .expect(400)
         .expect("Content-Type", /json/);

       expect(response.body).toStrictEqual({
         error: "Missing required launch properties",
       });
     });

     test("Invalid Date", async () => {
       const response = await request(app)
         .post("/launches")
         .send(launchWithInvalidDate)
         .expect(400)
         .expect("Content-Type", /json/);

       expect(response.body).toStrictEqual({
         error: "Invalid launch date",
       });
     });
   });
});
