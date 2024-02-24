"use client";
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import "../app/globals.css";

interface CrashChartProps {
  startAnimation: boolean;
  crashPoint?: number;
}

function CrashChart({ startAnimation, crashPoint }: CrashChartProps) {
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const d3Container = useRef<SVGSVGElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const rocketRef = useRef<SVGImageElement | null>(null);

  useEffect(() => {
    if (!startAnimation || !d3Container.current) return;

    d3.select(d3Container.current).selectAll('*').remove();

    const containerRect = d3Container.current.getBoundingClientRect();
    const width = containerRect.width - margin.left - margin.right;
    const height = containerRect.height - margin.top - margin.bottom;
    const rocketWidth = 100;
    const rocketHeight = 100;

    const svg = d3.select(d3Container.current)
      .attr('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, width]).domain([0, 40]);
    const yScale = d3.scaleLinear().range([height, 0]).domain([1, 10]);

    const xAxis = d3.axisBottom(xScale).tickSize(-height).tickPadding(10).ticks(5);
    const yAxis = d3.axisLeft(yScale).tickSize(-width).tickPadding(10).ticks(5).tickFormat(d3.format(".0f"));;

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

    let timeIncrement = 0.00001;
    let time = 0;

    const updateChart = () => {
      if (crashPoint == null) return;

      const initialOffset = 1;
      const dynamicGrowthRate = Math.max(3, 10 - time);

      if (time < 1) {
        time += 0.000005;
      } else {
        time += 0.0001;
      }
      const newYValue = initialOffset + (Math.pow(dynamicGrowthRate, time * 2) - 1) * (crashPoint / (Math.pow(dynamicGrowthRate, 10) - 1));

      if (newYValue >= crashPoint) {
        console.log("Crash point reached at time:", time);
        return;
      }

      console.log("Time:", time, "New Y Value:", newYValue);

      const newDataPoint: [number, number] = [time, newYValue];
      data.push(newDataPoint);

      xScale.domain([Math.max(time - 40, 0), time]);

      if (data.length > 1) {
        yScale.domain([1, d3.max(data, d => d[1]) || crashPoint]);
      }

      if (data.length > 0) {
        const maxY = d3.max(data, d => d[1]) || crashPoint || 10;
        yScale.domain([1, maxY]);
      }

      xAxisGroup.call(xAxis);
      yAxisGroup.call(yAxis);

      svg.selectAll('.line')
        .data([data])
        .join('path')
        .attr('class', 'line')
        .attr('d', line);

      if (data.length === 1) {
        const rocketUrl = '/rocket.png';
        const rocketWidth = 100;
        const rocketHeight = 100;
        rocketRef.current = svg.append('image')
          .attr('xlink:href', rocketUrl)
          .attr('width', rocketWidth)
          .attr('height', rocketHeight)
          .attr('x', xScale(newDataPoint[0]) - rocketWidth / 2)
          .attr('y', yScale(newDataPoint[1]) - rocketHeight / 2)
          .node();
      } else if (data.length > 1) {
        const lastPoint = data[data.length - 1];
        const secondLastPoint = data[data.length - 2];

        // Calculate the angle
        const deltaY = yScale(secondLastPoint[1]) - yScale(lastPoint[1]);
        const deltaX = xScale(secondLastPoint[0]) - xScale(lastPoint[0]);
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        const safeMargin = Math.max(rocketWidth, rocketHeight);

        angle += 245;

        const offset = 5;
        const offsetPoint = data.length > offset ? data[data.length - 1 - offset] : secondLastPoint;

        if (rocketRef.current) {
          const rocketX = xScale(offsetPoint[0]) - rocketWidth / 2;
          const rocketY = yScale(offsetPoint[1]) - rocketHeight / 2;

          const rotateX = rocketX + rocketWidth / 2;
          const rotateY = rocketY + rocketHeight / 2;

          d3.select(rocketRef.current)
            .attr('x', rocketX)
            .attr('y', rocketY)
            .attr('transform', `rotate(${angle},${rotateX},${rotateY})`);
        }
      }

      time += 0.001;
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

export default CrashChart;