// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
// import { data } from "./data";
// import { LineChart } from "./LineChart";

// export const LineChartBasicDemo = ({ width = 700, height = 400 }) => (
//   <LineChart data={data} width={width} height={height} />
// );

// import React from "react";
// import ReactDOM from "react-dom/client";
// import { Chart } from "./Chart";
// import { data } from "./data";
// import EmpathyQuiz from "./empathy-quiz";

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<Chart data={data} width={400} height={400} />);

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<EmpathyQuiz />);

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import EmpathyQuiz from "./empathy-quiz";
import { QuizResultsChart } from "./QuizResultsChart";

const App = () => {
  const [view, setView] = useState(() => {
    // Read `mode` from the URL query string. If mode=viz -> show results, otherwise show quiz.
    try {
      if (typeof window === "undefined") return "quiz";
      const params = new URLSearchParams(window.location.search);
      return params.get("mode") === "viz" ? "results" : "quiz";
    } catch (e) {
      return "quiz";
    }
  }); // "quiz" or "results"

  return (
    <div>
      {/* <nav style={{ padding: "1rem", background: "#eee" }}>
        <button onClick={() => setView("quiz")}>Take Quiz</button>
        <button onClick={() => setView("results")}>View Results</button>
      </nav> */}

      {view === "quiz" && <EmpathyQuiz />}
      {view === "results" && <QuizResultsChart width={1450} height={950} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);