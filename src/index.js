import ReactDOM from "react-dom";
import { data } from "./data/";
import { Chart } from "./Chart";
import './index.css';

const rootElement = document.getElementById("root");
ReactDOM.render(
  <Chart data={data} width={400} height={400} />,
  rootElement
);
