/*
import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { curveCatmullRom } from 'd3';

const MARGIN = { top: 30, right: 30, bottom: 50, left: 50 };

type DataPoint = { x: number; y: number };

type StackedAreaChartProps = {
  width: number;
  height: number;
  data: { [key: string]: number }[];
};

export const Chart = ({ width, height, data }: StackedAreaChartProps) => {
  // bounds = area inside the graph axis = calculated by substracting the margins
  const axesRef = useRef(null);
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // const groups = ["groupA", "groupB", "groupC", "groupD"];

  const groups = ["groupA", "groupB", "groupC", "groupD"];

  // data wrangling: stack the data
  const stackSeries = d3
    .stack()
    .keys(groups)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetSilhouette);
  const series = stackSeries(data);

  // Y axis
  // const max = 300;
  // const yScale = useMemo(() => {
  //   return d3
  //     .scaleLinear()
  //     .domain([0, max || 0])
  //     .range([boundsHeight, 0]);
  // }, [data, height]);

  const max = 300; // todo
  const yScale = useMemo(() => {
    return d3.scaleLinear().domain([-200, 200]).range([boundsHeight, 0]);
  }, [data, height]);

  // X axis
  const [xMin, xMax] = d3.extent(data, (d) => d.x);
  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([xMin || 0, xMax || 0])
      .range([0, boundsWidth]);
  }, [data, width]);

  // Color
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(["#F66FAC", "#7CA0C2", "#F09924", "#F5C51D"]);


  // Render the X and Y axis using d3.js, not react
  useEffect(() => {
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll('*').remove();
    const xAxisGenerator = d3.axisBottom(xScale);
    svgElement
      .append('g')
      .attr('transform', 'translate(0,' + boundsHeight + ')')
      .call(xAxisGenerator);

    const yAxisGenerator = d3.axisLeft(yScale);
    svgElement.append('g').call(yAxisGenerator);
  }, [xScale, yScale, boundsHeight]);

  // Build the line
  const areaBuilder = d3
    .area<any>()
    .x((d) => {return xScale(d.data.x);})
    .y1((d) => yScale(d[1]))
    .y0((d) => yScale(d[0]))
    .curve(curveCatmullRom);


    const allPath = series.map((serie, i) => {
      const path = areaBuilder(serie);
      return (
        <path
          key={i}
          d={path}
          opacity={1}
          // stroke="#403027"
          fill={colorScale(serie.key)}
          fillOpacity={0.8}
        />
      );
    });


    return (
      <div>
        <svg width={width} height={height}>
          <g
            width={boundsWidth}
            height={boundsHeight}
            transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
          >
            {allPath}
          </g>
          <g
            width={boundsWidth}
            height={boundsHeight}
            ref={axesRef}
            transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
          />
        </svg>
      </div>
    );
  };
  */