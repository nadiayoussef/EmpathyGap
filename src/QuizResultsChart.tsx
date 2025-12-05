import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { curveCatmullRom } from 'd3';

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

  // Fetch data directly from JSONBin
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
          headers: { 'X-Master-Key': API_KEY }
        });
        const json = await response.json();
        const responses: boolean[][] = json.record.responses || [];

        // Calculate yes percentages
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
        // Get last response directly from the responses array
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

    // Has the quiz updated?
    const handleUpdate = () => {
      setLoading(true);
      loadData();
    };
    
    window.addEventListener('quizDataUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('quizDataUpdated', handleUpdate);
    };
  }, []);

  // Y axis scale (0-100 for percentage)
  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 100])
      .range([boundsHeight, 0]);
  }, [boundsHeight]);

  // X axis scale
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([1, 10])
      .range([0, boundsWidth]);
  }, [boundsWidth]);

  // Render axes
  useEffect(() => {
    if (data.length === 0) return;

    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll('*').remove();

    // X axis
    const xAxisGenerator = d3.axisBottom(xScale)
      .ticks(10);
    const xAxis = svgElement
      .append('g')
      .attr('transform', `translate(0,${boundsHeight})`)
      .call(xAxisGenerator);
    xAxis.selectAll('.tick text').remove();


  // Community label
  xAxis.append('text')
    .attr('x', boundsWidth / 4)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Community');

  // Personal label
  xAxis.append('text')
    .attr('x', (boundsWidth / 4) * 3)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Personal');

    // Y axis
    const yAxisGenerator = d3.axisLeft(yScale)
      .ticks(10)
      .tickFormat((d: number) => `${d}%`);
    svgElement.append('g').call(yAxisGenerator);

    // Y axis label
    svgElement.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -boundsHeight / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px');
      // .text('% Answered "Yes"');

  }, [xScale, yScale, boundsHeight, data]);

  if (loading) {
    return <div className="p-4">Loading results...</div>;
  }

  // Build the collective area
  const areaBuilder = d3
    .area<QuizDataPoint>()
    .x((d: QuizDataPoint) => xScale(d.x))
    .y0(boundsHeight)
    .y1((d: QuizDataPoint) => yScale(d.yesPercent))
    .curve(curveCatmullRom);

  const areaPath = areaBuilder(data);

  // Build the last response line
  const lastResponseData: QuizDataPoint[] | null = lastResponse
    ? lastResponse.map((answer, i) => ({
        x: i + 1,
        yesPercent: answer ? 80 : 20
      }))
    : null;

  const lineBuilder = d3
    .line<QuizDataPoint>()
    .x((d: QuizDataPoint) => xScale(d.x))
    .y((d: QuizDataPoint) => yScale(d.yesPercent))
    .curve(curveCatmullRom);

  const lastResponsePath = lastResponseData ? lineBuilder(lastResponseData) : null;

  // Build the area between collective and last response
  const betweenAreaBuilder = d3
    .area<number>()
    .x((_: number, i: number) => xScale(i + 1))
    .y0((_: number, i: number) => yScale(data[i]?.yesPercent || 0))
    .y1((_: number, i: number) => yScale(lastResponseData?.[i]?.yesPercent || 0))
    .curve(curveCatmullRom);

  const betweenAreaPath = lastResponseData ? betweenAreaBuilder(d3.range(10)) : null;

  return (
    <div>
      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Collective area */}
          <path
            d={areaPath || ''}
            fill="#7FB3D5"
            fillOpacity={0.8}
            stroke="#5A93B5"
            strokeWidth={2}
          />
          {/* Area between collective and last response */}
          {betweenAreaPath && (
            <path
              d={betweenAreaPath}
              fill="#fa8cbe"
              fillOpacity={0.6}
            />
          )}
          {/* Last response line */}
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