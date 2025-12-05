import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { curveCatmullRom } from 'd3';
// import { curveMonotoneX } from 'd3';

const MARGIN = { top: 30, right: 30, bottom: 50, left: 50 };

const API_KEY = '$2a$10$2SJqBeF.2mExcuqvz0lO.e/VxRbWDCz0mEk/lWJs7vrWgVYFf1aR6';
const BIN_ID = '69304915ae596e708f80f833';

type QuizDataPoint = {
  x: number;
  yesPercent: number;
};

type QuizResultsChartProps = {
  width: number;
  height: number;
};

export const QuizResultsChart = ({ width, height }: QuizResultsChartProps) => {
  const axesRef = useRef(null);
  const [data, setData] = useState<QuizDataPoint[]>([]);
  const [lastResponse, setLastResponse] = useState<boolean[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalResponses, setTotalResponses] = useState(0);

  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
          headers: { 'X-Master-Key': API_KEY }
        });
        const json = await response.json();
        const responses: boolean[][] = json.record.responses || [];

        const yesCounts = new Array(10).fill(0);
        responses.forEach((response: boolean[]) => {
          response.forEach((answer, index) => {
            if (answer) yesCounts[index]++;
          });
        });

        const chartData = yesCounts.map((count, i) => ({
          x: i + 1,
          yesPercent: responses.length > 0 ? (count / responses.length) * 100 : 0
        }));

        setData(chartData);
        setTotalResponses(responses.length);
        setLastResponse(responses.length > 0 ? responses[responses.length - 1] : null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData(Array.from({ length: 10 }, (_, i) => ({ x: i + 1, yesPercent: 0 })));
        setTotalResponses(0);
        setLastResponse(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    const handleUpdate = () => {
      setLoading(true);
      loadData();
    };
    
    window.addEventListener('quizDataUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('quizDataUpdated', handleUpdate);
    };
  }, []);

  // X axis scale - adjusted to start at 0.5 and end at 10.5 for full coverage
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0.5, 10.5])
      .range([0, boundsWidth]);
  }, [boundsWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 100])
      .range([boundsHeight, 0]);
  }, [boundsHeight]);

  useEffect(() => {
    if (data.length === 0) return;

    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll('*').remove();

    const xAxisGenerator = d3.axisBottom(xScale)
      .tickValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const xAxis = svgElement
      .append('g')
      .attr('transform', `translate(0,${boundsHeight})`)
      .call(xAxisGenerator);
    xAxis.selectAll('.tick text').remove();

    xAxis.append('text')
      .attr('x', boundsWidth / 4)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text('Community');

    xAxis.append('text')
      .attr('x', (boundsWidth / 4) * 3)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text('Personal');

    const yAxisGenerator = d3.axisLeft(yScale)
      .ticks(10)
      .tickFormat(d => `${d}%`);
    svgElement.append('g').call(yAxisGenerator);

  }, [xScale, yScale, boundsHeight, boundsWidth, data]);

  if (loading) {
    return <div className="p-4">Loading results...</div>;
  }

  // Extend data to edges for full coverage
  const extendedData: QuizDataPoint[] = [
    { x: 0.5, yesPercent: data[0]?.yesPercent || 0 },
    ...data,
    { x: 10.5, yesPercent: data[9]?.yesPercent || 0 }
  ];

  const areaBuilder = d3
    .area<QuizDataPoint>()
    .x((d) => xScale(d.x))
    .y0(boundsHeight)
    .y1((d) => yScale(d.yesPercent))
    // .curve(curveCatmullRom);
    .curve(d3.curveMonotoneX);

  const areaPath = areaBuilder(extendedData);

  const lastResponseData: QuizDataPoint[] | null = lastResponse
    ? lastResponse.map((answer, i) => ({
        x: i + 1,
        yesPercent: answer ? 80 : 20
      }))
    : null;

  // Extend last response data to edges
  const extendedLastResponse: QuizDataPoint[] | null = lastResponseData
    ? [
        { x: 0.5, yesPercent: lastResponseData[0]?.yesPercent || 0 },
        ...lastResponseData,
        { x: 10.5, yesPercent: lastResponseData[9]?.yesPercent || 0 }
      ]
    : null;

  const lineBuilder = d3
    .line<QuizDataPoint>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.yesPercent))
    // .curve(curveCatmullRom);
    .curve(d3.curveMonotoneX);


  const lastResponsePath = extendedLastResponse ? lineBuilder(extendedLastResponse) : null;

  const betweenAreaBuilder = d3
    .area<number>()
    .x((_, i) => xScale(extendedData[i]?.x || 0))
    .y0((_, i) => yScale(extendedData[i]?.yesPercent || 0))
    .y1((_, i) => yScale(extendedLastResponse?.[i]?.yesPercent || 0))
    // .curve(curveCatmullRom);
        .curve(d3.curveMonotoneX);


  const betweenAreaPath = extendedLastResponse 
    ? betweenAreaBuilder(d3.range(extendedData.length)) 
    : null;

  return (
    <div>
      <svg width="200%" height={height}
      viewBox='0 0 ${width} ${height}'
      preserveAspectRatio='none'>
        <rect width={width} height={height} fill="#fffaf0" />
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <path
            d={areaPath || ''}
            fill="#7FB3D5"
            fillOpacity={0.8}
            stroke="#5A93B5"
            strokeWidth={2}
          />
          {betweenAreaPath && (
            <path
              d={betweenAreaPath}
              fill="#fa8cbe"
              fillOpacity={0.6}
            />
          )}
          {lastResponsePath && (
            <path
              d={lastResponsePath}
              fill="none"
              stroke="#F66FAC"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
        </g>
        <g
          ref={axesRef}
          transform={`translate(${MARGIN.left},${MARGIN.top})`}
        />
      </svg>
    </div>
  );
};