import express from "express";
import { WebSocketServer } from "ws";
import { createConnection } from "./dbconfig.js";
import cors from "cors";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 });

const init = async () => {
  try {
    // MySQL connection setup
    const connection = await createConnection();

    // Fetch available sensors
    app.get("/sensors", async (req, res) => {
      try {
        const [rows] = await connection.execute(
          "SELECT sensor_ID, sensor_name FROM sensor"
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch sensors");
      }
    });

    // Fetch available actions (assuming outputs are derived from action_table)
    app.get("/actions", async (req, res) => {
      try {
        const [rows] = await connection.execute(
          `SELECT action_ID, sensor_ID, range_ID, note_ID
           FROM action_table`
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch actions");
      }
    });

    // Fetch available ranges
    app.get("/ranges", async (req, res) => {
      try {
        const [rows] = await connection.execute(
          "SELECT range_ID, range_name, lower_limit, upper_limit FROM sensor_range"
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch ranges");
      }
    });

    // Fetch available notes
    app.get("/notes", async (req, res) => {
      try {
        const [rows] = await connection.execute(
          "SELECT note_ID, note_name, note_location FROM note"
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch notes");
      }
    });

    // Fetch current settings for a selected sensor
    app.get("/selected-output/:sensor_ID", async (req, res) => {
      const { sensor_ID } = req.params;
      try {
        const [rows] = await connection.execute(
          `SELECT at.range_ID, at.note_ID, at.sensor_ID
           FROM action_table at
           WHERE at.sensor_ID = ?`,
          [sensor_ID]
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch selected outputs");
      }
    });

    // Update SelectedOutputs for all permutations
    app.post("/selected-output", async (req, res) => {
      const { sensor_ID, range_outputs } = req.body;
      try {
        // Ensure all necessary fields are present and not undefined
        if (!sensor_ID || !Array.isArray(range_outputs) || range_outputs.length === 0) {
          return res.status(400).send("Invalid input data");
        }

        // Delete existing entries for the sensor
        await connection.execute(
          "DELETE FROM action_table WHERE sensor_ID = ?",
          [sensor_ID]
        );

        // Insert new entries for the sensor
        const queries = range_outputs.map((ro) =>
          connection.execute(
            "INSERT INTO action_table (sensor_ID, range_ID, note_ID) VALUES (?, ?, ?)",
            [sensor_ID, ro.range_ID || null, ro.note_ID || null]
          )
        );

        await Promise.all(queries);

        // Broadcast updated outputs
        broadcast({ type: "update-outputs", sensor_ID, range_outputs });

        res.send("Selected outputs updated successfully");
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update selected outputs");
      }
    });

    // Update range settings
    app.put("/range/:range_ID", async (req, res) => {
      const { range_ID } = req.params;
      const { range_name, lower_limit, upper_limit } = req.body;
      try {
        if (!range_name || lower_limit === undefined || upper_limit === undefined) {
          return res.status(400).send("Invalid input data");
        }
        await connection.execute(
          "UPDATE sensor_range SET range_name = ?, lower_limit = ?, upper_limit = ? WHERE range_ID = ?",
          [range_name, lower_limit, upper_limit, range_ID]
        );

        // Broadcast updated range
        broadcast({ type: "update-range", range_ID, range_name, lower_limit, upper_limit });

        res.send("Range settings updated successfully");
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update range settings");
      }
    });

    wss.on("connection", async (ws) => {
      console.log("Client connected");

      // Send initial sensor logs to client
      try {
        const [rows] = await connection.execute(
          `SELECT i.sensor_ID, s.sensor_name, ROUND(i.distance, 1) AS distance, i.timestamp 
           FROM input i 
           JOIN sensor s ON i.sensor_ID = s.sensor_ID`
        );
        ws.send(JSON.stringify(rows));
      } catch (error) {
        console.error(error);
      }

      ws.on("message", (message) => {
        const data = JSON.parse(message);
        // Handle incoming WebSocket messages if needed
      });

      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
};

init();

// Broadcast function to send updates to all clients
const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

export { broadcast };
