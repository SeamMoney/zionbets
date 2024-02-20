"use client";
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import "../app/globals.css";
import { channel } from 'diagnostics_channel';

interface CrashChartProps {
  startAnimation: boolean;
  crashPoint?: number;
}

function EmptyCrashChart ({ startAnimation, crashPoint }: CrashChartProps) {
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const d3Container = useRef<SVGSVGElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!startAnimation || !d3Container.current) return;

    const containerRect = d3Container.current.getBoundingClientRect();
    const width = containerRect.width - margin.left - margin.right;
    const height = containerRect.height - margin.top - margin.bottom;

    const svg = d3.select(d3Container.current)
      .attr('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, width]).domain([0, 40]);
    const yScale = d3.scaleLinear().range([height, 0]).domain([0, 10]);

    const xAxis = d3.axisBottom(xScale).tickSize(-height).tickPadding(10).ticks(5);
    const yAxis = d3.axisLeft(yScale).tickSize(-width).tickPadding(10).ticks(5);

    const xAxisGroup = svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`);

    const yAxisGroup = svg.append('g')
      .attr('class', 'y axis');

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    let data: [number, number][] = [];

    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    let time = 0;

    const updateChart = () => {

      if (crashPoint == null) return;

      const base = 1.5;

      time += 0.001;
      const newYValue = (Math.pow(base, time) - 1) * (crashPoint / (Math.pow(base, 10) - 1));
      if (newYValue >= crashPoint) {
        console.log("Crash point reached at time:", time);
        return;
      }

      const newDataPoint: [number, number] = [time, newYValue];
      data.push(newDataPoint);

      // if (data.length > num) data.shift();

      xScale.domain([Math.max(time - 10, 0), time]);
      yScale.domain([0, d3.max(data, d => d[1]) || crashPoint]);

      xAxisGroup.call(xAxis);
      yAxisGroup.call(yAxis);

      svg.selectAll('.line')
        .data([data])
        .join('path')
        .attr('class', 'line')
        .attr('d', line);

      time += 0.1;
      animationFrameId.current = requestAnimationFrame(updateChart);
    };

    animationFrameId.current = requestAnimationFrame(updateChart);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [startAnimation, crashPoint]);

  return (
    <svg ref={d3Container} className="border border-black" width="100%" height="100%">
      <path className="line" fill="none" stroke="white" strokeWidth="4" />
    </svg>
  );
};

export default EmptyCrashChart;