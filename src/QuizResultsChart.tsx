import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { curveCatmullRom } from 'd3';
// import { curveMonotoneX } from 'd3';

const MARGIN = { top: 30, right: 30, bottom: 150, left: 200 };

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

  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      const json = await response.json();
      const responses: boolean[][] = json.record.responses || [];

      // If the number of responses changed → refresh data
      if (responses.length !== totalResponses) {
        // triggers full reload + rerender
        window.dispatchEvent(new Event('quizDataUpdated'));
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, 5000); // ← poll every 5 seconds

  return () => clearInterval(interval);
}, [totalResponses]);


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
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style('font-family', "'Rockwell', serif")
      .style('font-size', '30px')
      .style('fill', '#403027')
      .text('Community');

    xAxis.append('text')
      .attr('x', (boundsWidth / 4) * 3)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style('font-family', "'Rockwell', serif")
      .style('font-size', '30px')
      .style('fill', '#403027')
      .text('Personal');

    const yAxisGenerator = d3.axisLeft(yScale)
      .ticks(10)
      .tickFormat(d => `${d}%`);
    // svgElement.append('g').call(yAxisGenerator);
    const yAxis = svgElement.append('g').call(yAxisGenerator);
    yAxis.selectAll('text')
      .style('font-family', "'Rockwell', serif")
      .style('font-size', '30px')
      .style('fill', '#403027');

       // Y-axis label
    svgElement.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -boundsHeight / 2)
      .attr('y', -125)
      .attr('text-anchor', 'middle')
      .style('font-family', "'Rockwell', serif")
      .style('font-size', '30px')
      .style('fill', '#5A93B5')
      .text("Percentage of 'Yes'");

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

     // Legend positioning
    const legendX = boundsWidth - 120;
    const legendY = 10;

  return (
    <div>
      <svg width="100%" height={height}
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
            {/* Legend - below x-axis */}
          <g transform={`translate(${boundsWidth / 2}, ${boundsHeight + 100}) scale(3)`}>

          {/* YOU legend item */}
            {lastResponsePath && (
              <g transform="translate(-200, 0)">
                <rect x={-5} y={-5} width={20} height={10} fill="#f3bbd1" fillOpacity={0.8} stroke="#F66FAC" strokeWidth={1} />
                <text x={22} y={4} fontSize={12} fill="#403027" fontFamily="'Rockwell', serif" fontWeight="bold">You</text>
              </g>
            )}

            {/* Gap item */}
            {lastResponsePath && (
              <g transform="translate(-70, 0)">
                <rect x={-5} y={-5} width={20} height={10} fill="#CDA4C7" fillOpacity={0.8} stroke="#c97ebeff" strokeWidth={1} />
                <text x={22} y={4} fontSize={12} fill="#403027" fontFamily="'Rockwell', serif" fontWeight="bold">Empathy Gap</text>
              </g>// 205, 164, 199
            )}

            {/* The Gallery legend item */}
            <g transform="translate(100, 0)">
              <rect x={-5} y={-5} width={20} height={10} fill="#a0bfd8" fillOpacity={0.8} stroke="#5A93B5" strokeWidth={1} />
              <text x={22} y={4} fontSize={12} fill="#403027" fontFamily="'Rockwell', serif" fontWeight="bold">Boston Cyberarts Visitors</text>
            </g>

          </g>
        </g>
        <g
          ref={axesRef}
          transform={`translate(${MARGIN.left},${MARGIN.top})`}
        />
      </svg>
    </div>
  );
};