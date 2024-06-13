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
          "SELECT id, sensorName FROM Sensors"
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch sensors");
      }
    });

    // Fetch available outputs
    app.get("/outputs", async (req, res) => {
      try {
        const [rows] = await connection.execute(
          "SELECT id, OutputName FROM Outputs"
        );
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch outputs");
      }
    });

    // Fetch available ranges
    app.get("/ranges", async (req, res) => {
      try {
        const [rows] = await connection.execute(
          "SELECT range_id, range_name, lower_limit, upper_limit FROM sensor_range"
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
          `SELECT so.range_id, sr.range_name, so.output_id, o.OutputName
            FROM SelectedOutputs so
            JOIN sensor_range sr ON so.range_id = sr.range_id
            JOIN Outputs o ON so.output_id = o.id
            WHERE so.sensor_id = ?`,
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
        await connection.execute(
          "DELETE FROM SelectedOutputs WHERE sensor_id = ?",
          [sensor_id]
        );

        const queries = range_outputs.map((ro) =>
          connection.execute(
            "INSERT INTO SelectedOutputs (sensor_id, range_id, output_id) VALUES (?, ?, ?)",
            [sensor_id, ro.range_id, ro.output_id]
          )
        );

        await Promise.all(queries);

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
          "UPDATE sensor_range SET range_name = ?, lower_limit = ?, upper_limit = ? WHERE range_id = ?",
          [range_name, lower_limit, upper_limit, range_id]
        );
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
          "SELECT SensorID, SensorName, ROUND(Distance, 1) AS Distance, Timestamp FROM SensorLogs"
        );
        ws.send(JSON.stringify(rows));
      } catch (error) {
        console.error(error);
      }

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
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export { broadcast };
