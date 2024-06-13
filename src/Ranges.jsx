import React, { useState, useEffect } from "react";
import { fetchRanges, updateRangeSettings } from "./api/api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import backgroundImage from './img/background4.webp';


const Ranges = () => {
  const [ranges, setRanges] = useState([]);
  const [selectedRange, setSelectedRange] = useState("");
  const [rangeName, setRangeName] = useState("");
  const [lowerLimit, setLowerLimit] = useState("");
  const [upperLimit, setUpperLimit] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const getRanges = async () => {
      try {
        const response = await fetchRanges();
        setRanges(response.data);
      } catch (error) {
        console.error("Failed to fetch ranges:", error);
      }
    };

    getRanges();

    // WebSocket connection setup
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update-range") {
        setRanges((prevRanges) =>
          prevRanges.map((range) =>
            range.range_id === data.range_id
              ? { ...range, lower_limit: data.lower_limit, upper_limit: data.upper_limit }
              : range
          )
        );
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed", event);
    };

    setWs(socket);

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const handleRangeChange = (event) => {
    const selected = ranges.find((range) => range.range_id === parseInt(event.target.value));
    setSelectedRange(event.target.value);
    if (selected) {
      setRangeName(selected.range_name);
      setLowerLimit(selected.lower_limit);
      setUpperLimit(selected.upper_limit);
    } else {
      setRangeName("");
      setLowerLimit("");
      setUpperLimit("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRange) {
      alert("Please select a range to update.");
      return;
    }
    try {
      await updateRangeSettings(selectedRange, {
        range_name: rangeName,
        lower_limit: lowerLimit,
        upper_limit: upperLimit,
      });
      alert("Range settings updated successfully!");
    } catch (error) {
      console.error("Failed to update range settings:", error);
      alert("Failed to update range settings.");
    }
  };

  return (
    <div className="ranges">
      <Header />
      <div className="ranges-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <h1>Update Range Settings</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="rangeSelect">Select Range:</label>
            <select id="rangeSelect" value={selectedRange} onChange={handleRangeChange}>
              <option value="">--Select Range--</option>
              {ranges.length > 0 ? (
                ranges.map((range) => (
                  <option key={range.range_id} value={range.range_id}>
                    {range.range_name}
                  </option>
                ))
              ) : (
                <option value="">No ranges available</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="lowerLimit">Lower Limit:</label>
            <input
              type="number"
              id="lowerLimit"
              value={lowerLimit}
              onChange={(e) => setLowerLimit(e.target.value)}
              required
              disabled={!selectedRange}
            />
          </div>
          <div>
            <label htmlFor="upperLimit">Upper Limit:</label>
            <input
              type="number"
              id="upperLimit"
              value={upperLimit}
              onChange={(e) => setUpperLimit(e.target.value)}
              required
              disabled={!selectedRange}
            />
          </div>
          <button className="button" type="submit" disabled={!selectedRange}>Update Range</button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Ranges;
