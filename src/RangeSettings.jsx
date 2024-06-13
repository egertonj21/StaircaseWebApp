import React, { useState, useEffect } from "react";
import { fetchRanges, updateRangeSettings } from "../api/api";

const RangeSettings = () => {
  const [ranges, setRanges] = useState([]);
  const [selectedRange, setSelectedRange] = useState("");
  const [lowerLimit, setLowerLimit] = useState("");
  const [upperLimit, setUpperLimit] = useState("");

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
  }, []);

  const handleRangeChange = (event) => {
    const selected = ranges.find((range) => range.range_id === parseInt(event.target.value));
    setSelectedRange(event.target.value);
    setLowerLimit(selected.lower_limit);
    setUpperLimit(selected.upper_limit);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateRangeSettings(selectedRange, {
        range_name: ranges.find((range) => range.range_id === parseInt(selectedRange)).range_name,
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
    <div>
      <h1>Update Range Settings</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="rangeSelect">Select Range:</label>
          <select id="rangeSelect" value={selectedRange} onChange={handleRangeChange}>
            <option value="">--Select Range--</option>
            {ranges.map((range) => (
              <option key={range.range_id} value={range.range_id}>
                {range.range_name}
              </option>
            ))}
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
          />
        </div>
        <button type="submit">Update Range</button>
      </form>
    </div>
  );
};

export default RangeSettings;
