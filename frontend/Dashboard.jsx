import { useState } from "react";
import "./Dashboard.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const components = Array.from({ length: 24 }, (_, i) => ({
  id: `C${String(i + 1).padStart(5, "0")}`,
}));

function generateNonHistoricalData(formData) {
  const finalTime = Number(formData.time) || 40;

  const chartEndTime = Math.ceil(finalTime / 10 ) * 10;

  const temperature = Number(formData.temperature) || 0;
  const voltage = Number(formData.voltage) || 0;
  const current = Number(formData.current) || 0;
  const stress = Number(formData.stress) || 0;

  const points = [];

  for (let time = 0; time <= chartEndTime; time += 10) {
    const progress =
      finalTime === 0 ? 1 : Math.min( time / finalTime,1);

    points.push({
      time,
      temperature: Number(
        (temperature * progress).toFixed(2)
      ),
      voltage: Number(
        (voltage * progress).toFixed(3)
      ),
      current: Number(
        (current * progress).toFixed(2)
      ),
      stress: Number(
        (stress * progress).toFixed(2)
      ),
    });
  }

  return points;
}

function App() {
  const [selectedComponent, setSelectedComponent] =
    useState("");

  const [formData, setFormData] = useState({
    component_id: "",
    time: "",
    temperature: "",
    voltage: "",
    current: "",
    stress: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendData, setTrendData] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const selectComponent = (id) => {
    setSelectedComponent(id);

    setFormData({
      ...formData,
      component_id: id,
    });

    setResult(null);
    setError("");
    setTrendData([]);
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);
    setTrendData([]);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            component_id: formData.component_id,
            time: Number(formData.time),
            temperature: Number(formData.temperature),
            voltage: Number(formData.voltage),
            current: Number(formData.current),
            stress: Number(formData.stress),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Prediction failed");
      }

      const data = await response.json();

      setResult(data);

      /*
        Historical data is returned by backend
        when available.
      */
      if (
        data.historical_data &&
        data.historical_data.length > 0
      ) {
        setTrendData(data.historical_data);
      } else {
        /*
          Non-historical input:
          create 0,10,20,30... hour trend
        */
        setTrendData(
          generateNonHistoricalData(formData)
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Backend connection failed. Please make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    trendData.length > 0
      ? trendData
      : generateNonHistoricalData(formData);

  const isHistorical =
    result?.historical_data?.length > 0;

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="navbar">

        <div className="brand-area">
          <h1>SmartBurn-AI</h1>

          <p>
            Intelligent Burn-in Anomaly Detection System
          </p>
        </div>

        <div className="backend-status">
          <span className="status-dot"></span>
          Backend Online
        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="dashboard">

        {/* ================= LEFT PANEL ================= */}

        <section className="left-panel">

          {/* ================= INPUT CARD ================= */}

          <section className="input-card">

            <h2>COMPONENT ANALYSIS</h2>

            <p className="description">
              Enter sensor measurements to analyze
              component health.
            </p>


            <form onSubmit={handlePredict}>

              <div className="input-grid">

                {/* COMPONENT */}

                <div className="input-group">

                  <label>
                    Component ID
                  </label>

                  <input
                    type="text"
                    name="component_id"
                    placeholder="Example: C00001"
                    value={formData.component_id}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* TIME */}

                <div className="input-group">

                  <label>
                    Time (hr)
                  </label>

                  <input
                    type="number"
                    name="time"
                    placeholder="Example: 120"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* TEMPERATURE */}

                <div className="input-group">

                  <label>
                    Temperature (°C)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="temperature"
                    placeholder="Example: 125.5"
                    value={formData.temperature}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* VOLTAGE */}

                <div className="input-group">

                  <label>
                    Voltage (V)
                  </label>

                  <input
                    type="number"
                    step="0.0001"
                    name="voltage"
                    placeholder="Example: 3.60"
                    value={formData.voltage}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* CURRENT */}

                <div className="input-group">

                  <label>
                    Current (mA)
                  </label>

                  <input
                    type="number"
                    step="0.001"
                    name="current"
                    placeholder="Example: 44.5"
                    value={formData.current}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* STRESS */}

                <div className="input-group">

                  <label>
                    Stress Value
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="stress"
                    placeholder="Example: 100"
                    value={formData.stress}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              <button
                type="submit"
                className="predict-btn"
                disabled={loading}
              >

                {loading
                  ? "ANALYZING..."
                  : "🔍 ANALYZE COMPONENT"}

              </button>

            </form>

          </section>


          {/* ERROR */}

          {error && (

            <div className="error-box">
              ⚠️ {error}
            </div>

          )}


          {/* ================= RESULT ================= */}

          {result && (

            <section className="result-card">

              <div className="result-header">

                <div>
                  <h2>ANALYSIS RESULT</h2>

                  <p>
                    Component diagnostic output
                  </p>
                </div>

                <div
                  className={`status ${
                    result.status?.toLowerCase()
                  }`}
                >
                  {result.status}
                </div>

              </div>


              {/* RESULT GRID */}

              <div className="result-grid">

                <div className="result-item">
                  <span>COMPONENT</span>
                  <strong>
                    {result.component_id}
                  </strong>
                </div>

                <div className="result-item">
                  <span>BURN-IN TIME</span>
                  <strong>
                    {formData.time} hr
                  </strong>
                </div>

                <div className="result-item">
                  <span>TEMPERATURE</span>
                  <strong>
                    {formData.temperature} °C
                  </strong>
                </div>

                <div className="result-item">
                  <span>VOLTAGE</span>
                  <strong>
                    {formData.voltage} V
                  </strong>
                </div>

                <div className="result-item">
                  <span>CURRENT</span>
                  <strong>
                    {formData.current} mA
                  </strong>
                </div>

                <div className="result-item">
                  <span>STRESS</span>
                  <strong>
                    {formData.stress}
                  </strong>
                </div>

                <div className="result-item">
                  <span>ANOMALY PROBABILITY</span>
                  <strong className="percentage">
                    {result.anomaly_probability}%
                  </strong>
                </div>

                <div className="result-item">
                  <span>OVERALL RISK</span>
                  <strong
                    className={`risk-${result.risk_level?.toLowerCase()}`}
                  >
                    {result.risk_level}
                  </strong>
                </div>

              </div>


              {/* ================= CHART ================= */}

              <div className="chart-section">

                <div className="chart-header">

                  <div>
                    <h2>
                      📈 SENSOR TREND ANALYSIS
                    </h2>

                    <p>
                      {isHistorical
                        ? "Historical sensor measurements"
                        : "Estimated trend generated from current input"}
                    </p>
                  </div>

                  <span className="chart-badge">
                    {isHistorical
                      ? "HISTORICAL"
                      : "ESTIMATED"}
                  </span>

                </div>


                <div className="chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={420}
                  >

                    <LineChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 25,
                        left: 10,
                        bottom: 25,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#dbe3ea"
                      />

                      <XAxis
                        dataKey={
                          isHistorical
                            ? "Time_hr"
                            : "time"
                        }
                        label={{
                          value: "Time (hours)",
                          position: "insideBottom",
                          offset: 0,
                        }}
                      />

                      <YAxis />

                      <Tooltip />

                      <Legend />


                      <Line
                        type="monotone"
                        dataKey={
                          isHistorical
                            ? "Temperature_C"
                            : "temperature"
                        }
                        name="Temperature (°C)"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />


                      <Line
                        type="monotone"
                        dataKey={
                          isHistorical
                            ? "Voltage_V"
                            : "voltage"
                        }
                        name="Voltage (V)"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />


                      <Line
                        type="monotone"
                        dataKey={
                          isHistorical
                            ? "Current_mA"
                            : "current"
                        }
                        name="Current (mA)"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />


                      <Line
                        type="monotone"
                        dataKey={
                          isHistorical
                            ? "Stress_Value"
                            : "stress"
                        }
                        name="Stress"
                        stroke="#9333ea"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* ================= EXPLANATION ================= */}

              <div className="explanation">

                <h3>
                  🔎 WHY WAS THIS PREDICTION MADE?
                </h3>

                {result.reasons &&
                result.reasons.length > 0 ? (

                  <ul>

                    {result.reasons.map(
                      (reason, index) => (

                        <li key={index}>
                          {reason}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    No specific abnormal condition
                    detected.
                  </p>

                )}

              </div>

            </section>

          )}

        </section>


        {/* ================= RIGHT PANEL ================= */}

        <section className="right-panel">

          <div className="diagnostic-title">
            COMPONENT DIAGNOSTICS
          </div>


          <div className="component-header">

            <div>

              <h1>
                {formData.component_id
                  ? formData.component_id
                  : "DUT-00"}
              </h1>

              <p>
                SATELLITE ELECTRONIC COMPONENT
              </p>

            </div>

            {result && (

              <div
                className={`status ${
                  result.status?.toLowerCase()
                }`}
              >
                {result.status}
              </div>

            )}

          </div>


          {/* SUMMARY */}

          <div className="summary-card">

            <h3>
              SELECTED COMPONENT
            </h3>

            <div className="summary-row">

              <span>
                Temperature
              </span>

              <b>
                {formData.temperature || "--"} °C
              </b>

            </div>


            <div className="summary-row">

              <span>
                Voltage
              </span>

              <b>
                {formData.voltage || "--"} V
              </b>

            </div>


            <div className="summary-row">

              <span>
                Current
              </span>

              <b>
                {formData.current || "--"} mA
              </b>

            </div>


            <div className="summary-row">

              <span>
                Stress
              </span>

              <b>
                {formData.stress || "--"}
              </b>

            </div>

          </div>


          {/* SYSTEM INFO */}

          <div className="info-card">

            <h3>SYSTEM MODE</h3>

            <div className="info-row">
              <span>Prediction</span>
              <b>ML MODEL</b>
            </div>

            <div className="info-row">
              <span>Data Mode</span>
              <b>
                {isHistorical
                  ? "HISTORICAL"
                  : "NON-HISTORICAL"}
              </b>
            </div>

            <div className="info-row">
              <span>Analysis</span>
              <b>REAL-TIME</b>
            </div>

          </div>

        </section>

      </main>


      <footer>
        SmartBurn-AI • Multi-Algorithm Anomaly Detection
           <p>It may makes mistake.</p>
      </footer>

    </div>
  );
}

export default App;