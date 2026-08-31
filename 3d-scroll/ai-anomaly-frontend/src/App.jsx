import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import BurnInMachine from "./components/BurnInMachine";
import ElectronicComponent from "./components/ElectronicComponent";

import "./index.css";

gsap.registerPlugin(ScrollTrigger);


// ======================================================
// SCROLL CONTROLLER
// ======================================================

function ScrollController({
  componentRef,
  machineRef,
  doorRef,
  heaterRef,
  graphPathRef,
  graphPointsRef,
  setTemperature,
  setBurnTime,
  setStatus,
  setCurrentValue,
  setAnomaly,
  setScrollProgress
}) {

  useEffect(() => {

    const component = componentRef.current;
    const machine = machineRef.current;
    const door = doorRef.current;
    const heater = heaterRef.current;

    const graphPath = graphPathRef.current;

    if (!component || !machine) {
      return;
    }


    // ==================================================
    // COMPONENT INITIAL STATE
    // ==================================================

    component.position.set(
      0,
      0,
      0
    );

    component.rotation.set(
      0,
      0,
      0
    );

    component.scale.set(
      0.7,
      0.7,
      0.7
    );


    // ==================================================
    // MACHINE INITIAL STATE
    // Completely below screen
    // ==================================================

    machine.position.set(
      0,
      -12,
      -2
    );

    machine.rotation.set(
      0,
      0,
      0
    );


    // ==================================================
    // DOOR
    // NO DOOR ANIMATION
    // ==================================================

    if (door) {

      door.position.set(
        0,
        0,
        0
      );

      door.rotation.set(
        0,
        0,
        0
      );

    }


    // ==================================================
    // HEATER INITIAL STATE
    // ==================================================

    if (heater) {

      heater.scale.set(
        0.01,
        0.01,
        0.01
      );

      if (heater.material) {

        heater.material.emissiveIntensity = 0;

      }

    }


    // ==================================================
    // GRAPH INITIAL STATE
    // ==================================================

    if (graphPath) {

      const length =
        graphPath.getTotalLength();

      graphPath.style.strokeDasharray =
        `${length}`;

      graphPath.style.strokeDashoffset =
        `${length}`;

    }


    // ==================================================
    // MAIN SCROLL TIMELINE
    // ==================================================

    const timeline = gsap.timeline({

      scrollTrigger: {

        trigger: ".page",

        start: "top top",

        end: "bottom bottom",

        scrub: 1,

        invalidateOnRefresh: true,

        onUpdate: (self) => {

          const progress =
            self.progress;


          setScrollProgress(
            progress
          );


          // ==========================================
          // TESTING START POINT
          // ==========================================

          const TEST_START = 0.63;


          // ==========================================
          // TEMPERATURE
          // ==========================================

          let temperature = 25;

          if (progress >= TEST_START) {
            temperature = 50;
          }

          if (progress >= 0.70) {
            temperature = 75;
          }

          if (progress >= 0.78) {
            temperature = 100;
          }

          if (progress >= 0.86) {
            temperature = 125;
          }

          setTemperature(
            temperature
          );


          // ==========================================
          // BURN-IN TIME
          // ==========================================

          let burnTime = "0h";

          if (progress >= TEST_START) {
            burnTime = "24h";
          }

          if (progress >= 0.70) {
            burnTime = "96h";
          }

          if (progress >= 0.82) {
            burnTime = "168h";
          }

          setBurnTime(
            burnTime
          );


          // ==========================================
          // LEAKAGE CURRENT
          // ==========================================

          let currentValue = 10;

          if (progress >= TEST_START) {
            currentValue = 12;
          }

          if (progress >= 0.70) {
            currentValue = 18;
          }

          if (progress >= 0.80) {
            currentValue = 27;
          }

          if (progress >= 0.90) {
            currentValue = 45;
          }

          setCurrentValue(
            currentValue
          );


          // ==========================================
          // SYSTEM STATUS
          // ==========================================

          let status =
            "COMPONENT READY";


          if (progress >= 0.30) {

            status =
              "COMPONENT ANALYSIS";

          }


          if (progress >= 0.43) {

            status =
              "PREPARING BURN-IN TEST";

          }


          if (progress >= TEST_START) {

            status =
              "BURN-IN TEST STARTED";

          }


          if (progress >= 0.75) {

            status =
              "PARAMETER DRIFT DETECTED";

          }


          if (progress >= 0.90) {

            status =
              "AI ANOMALY DETECTED";

          }


          setStatus(
            status
          );


          // ==========================================
          // AI ANOMALY
          // ==========================================

          setAnomaly(
            progress >= 0.90
          );


          // ==========================================
          // GRAPH
          // ==========================================

          if (graphPath) {

            const length =
              graphPath.getTotalLength();


            const graphProgress =
              Math.max(
                0,
                Math.min(
                  1,
                  (progress - TEST_START) /
                  (1 - TEST_START)
                )
              );


            const offset =
              length *
              (1 - graphProgress);


            graphPath.style.strokeDashoffset =
              `${offset}`;


            graphPointsRef.current.forEach(
              (point, index) => {

                const pointStart =
                  TEST_START +
                  index * 0.09;


                const visible =
                  progress >= pointStart;


                point.style.opacity =
                  visible
                    ? "1"
                    : "0";


                point.style.transform =
                  visible
                    ? "scale(1)"
                    : "scale(0)";

              }
            );

          }

        }

      }

    });


    // ==================================================
    // STAGE 1
    // COMPONENT CENTER → RIGHT
    // ==================================================

    timeline.to(
      component.position,
      {
        x: 3,

        duration: 2,

        ease: "none"
      }
    );


    // ==================================================
    // STAGE 2
    // COMPONENT ROTATES
    // ==================================================

    timeline.to(
      component.rotation,
      {
        y: Math.PI / 2,

        x: 0.5,

        duration: 1.5,

        ease: "none"
      }
    );


    timeline.to(
      component.position,
      {
        x: 0,

        y: 0,

        z: 0,

        duration: 0.7,

        ease: "power3.inOut"
      }
    );


    // ==================================================
    // STAGE 7
    // COMPONENT ROTATION REVERSES
    // ==================================================

    timeline.to(
      component.rotation,
      {
        x: 0,

        y: 0,

        z: 0,

        duration: 0.7,

        ease: "power3.inOut"
      },
      "<"
    );


    // ==================================================
    // STAGE 8
    // COMPONENT FINAL REST
    // ==================================================

    timeline.to(
      component.position,
      {
        x: 0,

        y: 0,

        z: 0,

        duration: 0.4,

        ease: "none"
      }
    );


    timeline.to(
      component.rotation,
      {
        x: 0,

        y: 0,

        z: 0,

        duration: 0.4,

        ease: "none"
      },
      "<"
    );


    // ==================================================
    // STAGE 4
    // MACHINE ENTERS FROM BOTTOM
    // ==================================================

    timeline.to(
      machine.position,
      {
        y: -7,

        duration: 2.5,

        ease: "power1.out"
      },
      "-0.7"
    );


    // ==================================================
    // MACHINE SLIGHT SPIN
    // ==================================================

    timeline.to(
      machine.rotation,
      {
        y: Math.PI * 0.10,

        duration: 2,

        ease: "power1.inOut"
      },
      "<"
    );


    // ==================================================
    // STAGE 5
    // MACHINE FINAL POSITION
    // ==================================================

    timeline.to(
      machine.position,
      {
        x: 0,

        y: -3,

        z: -2,

        duration: 1.5,

        ease: "power2.out"
      }
    );


    // ==================================================
    // MACHINE FINAL ROTATION
    // ==================================================

    timeline.to(
      machine.rotation,
      {
        x: 0,

        y: Math.PI * 0.16,

        z: 0,

        duration: 0.7,

        ease: "power2.out"
      }
    );


    // ==================================================
    // COMPONENT FINAL REST
    // ==================================================

    timeline.to(
      component.position,
      {
        x: 0,

        y: 0,

        z: 0,

        duration: 0.4,

        ease: "none"
      }
    );


    timeline.to(
      component.rotation,
      {
        x: 0,

        y: 0,

        z: 0,

        duration: 0.4,

        ease: "none"
      },
      "<"
    );


    // ==================================================
    // REST BEFORE TEST
    // ==================================================

    timeline.to(
      {},
      {
        duration: 1.5
      }
    );


    // ==================================================
    // TESTING STARTS
    // ==================================================

    if (heater) {

      timeline.to(
        heater.scale,
        {
          x: 1,

          y: 1,

          z: 1,

          duration: 1.2,

          ease: "power2.out"
        }
      );


      timeline.to(
        heater.material,
        {
          emissiveIntensity: 4,

          duration: 1.5,

          ease: "power2.inOut"
        }
      );


      timeline.to(
        heater.material,
        {
          emissiveIntensity: 8,

          duration: 1.5,

          ease: "none"
        }
      );


      timeline.to(
        heater.material,
        {
          emissiveIntensity: 12,

          duration: 1.5,

          ease: "none"
        }
      );


      timeline.to(
        heater.material,
        {
          emissiveIntensity: 16,

          duration: 1.5,

          ease: "none"
        }
      );


      timeline.to(
        heater.material,
        {
          emissiveIntensity: 20,

          duration: 1.5,

          ease: "none"
        }
      );

    }


    ScrollTrigger.refresh();


    return () => {

      timeline.scrollTrigger?.kill();

      timeline.kill();

    };

  }, [
    componentRef,
    machineRef,
    doorRef,
    heaterRef,
    graphPathRef,
    graphPointsRef,
    setTemperature,
    setBurnTime,
    setStatus,
    setCurrentValue,
    setAnomaly,
    setScrollProgress
  ]);


  return null;
}


