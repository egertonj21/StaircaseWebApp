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
    let connection;
    try {
        // MySQL connection setup
        connection = await createConnection();

        // Define all routes that require DB connection inside here
        app.get("/sensors", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT sensor_ID, sensor_name FROM sensor");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch sensors");
            }
        });

        app.get("/actions", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT action_ID, sensor_ID, range_ID, note_ID FROM action_table");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch actions");
            }
        });

        app.get("/ranges", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT range_ID, range_name, lower_limit, upper_limit FROM sensor_range");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch ranges");
            }
        });

        app.get("/notes", async (req, res) => {
            try {
                const [rows] = await connection.execute("SELECT note_ID, note_name, note_location FROM note");
                res.json(rows);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch notes");
            }
        });

        app.get("/note-details/:sensor_ID/:range_ID", async (req, res) => {
            try {
                const { sensor_ID, range_ID } = req.params;
                const [rows] = await connection.execute(
                    `SELECT n.note_ID, n.note_name, n.note_location
                     FROM note n
                     JOIN action_table a ON n.note_ID = a.note_ID
                     WHERE a.sensor_ID = ? AND a.range_ID = ?`,
                    [sensor_ID, range_ID]
                );
                res.json(rows[0]);
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch note details");
            }
        });

        app.post("/log-sensor-data", async (req, res) => {
            const { sensor_ID, distance } = req.body;
            try {
                await connection.execute("INSERT INTO input (sensor_ID, distance, timestamp) VALUES (?, ?, NOW())", [sensor_ID, distance]);
                
                // Fetch the latest sensor logs and broadcast to WebSocket clients
                const [rows] = await connection.execute(
                    `SELECT i.sensor_ID, s.sensor_name, i.distance, i.timestamp 
                     FROM input i 
                     JOIN sensor s ON i.sensor_ID = s.sensor_ID
                     ORDER BY i.timestamp DESC
                     LIMIT 10`
                );
                broadcast(rows);

                res.status(200).send("Sensor data logged successfully");
            } catch (error) {
                console.error("Failed to log sensor data:", error);
                if (!res.headersSent) {
                    res.status(500).send("Failed to log sensor data");
                }
            }
        });

        app.get("/selected-output/:sensor_ID", async (req, res) => {
            const { sensor_ID } = req.params;
            try {
                const [rows] = await connection.execute(
                    `SELECT at.range_ID, at.note_ID, at.sensor_ID
                     FROM action_table at
                     WHERE at.sensor_ID = ?`,
                    [sensor_ID]
                );
                if (rows.length > 0) {
                    res.json(rows);
                } else {
                    res.status(404).send("No settings found for this sensor");
                }
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to fetch selected outputs");
            }
        });

        app.post("/selected-output/:sensor_ID", async (req, res) => {
            const { sensor_ID } = req.params;
            const { range_outputs } = req.body;
            
            if (!sensor_ID || !Array.isArray(range_outputs)) {
                return res.status(400).send("Invalid input data");
            }
        
            try {
                // Delete existing entries for the sensor
                const deleteResult = await connection.execute(
                    "DELETE FROM action_table WHERE sensor_ID = ?",
                    [sensor_ID]
                );
                console.log(`Deleted ${deleteResult[0].affectedRows} rows for sensor ID ${sensor_ID}`);
        
                // Insert new entries for the sensor if there are any range outputs specified
                if (range_outputs.length > 0) {
                    const insertPromises = range_outputs.map(output => {
                        if (output.range_ID && output.note_ID) { // Ensure that range_ID and note_ID are provided
                            return connection.execute(
                                "INSERT INTO action_table (sensor_ID, range_ID, note_ID) VALUES (?, ?, ?)",
                                [sensor_ID, output.range_ID, output.note_ID]
                            );
                        }
                        return Promise.reject(new Error("Missing range_ID or note_ID in some outputs"));
                    });
        
                    const insertResults = await Promise.all(insertPromises);
                    insertResults.forEach((result, index) => {
                        console.log(`Inserted row for range_ID ${range_outputs[index].range_ID} with note_ID ${range_outputs[index].note_ID}`);
                    });
                }
        
                res.send("Selected outputs updated successfully");
            } catch (error) {
                console.error("Failed to update selected outputs:", error);
                res.status(500).send("Failed to update selected outputs");
            }
        });

        app.get("/logs", async (req, res) => {
            try {
                const [rows] = await connection.execute(
                    `SELECT i.sensor_ID, s.sensor_name, i.distance, i.timestamp 
                     FROM input i 
                     JOIN sensor s ON i.sensor_ID = s.sensor_ID
                     ORDER BY i.timestamp DESC
                     LIMIT 20`
                );
                res.json(rows);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                res.status(500).send("Failed to fetch logs");
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } catch (error) {
        console.error("Failed to initialize:", error);
    }
};

init();

const broadcast = (message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

export { broadcast };
