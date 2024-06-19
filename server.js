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
          `SELECT action_ID, sensor_id, close, note_id_1, mid, note_id_2, far, note_id_3
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

    // Fetch current settings for a selected sensor
    app.get("/selected-output/:sensor_id", async (req, res) => {
      const { sensor_id } = req.params;
      try {
        const [rows] = await connection.execute(
          `SELECT at.close, at.note_id_1, at.mid, at.note_id_2, at.far, at.note_id_3
            FROM action_table at
            WHERE at.sensor_id = ?`,
          [sensor_id]
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch selected outputs");
      }
    });

    // Update SelectedOutputs for all permutations
    app.post("/selected-output", async (req, res) => {
      const { sensor_id, range_outputs } = req.body;
      try {
        // Delete existing entries for the sensor
        await connection.execute(
          "DELETE FROM action_table WHERE sensor_id = ?",
          [sensor_id]
        );

        // Insert new entries for the sensor
        const queries = range_outputs.map((ro) =>
          connection.execute(
            "INSERT INTO action_table (sensor_id, close, note_id_1, mid, note_id_2, far, note_id_3) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [sensor_id, ro.close, ro.note_id_1, ro.mid, ro.note_id_2, ro.far, ro.note_id_3]
          )
        );

        await Promise.all(queries);

        // Broadcast updated outputs
        broadcast({ type: "update-outputs", sensor_id, range_outputs });

        res.send("Selected outputs updated successfully");
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update selected outputs");
      }
    });

    // Update range settings
    app.put("/range/:range_id", async (req, res) => {
      const { range_id } = req.params;
      const { range_name, lower_limit, upper_limit } = req.body;
      try {
        await connection.execute(
          "UPDATE sensor_range SET range_name = ?, lower_limit = ?, upper_limit = ? WHERE range_ID = ?",
          [range_name, lower_limit, upper_limit, range_id]
        );

        // Broadcast updated range
        broadcast({ type: "update-range", range_id, range_name, lower_limit, upper_limit });

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