// ======================================================
// 3D SCENE
// ======================================================

function Scene({
  componentRef,
  machineRef,
  doorRef,
  heaterRef,
  graphPathRef,
  graphPointsRef,
  setTemperature,
  setBurnTime,
  setStatus,
  setCurrentValue,
  setAnomaly,
  setScrollProgress
}) {

  return (

    <Canvas

      camera={{
        position: [0, 0, 10],

        fov: 45
      }}

      gl={{
        antialias: true
      }}

    >

      <ambientLight
        intensity={0.15}
      />

      <directionalLight
        position={[5, 5, 5]}

        intensity={0.35}
      />

      <directionalLight
        position={[-5, -5, -5]}

        intensity={0.1}
      />

      <pointLight
        position={[0, 3, 3]}

        intensity={0.15}
      />

      <Environment
        preset="studio"

        environmentIntensity={0.1}
      />


      <ElectronicComponent
        componentRef={componentRef}
      />


      <BurnInMachine
        machineRef={machineRef}

        doorRef={doorRef}

        heaterRef={heaterRef}
      />


      <ScrollController

        componentRef={componentRef}

        machineRef={machineRef}

        doorRef={doorRef}

        heaterRef={heaterRef}

        graphPathRef={graphPathRef}

        graphPointsRef={graphPointsRef}

        setTemperature={setTemperature}

        setBurnTime={setBurnTime}

        setStatus={setStatus}

        setCurrentValue={setCurrentValue}

        setAnomaly={setAnomaly}

        setScrollProgress={setScrollProgress}

      />

    </Canvas>

  );
}


