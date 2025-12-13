import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 30, right: 30, bottom: 150, left: 200 };

const API_KEY = '$2a$10$2WaSjbnj2iTAd3ctRGEey.NxuNOK2hFD3lo5xw9NMNPm.U0paSkvm';
const BIN_ID = '693d99f343b1c97be9ebe948';

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

  // Animation state
  const [animatedData, setAnimatedData] = useState<QuizDataPoint[]>([]);
  const [animatedLastResponse, setAnimatedLastResponse] = useState<boolean[] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

          // Calculate previous (all but last response) data for animation start
        const prevYesCounts = new Array(10).fill(0);
        const prevResponses = responses.slice(0, -1);
        prevResponses.forEach((response: boolean[]) => {
          response.forEach((answer, index) => {
            if (answer) prevYesCounts[index]++;
          });
        });

        const prevChartData = prevYesCounts.map((count, i) => ({
          x: i + 1,
          yesPercent: prevResponses.length > 0 ? (count / prevResponses.length) * 100 : 0
        }));

        const currentLastResponse = responses.length > 0 ? responses[responses.length - 1] : null;
        const previousLastResponse = responses.length > 1 ? responses[responses.length - 2] : null;

        // Set final target data
        setData(chartData);
        setTotalResponses(responses.length);
        setLastResponse(currentLastResponse);

          // Start animation from previous state
        if (responses.length > 1) {
          setAnimatedData(prevChartData);
          setAnimatedLastResponse(previousLastResponse);
          setIsAnimating(true);
        } else {
          setAnimatedData(chartData);
          setAnimatedLastResponse(currentLastResponse);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        const emptyData = Array.from({ length: 10 }, (_, i) => ({ x: i + 1, yesPercent: 0 }));
        setData(emptyData);
        setAnimatedData(emptyData);
        setTotalResponses(0);
        setLastResponse(null);
        setAnimatedLastResponse(null);
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


  // Animation effect - interpolate from previous to current
  useEffect(() => {
    if (!isAnimating || data.length === 0) return;

    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();
    const startData = [...animatedData];
    const startLastResponse = animatedLastResponse ? [...animatedLastResponse] : null;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate chart data
      const interpolatedData = data.map((target, i) => ({
        x: target.x,
        yesPercent: startData[i] 
          ? startData[i].yesPercent + (target.yesPercent - startData[i].yesPercent) * eased
          : target.yesPercent
      }));
      setAnimatedData(interpolatedData);

      // For last response, we snap to the new one partway through
      if (progress > 0.3 && lastResponse !== startLastResponse) {
        setAnimatedLastResponse(lastResponse);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, data, lastResponse]);

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
    if (animatedData.length === 0) return;

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

  }, [xScale, yScale, boundsHeight, boundsWidth, animatedData]);

  if (loading) {
    return <div className="p-4">Loading results...</div>;
  }

    // Use animated data for rendering
  const displayData = animatedData.length > 0 ? animatedData : data;
  const displayLastResponse = animatedLastResponse;

  // Extend data to edges for full coverage
  const extendedData: QuizDataPoint[] = [
    { x: 0.5, yesPercent: displayData[0]?.yesPercent || 0 },
    ...displayData,
    { x: 10.5, yesPercent: displayData[9]?.yesPercent || 0 }
  ];

  const areaBuilder = d3
    .area<QuizDataPoint>()
    .x((d) => xScale(d.x))
    .y0(boundsHeight)
    .y1((d) => yScale(d.yesPercent))
    // .curve(curveCatmullRom);
    .curve(d3.curveMonotoneX);

  const areaPath = areaBuilder(extendedData);

 const lastResponseData: QuizDataPoint[] | null = displayLastResponse
    ? displayLastResponse.map((answer, i) => ({
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
      <svg width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
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
                <rect x={-5} y={-5} width={20} height={10} fill="#c380c4ff" fillOpacity={0.8} stroke="#c97ebeff" strokeWidth={1} />
                <text x={22} y={4} fontSize={12} fill="#403027" fontFamily="'Rockwell', serif" fontWeight="bold">Empathy Gap</text>
              </g>
            )}

            {/* The Gallery legend item */}
            <g transform="translate(100, 0)">
              <rect x={-5} y={-5} width={20} height={10} fill="#a0bfd8" fillOpacity={0.8} stroke="#5A93B5" strokeWidth={1} />
              <text x={22} y={4} fontSize={12} fill="#403027" fontFamily="'Rockwell', serif" fontWeight="bold">Boston CyberArts Visitors</text>
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