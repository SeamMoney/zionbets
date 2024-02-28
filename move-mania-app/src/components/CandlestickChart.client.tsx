"use client";
import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, isUTCTimestamp, CrosshairMode } from 'lightweight-charts';
import "../app/globals.css";

interface DataPoint {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    highlight?: boolean;
    offset?: number;
}

const CandlestickChart: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi | null>(null);

    const generateData = (): DataPoint[] => {
        const data: DataPoint[] = [];
        let currentDate = new Date('2021-01-01T00:00:00Z');

        let trend = 0.1;
        let accumulatedTrend = 0;

        for (let index = 0; index < 1000; index++) {
            let baseValue = 50 + (Math.pow(2, index));

            const randomFactor = (Math.random() * 0.8) - 0.4;
            const open = baseValue;
            const close = open + (open * randomFactor);
            const high = Math.max(open, close) + (open * Math.random() * 0.2);
            const low = Math.min(open, close) - (open * Math.random() * 0.2);
            const timeString = currentDate.toISOString().split('T')[0];
            data.push({ time: timeString, open, high, low, close });

            currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
        }

        return data;
    };

    const enhanceDataItem = (d: DataPoint, i: number, data: DataPoint[]): DataPoint => {
        const growthFactor = 0.1;
        d.close = Math.pow(1 + growthFactor, d.close);
        d.open = Math.pow(1 + growthFactor, d.open);
        d.high = Math.pow(1 + growthFactor, d.high);
        d.low = Math.pow(1 + growthFactor, d.low);
        return d;
    };

    const initialData = generateData().map(enhanceDataItem);

    useEffect(() => {
        function formatDate(date: string | { day: number; month: number; year: number }): string {
            if (typeof date === 'object') {
                return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
            }
            return date;
        }

        const initializeChart = () => {
            if (chartContainerRef.current) {
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
                        mode: CrosshairMode.Normal,
                        vertLine: {
                            width: 2,
                            color: '#333',
                            labelBackgroundColor: '#333',
                        },
                        horzLine: {
                            color: '#333',
                            labelBackgroundColor: '#333',
                            width: 2,
                        },
                    },
                    timeScale: {
                        borderColor: '#485c7b',
                        barSpacing: 15,
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

                let lastRender = Date.now();
                const renderInterval = 100;

                let lastDate = new Date("2023-09-27T00:00:00Z");
                let secondsCounter = 1;
                const baseTimestamp = Date.now();
                const animate = () => {
                    const now = Date.now();
                    if (now - lastRender < renderInterval) {
                        requestAnimationFrame(animate);
                        return;
                    }
                    lastRender = now;

                    console.log("Animating...");

                    if (initialData.length > 0) {
                        const newTimestamp = baseTimestamp + (secondsCounter * 1000);
                        const lastDataPoint = initialData[initialData.length - 1];
                        console.log("Before updating initialData, last data point time:", lastDataPoint.time);

                        console.log("Attempting to create Date object from:", lastDataPoint.time + 'T00:00:00Z');
                        console.log(new Date("2023-09-27T00:00:00Z"));

                        lastDate.setDate(lastDate.getDate() + 1);
                        console.log(lastDate.toISOString());
                        const newTime: UTCTimestamp = Math.floor(lastDate.getTime() / 1000) as unknown as UTCTimestamp;

                        if (isNaN(lastDate.getTime())) {
                            console.error("Constructed date is invalid, skipping update for this cycle.");
                            requestAnimationFrame(animate);
                            return;
                        }

                        const newTimeString = lastDate.toISOString().split('T')[0];

                        let index = initialData.length;
                        let baseValue = 50 + (Math.pow(1.0001, index));
                        const open = baseValue;
                        const randomFactor = (Math.random() * 0.4) - 0.2;
                        const close = open + (open * randomFactor);
                        const high = Math.max(open, close) + (open * Math.random() * 0.05);
                        const low = Math.min(open, close) - (open * Math.random() * 0.05);

                        const newDatum: DataPoint = {
                            time: newTimestamp as UTCTimestamp,
                            open: baseValue,
                            high,
                            low,
                            close,
                        };

                        initialData.shift();
                        initialData.push(newDatum);

                        console.log("After updating initialData, last data point time:", newDatum.time);
                        console.log("Updating chart with new data point:", newDatum);
                        candleSeries.update(newDatum);
                    } else {
                        console.error("initialData is empty");
                    }

                    secondsCounter++;

                    requestAnimationFrame(animate);
                };

                animate();

                chart.current = newChart;

                return () => {
                    if (chart.current) {
                        chart.current.remove();
                        chart.current = null;
                    }
                };
            }
        };

        if (document.readyState === "complete") {
            initializeChart();
        } else {
            window.addEventListener("load", initializeChart);
            return () => window.removeEventListener("load", initializeChart);
        }

    }, []);

    const simulateData = (candleSeries: ISeriesApi<"Candlestick">) => {
        let internalTime = Math.floor(Date.now() / 1000);

        let value = 50;

        const nextCandle = () => {
            internalTime += 60 * 60 * 1000;
            const open = value;
            const close = value * (Math.random() * 0.06 + 0.97);
            const high = Math.max(open, close) * (Math.random() * 0.03 + 1.01);
            const low = Math.min(open, close) * (Math.random() * 0.03 + 0.99);
            value = close;

            if (chart.current) {
                candleSeries.update({
                    time: internalTime as UTCTimestamp,
                    open,
                    high,
                    low,
                    close,
                });
            }

            requestAnimationFrame(nextCandle);
        };

        nextCandle();
    };

    return <div ref={chartContainerRef} className="chart-container" style={{ width: '100%', height: '500px' }} />;
};

export default CandlestickChart;