// ======================================================
// APP
// ======================================================

function App() {

  const componentRef =
    useRef(null);

  const machineRef =
    useRef(null);

  const doorRef =
    useRef(null);

  const heaterRef =
    useRef(null);

  const graphPathRef =
    useRef(null);

  const graphPointsRef =
    useRef([]);


  const [temperature, setTemperature] =
    useState(25);

  const [burnTime, setBurnTime] =
    useState("0h");

  const [status, setStatus] =
    useState("COMPONENT READY");

  const [currentValue, setCurrentValue] =
    useState(10);

  const [anomaly, setAnomaly] =
    useState(false);

  const [scrollProgress, setScrollProgress] =
    useState(0);


  // =====================================================
  // GET STARTED BUTTON VISIBILITY
  // =====================================================

  useEffect(() => {

    const page =
      document.querySelector(".page");

    if (!page) {
      return;
    }


    if (scrollProgress >= 0.98) {

      page.classList.add(
        "scrolled-complete"
      );

    } else {

      page.classList.remove(
        "scrolled-complete"
      );

    }

  }, [scrollProgress]);


  // =====================================================
  // GET STARTED BUTTON
  // =====================================================

  const handleGetStarted = () => {

    window.location.href = "https://smartburn-aiv-dashboard.onrender.com";

  };


  return (

    <div className="page">


      {/* =================================================
          3D CANVAS
      ================================================= */}

      <div className="canvas-container">

        <Scene

          componentRef={componentRef}

          machineRef={machineRef}

          doorRef={doorRef}

          heaterRef={heaterRef}

          graphPathRef={graphPathRef}

          graphPointsRef={graphPointsRef}

          setTemperature={setTemperature}

          setBurnTime={setBurnTime}

          setStatus={setStatus}

          setCurrentValue={setCurrentValue}

          setAnomaly={setAnomaly}

          setScrollProgress={setScrollProgress}

        />

      </div>


      {/* =================================================
          HUD
      ================================================= */}

      <div className="hud">

        <div className="hud-top">

          <span>
            BURN-IN MONITOR
          </span>

          <span>
            AI SCREENING SYSTEM
          </span>

        </div>


        <div className="temperature-box">

          <span className="hud-label">
            TEMPERATURE
          </span>

          <span className="temperature">
            {temperature}°C
          </span>

        </div>


        <div className="status-box">

          <span className="hud-label">
            SYSTEM STATUS
          </span>

          <span className="status">
            {status}
          </span>

        </div>


        <div className="time-box">

          <span className="hud-label">
            BURN-IN TIME
          </span>

          <span className="burn-time">
            {burnTime}
          </span>

        </div>


        <div className="current-box">

          <span className="hud-label">
            LEAKAGE CURRENT
          </span>

          <div className="current-value">

            {currentValue}

            <span>
              µA
            </span>

          </div>

          <span className="limit">
            DATASHEET LIMIT: 50 µA
          </span>

        </div>


        {/* =================================================
            GRAPH
        ================================================= */}

        <div className="graph-box">

          <div className="graph-header">

            <span>
              PARAMETRIC DRIFT
            </span>

            <span>
              Iddq / LEAKAGE
            </span>

          </div>


          <div className="graph">

            <div className="limit-line">

              <span>
                50 µA LIMIT
              </span>

            </div>


            <svg
              className="drift-chart"

              viewBox="0 0 320 125"

              preserveAspectRatio="none"
            >

              <line
                x1="0"
                y1="25"
                x2="320"
                y2="25"
                className="chart-grid"
              />

              <line
                x1="0"
                y1="60"
                x2="320"
                y2="60"
                className="chart-grid"
              />

              <line
                x1="0"
                y1="95"
                x2="320"
                y2="95"
                className="chart-grid"
              />


              <polyline

                ref={graphPathRef}

                points="
                  0,100
                  80,92
                  160,75
                  240,48
                  320,18
                "

                className="drift-path"

              />


              {[
                [0, 100],
                [80, 92],
                [160, 75],
                [240, 48],
                [320, 18]
              ].map(
                ([cx, cy], index) => (

                  <circle

                    key={index}

                    ref={(element) => {

                      if (
                        element &&
                        !graphPointsRef.current.includes(
                          element
                        )
                      ) {

                        graphPointsRef.current.push(
                          element
                        );

                      }

                    }}

                    cx={cx}

                    cy={cy}

                    r="4"

                    className="chart-point"

                  />

                )
              )}

            </svg>

          </div>


          <div className="graph-labels">

            <span>
              0h
            </span>

            <span>
              24h
            </span>

            <span>
              96h
            </span>

            <span>
              168h
            </span>

          </div>

        </div>


        {/* =================================================
            AI ANALYSIS
        ================================================= */}

        {anomaly && (

          <div className="ai-analysis-panel">

            <div className="analysis-header">

              <span>
                AI SCREENING ANALYSIS
              </span>

              <span className="analysis-live">
                LIVE ANALYSIS
              </span>

            </div>


            <div className="analysis-content">

              <div className="analysis-card">

                <span className="analysis-label">
                  STATIC LIMIT CHECK
                </span>

                <div className="analysis-value">

                  45

                  <span>
                    µA
                  </span>

                </div>

                <div className="analysis-limit">
                  LIMIT: 50 µA
                </div>

                <div className="traditional-pass">
                  ✓ PASS
                </div>

              </div>


              <div className="analysis-card">

                <span className="analysis-label">
                  AI DRIFT ANALYSIS
                </span>

                <div className="analysis-value">

                  45

                  <span>
                    µA
                  </span>

                </div>

                <div className="analysis-limit">
                  PREDICTED 168h: 52 µA
                </div>

                <div className="ai-fail">
                  ⚠ ANOMALY
                </div>

              </div>


              <div className="analysis-card">

                <span className="analysis-label">
                  DRIFT SLOPE
                </span>

                <div className="analysis-value">

                  +0.31

                  <span>
                    µA/h
                  </span>

                </div>

                <div className="analysis-limit">
                  SAFE SLOPE: +0.18 µA/h
                </div>

                <div className="ai-fail">
                  ABOVE SAFE SLOPE
                </div>

              </div>

            </div>


            <div className="ai-decision">

              <div className="decision-icon">
                AI
              </div>


              <div className="decision-text">

                <span className="decision-title">
                  EARLY REJECTION RECOMMENDED
                </span>

                <span className="decision-description">

                  Component remains below the absolute
                  limit, but its parametric drift indicates
                  a potential latent defect.

                </span>

              </div>


              <div className="confidence">

                <span>
                  CONFIDENCE
                </span>

                <strong>
                  94%
                </strong>

              </div>

            </div>

          </div>

        )}


        {/* =================================================
            TIMELINE
        ================================================= */}

        <div className="timeline">

          <div className="timeline-line"></div>

          <div className="timeline-point active">

            <span>
              0h
            </span>

          </div>

          <div className="timeline-point">

            <span>
              24h
            </span>

          </div>

          <div className="timeline-point">

            <span>
              96h
            </span>

          </div>

          <div className="timeline-point">

            <span>
              168h
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          STORY SECTIONS
      ================================================= */}

      <section className="section hero">

        <div className="text-container">

          <p className="small-text">
            AI-DRIVEN ANOMALY DETECTION
          </p>

          <h1>
            EVERY MISSION
            <br />
            STARTS WITH
            <br />
            A COMPONENT.
          </h1>

        </div>

      </section>


      <section className="section">

        <div className="text-container">

          <p className="small-text">
            THE COMPONENT
          </p>

          <h2>
            But not every component
            <br />
            is reliable.
          </h2>

        </div>

      </section>


      <section className="section">

        <div className="text-container">

          <p className="small-text">
            COMPONENT SCREENING
          </p>

          <h2>
            Before deployment,
            <br />
            every component must
            <br />
            survive rigorous testing.
          </h2>

        </div>

      </section>


      <section className="section">

        <div className="text-container">

          <p className="small-text">
            BURN-IN TEST
          </p>

          <h2>
            Controlled thermal stress
            <br />
            begins.
          </h2>

        </div>

      </section>


      <section className="section">

        <div className="text-container">

          <p className="small-text">
            PARAMETRIC MONITORING
          </p>

          <h2>
            Every electrical parameter
            <br />
            is continuously monitored.
          </h2>

        </div>

      </section>


      <section className="section">

        <div className="text-container">

          <p className="small-text">
            THE PROBLEM
          </p>

          <h2>
            Leakage current begins
            <br />
            to drift.
          </h2>

        </div>

      </section>


      <section className="section">

        <div className="text-container">

          <p className="small-text">
            AI ANALYSIS
          </p>

          <h2>
            The model detects
            <br />
            a hidden anomaly.
          </h2>

        </div>

      </section>


      <section className="section final-section">

        <div className="text-container">

          <p className="small-text">
            THE SOLUTION
          </p>

          <h1>
            AI DETECTS
            <br />
            WHAT STATIC
            <br />
            LIMITS MISS.
          </h1>

        </div>

      </section>


      {/* =================================================
          GET STARTED BUTTON
          COMPLETE SCROLL TARVATA SHOW AVUTUNDI
      ================================================= */}

      <button
        className="get-started-btn"
        onClick={handleGetStarted}
      >

        <span>
          Get Started
        </span>

        <span className="get-started-arrow">
          →
        </span>

      </button>


    </div>

  );
}


export default App;