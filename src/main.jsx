import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import EmpathyQuiz from "./empathy-quiz";
import { QuizResultsChart } from "./QuizResultsChart";
import './index.css';

const App = () => {
  const [view, setView] = useState(() => {
    try {
      if (typeof window === "undefined") return "quiz";
      const params = new URLSearchParams(window.location.search);
      return params.get("mode") === "viz" ? "results" : "quiz";
    } catch (e) {
      return "quiz";
    }
  });

  return (
    <div>
      {/* <nav style={{ padding: "1rem", background: "#eee" }}>
        <button onClick={() => setView("quiz")}>Take Quiz</button>
        <button onClick={() => setView("results")}>View Results</button>
      </nav> */}

      {view === "quiz" && <EmpathyQuiz />}
      {view === "results" && <QuizResultsChart width={3756+500} height={2150} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);