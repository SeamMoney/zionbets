"use client";
import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, isUTCTimestamp, CrosshairMode } from 'lightweight-charts';
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
    data: DataPoint[];
}) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi | null>(null);
    
    useEffect(() => {

        if (!chartContainerRef.current) return;

        const newChart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 500,
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
                // visible: false,
                borderVisible: true,
                secondsVisible: false,
                timeVisible: false,
                ticksVisible: false,
                borderColor: '#485c7b',
                barSpacing: 15,
            },
            rightPriceScale: {  
                // visible: false,
            },

        });


        const candleSeries = newChart.addCandlestickSeries({

            upColor: 'white',
            wickUpColor: '#39FF14',
            wickDownColor: '#39FF14',
            downColor: 'rgba(0, 0, 0, 0)',
            borderVisible: true,
            borderColor: '#39FF14'
        });

        candleSeries.setData(data);
    }, [])

    // const generateData = (): DataPoint[] => {
        
    // };

    // const initialData = data;

    // useEffect(() => {
    //     // console.log("CandlestickChart useEffect called")
    //     console.log("provided data:", data)
    //     const initializeChart = () => {

    //         if (!chartContainerRef.current) return;
            
    //         const newChart = createChart(chartContainerRef.current, {
    //             width: chartContainerRef.current.clientWidth,
    //             height: 500,
    //             layout: {
    //                 background: { color: '#000' },
    //                 textColor: '#33cc33',
    //                 fontFamily: "'Roboto Mono', sans-serif",
    //             },
    //             grid: {
    //                 vertLines: { color: '#33333350' },
    //                 horzLines: { color: '#33333350' },
    //             },
    //             crosshair: {
    //                 mode: CrosshairMode.Hidden,
    //                 // vertLine: {
    //                 //     width: 2,
    //                 //     color: '#333',
    //                 //     labelBackgroundColor: '#333',
    //                 // },
    //                 // horzLine: {
    //                 //     color: '#333',
    //                 //     labelBackgroundColor: '#333',
    //                 //     width: 2,
    //                 // },
    //             },
    //             timeScale: {
    //                 // visible: false,
    //                 borderVisible: true,
    //                 secondsVisible: false,
    //                 timeVisible: false,
    //                 ticksVisible: false,
    //                 borderColor: '#485c7b',
    //                 barSpacing: 15,
    //             },
    //             rightPriceScale: {  
    //                 visible: false,
    //             },

    //         });


    //         const candleSeries = newChart.addCandlestickSeries({

    //             upColor: 'white',
    //             wickUpColor: '#39FF14',
    //             wickDownColor: '#39FF14',
    //             downColor: 'rgba(0, 0, 0, 0)',
    //             borderVisible: true,
    //             borderColor: '#39FF14'
    //         });

    //         let lastRender = Date.now();
    //         const renderInterval = 100;

    //         let lastDate = new Date("2023-09-27T00:00:00Z");
    //         let index = 0;
    //         const baseTimestamp = Date.now();
    //         // const animate = () => {
    //         //     const now = Date.now();
    //         //     if (now - lastRender < renderInterval) {
    //         //         requestAnimationFrame(animate);
    //         //         return;
    //         //     }
    //         //     lastRender = now;

    //         //     const lastDataPoint = initialData[initialData.length - 1];
    //         //     const currentCrashPoint = startTime + (crashPoint * 1000) - Date.now();

    //         //     let indexToUse = index % data.length;
    //         //     const hexChar = data[indexToUse];
    //         //     const hexValue = parseInt(hexChar, 16);

    //         //     const newTimestamp = baseTimestamp + (index * 1000);
    //         //     lastDate.setDate(lastDate.getDate() + 1);

    //         //     const value = hexValue * crashPoint;

    //         //     // If round has not started, don't use the data yet and instead just animate the chart trading sideways with some ranomd noise
    //         //     if (now < startTime) {
    //         //         const open = lastDataPoint.close;
    //         //         const close = open + (Math.random() * 0.4) - 0.2;
    //         //         const high = Math.max(open, close) + (open * Math.random() * 0.00005);
    //         //         const low = Math.min(open, close) - (open * Math.random() * 0.00005);
    //         //         const datum: DataPoint = {
    //         //             time: newTimestamp as UTCTimestamp,
    //         //             open,
    //         //             high,
    //         //             low,
    //         //             close,
    //         //         };
    //         //         initialData.shift();
    //         //         initialData.push(datum);
    //         //         candleSeries.update(datum);
    //         //         index++;
    //         //         requestAnimationFrame(animate);
    //         //     } else if (now > startTime + crashPoint * 1000) {
    //         //         const open = lastDataPoint.close;
    //         //         const close = 0;
    //         //         const high = Math.max(open, close) + (open * Math.random() * 0.005);
    //         //         const low = 0;
    //         //         const datum: DataPoint = {
    //         //             time: newTimestamp as UTCTimestamp,
    //         //             open,
    //         //             high,
    //         //             low,
    //         //             close,
    //         //         };
    //         //         initialData.shift();
    //         //         initialData.push(datum);
    //         //         candleSeries.update(datum);
    //         //         index++;
    //         //         requestAnimationFrame(animate);
    //         //     } else {

    //         //         if (![1, 3, 5, 7, 9, 13].includes(hexValue)) {
    //         //             const open: number = initialData.length === 0 ? 50 : lastDataPoint.close ;
    //         //             const close = open + value;
    //         //             const high = close + (Math.random() * 5);
    //         //             const low = open - (Math.random() * 5);
    //         //             // dataPoints.push({ time: timeString, open, high, low, close });
    //         //             // currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));

    //         //             const datum: DataPoint = {
    //         //                 time: newTimestamp as UTCTimestamp,
    //         //                 open,
    //         //                 high,
    //         //                 low,
    //         //                 close,
    //         //             };

    //         //             console.log("Updating chart with new data point:", datum);

    //         //             initialData.shift();
    //         //             initialData.push(datum);
    //         //             candleSeries.update(datum);

    //         //         } else {
    //         //             const open: number = initialData.length === 0 ? 50 : lastDataPoint.close ;
    //         //             const close = open - value;
    //         //             const high = close + (Math.random() * 5);
    //         //             const low = open - (Math.random() * 5);
    //         //             // dataPoints.push({ time: timeString, open, high, low, close });
    //         //             // currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));

    //         //             const datum: DataPoint = {
    //         //                 time: newTimestamp as UTCTimestamp,
    //         //                 open,
    //         //                 high,
    //         //                 low,
    //         //                 close,
    //         //             };

    //         //             console.log("Updating chart with new data point:", datum);

    //         //             initialData.shift();
    //         //             initialData.push(datum);
    //         //             candleSeries.update(datum);

    //         //         }

                    
    //         //         // console.log("Animating...");

    //         //         // if (initialData.length > 0) {
    //         //         //     const newTimestamp = baseTimestamp + (index * 1000);
    //         //         //     const lastDataPoint = initialData[initialData.length - 1];
    //         //         //     // console.log("Before updating initialData, last data point time:", lastDataPoint.time);

    //         //         //     // console.log("Attempting to create Date object from:", lastDataPoint.time + 'T00:00:00Z');
    //         //         //     // console.log(new Date("2023-09-27T00:00:00Z"));

    //         //         //     lastDate.setDate(lastDate.getDate() + 1);
    //         //         //     // console.log(lastDate.toISOString());
    //         //         //     const newTime: UTCTimestamp = Math.floor(lastDate.getTime() / 1000) as unknown as UTCTimestamp;

    //         //         //     if (isNaN(lastDate.getTime())) {
    //         //         //         // console.error("Constructed date is invalid, skipping update for this cycle.");
    //         //         //         requestAnimationFrame(animate);
    //         //         //         return;
    //         //         //     }

    //         //         //     const newTimeString = lastDate.toISOString().split('T')[0];

    //         //         //     let index = initialData.length;
    //         //         //     let baseValue = (50 * (newTimestamp - baseTimestamp) ) + (Math.pow(1.0001, index));
    //         //         //     const open = baseValue;
    //         //         //     const randomFactor = (Math.random() * 0.4) - 0.2;
    //         //         //     const close = open + (open * randomFactor);
    //         //         //     const high = Math.max(open, close) + (open * Math.random() * 0.05);
    //         //         //     const low = Math.min(open, close) - (open * Math.random() * 0.05);

    //         //         //     const newDatum: DataPoint = {
    //         //         //         time: newTimestamp as UTCTimestamp,
    //         //         //         open: baseValue,
    //         //         //         high,
    //         //         //         low,
    //         //         //         close,
    //         //         //     };

    //         //         //     initialData.shift();
    //         //         //     initialData.push(newDatum);

    //         //         //     // console.log("After updating initialData, last data point time:", newDatum.time);
    //         //         //     // console.log("Updating chart with new data point:", newDatum);
    //         //         //     candleSeries.update(newDatum);
    //         //         // } else {
    //         //         //     // console.error("initialData is empty");
    //         //         // }

    //         //         index++;

    //         //         requestAnimationFrame(animate);
    //         //     }
    //         // };

    //         // animate();

    //         chart.current = newChart;

    //         return () => {
    //             if (chart.current) {
    //                 chart.current.remove();
    //                 chart.current = null;
    //             }
    //         };
    //     };

    //     if (document.readyState === "complete") {
    //         initializeChart();
    //     } else {
    //         window.addEventListener("load", initializeChart);
    //         return () => window.removeEventListener("load", initializeChart);
    //     }

    // }, []);

    return <div ref={chartContainerRef} className="chart-container" style={{ width: '100%', height: '500px' }} />;
};

export default CandlestickChart;