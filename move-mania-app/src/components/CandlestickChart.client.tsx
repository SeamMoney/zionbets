"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, isUTCTimestamp, CrosshairMode, LineData } from 'lightweight-charts';
import "../app/globals.css";
import { start } from 'repl';

interface DataPoint {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    highlight?: boolean;
    offset?: number;
}

function CandlestickChart ({
    startTime,
    crashPoint,
    data,
}: {
    startTime: number;
    crashPoint: number;
    data: any[];
}) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {

        console.log("data:", data)

        if (!chartContainerRef.current) return;

        const newChart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            layout: {
                background: { color: '#000' },
                textColor: '#33cc33',
                fontFamily: "'Roboto Mono', sans-serif",
            },
            grid: {
                vertLines: { color: '#33333350' },
                horzLines: { color: '#33333350' },
            },
            crosshair: {
                mode: CrosshairMode.Hidden,
                // vertLine: {
                //     width: 2,
                //     color: '#333',
                //     labelBackgroundColor: '#333',
                // },
                // horzLine: {
                //     color: '#333',
                //     labelBackgroundColor: '#333',
                //     width: 2,
                // },
            },
            timeScale: {
                visible: false,
                borderVisible: true,
                secondsVisible: false,
                timeVisible: false,
                ticksVisible: false,
                borderColor: '#485c7b',
                barSpacing: 15,
            },
            rightPriceScale: {  
                visible: false,
            },

        });


        const candleSeries = newChart.addCandlestickSeries({

            upColor: 'white',
            wickUpColor: '#39FF14',
            wickDownColor: '#39FF14',
            downColor: 'black',
            borderVisible: true,
            borderColor: '#39FF14'
        });

        // const movingAverage50 = newChart.addLineSeries({
        //     color: 'rgba(255, 255, 255, 0.8)',
        //     lineWidth: 2,
        // });

        // const movingAverage10 = newChart.addLineSeries({
        //     color: 'rgba(255, 255, 255, 0.8)',
        //     lineWidth: 2,
        // });

        // // const movingAverage2 = newChart.addLineSeries({
        // //     color: 'rgba(255, 255, 255, 0.8)',
        // //     lineWidth: 2,
        // // });

        // const volumeSeries = newChart.addAreaSeries({
        //     topColor: 'rgba(255, 255, 255, 0.7)',
        //     bottomColor: 'rgba(255, 255, 255, 0.3)',
        //     lineColor: 'rgba(255, 255, 255, 0.8)',
        //     lineWidth: 2,
        // });



        // const movingAverage50Data = data.map((dataPoint, index): LineData => {
        //     const average = data
        //         .slice(Math.max(0, index - 50), index + 1)
        //         .reduce((acc, dataPoint) => acc + dataPoint.close, 0) / Math.min(index + 1, 50);
        //     return { time: dataPoint.time, value: average };
        // });

        // const movingAverage10Data = data.map((dataPoint, index): LineData => {
        //     const average = data
        //         .slice(Math.max(0, index - 10), index + 1)
        //         .reduce((acc, dataPoint) => acc + dataPoint.close, 0) / Math.min(index + 1, 10);
        //     return { time: dataPoint.time, value: average };
        // });

        // const movingAverage2Data = data.map((dataPoint, index): LineData => {
        //     const average = data
        //         .slice(Math.max(0, index - 2), index + 1)
        //         .reduce((acc, dataPoint) => acc + dataPoint.close, 0) / Math.min(index + 1, 2);
        //     return { time: dataPoint.time, value: average };
        // });

        // const volumeData = data.map((dataPoint): LineData => {
        //     return { time: dataPoint.time, value: Math.abs(dataPoint.close - dataPoint.open)  };
        // });

        // console.log("startTime:", (startTime - 20 * 1000))
        // console.log('date.now()', Date.now())
        const elapsedMs = Date.now() - (startTime - 20 * 1000);
        // console.log("elapsedMs:", elapsedMs)

        const dataToShow = data.filter((point) => point.elapsedTime <= elapsedMs).map((point) => point.dataPoint);
        // console.log("dataToShow:", dataToShow)

        candleSeries.setData(dataToShow);

        // Set timeout to update the chart every 100ms with the next data point
        const interval = setInterval(() => {
            const elapsedMs = Date.now() - (startTime - 20 * 1000);
            console.log("elapsedMs:", elapsedMs)
            const dataToShow = data.filter((point) => point.elapsedTime <= elapsedMs).map((point) => point.dataPoint);

            console.log("dataToShow.length:", dataToShow.length)

            candleSeries.setData(dataToShow);
        }, 100);

        return () => clearInterval(interval);
    }, [])

    return <div ref={chartContainerRef} className="h-[300px] lg:h-[500px] w-full border-b border-neutral-700 overflow-hidden" />
};

export default CandlestickChart;