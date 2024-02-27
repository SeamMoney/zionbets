"use client";
import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, isUTCTimestamp } from 'lightweight-charts';

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

    const generateData = (length: number): DataPoint[] => {
        const startDate = new Date(2014, 1, 1).getTime();
        const data: DataPoint[] = [];
        let time = Math.floor(startDate / 1000);

        for (let i = 0; i < length; i++) {
            const open = Math.random() * 100;
            const close = open * (Math.random() * 0.06 + 0.97);
            const high = Math.max(open, close) * (Math.random() * 0.03 + 1.01);
            const low = Math.min(open, close) * (Math.random() * 0.03 + 0.99);
            data.push({ time, open, high, low, close });
            time += 60 * 60 * 24;
        }

        return data.map((d, i, data) => enhanceDataItem(d, i, data));
    };

    const enhanceDataItem = (d: DataPoint, i: number, data: DataPoint[]): DataPoint => {
        const growthFactor = 0.1;
        d.close = Math.pow(1 + growthFactor, d.close);
        d.open = Math.pow(1 + growthFactor, d.open);
        d.high = Math.pow(1 + growthFactor, d.high);
        d.low = Math.pow(1 + growthFactor, d.low);
        return d;
    };

    const initialData = generateData(60);

    useEffect(() => {
        if (chartContainerRef.current) {
            const newChart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 500,
                layout: {
                    background: { color: '#253248' },
                    textColor: 'rgba(255, 255, 255, 0.9)',
                },
                grid: {
                    vertLines: {
                        color: '#334158',
                    },
                    horzLines: {
                        color: '#334158',
                    },
                },
                crosshair: {
                    mode: 0,
                },
                timeScale: {
                    borderColor: '#485c7b',
                },
            });

            const candleSeries = newChart.addCandlestickSeries({
                upColor: '#4bffb5',
                downColor: '#ff4976',
                borderDownColor: '#ff4976',
                borderUpColor: '#4bffb5',
                wickDownColor: '#838ca1',
                wickUpColor: '#838ca1',
            });

            candleSeries.setData(initialData);

            let frame = 0;
            let lastRender = Date.now();
            const renderInterval = 100;

            const animate = () => {
                const now = Date.now();
                if (now - lastRender < renderInterval) {
                    requestAnimationFrame(animate);
                    return;
                }
                lastRender = now;

                // Simplify the data generation for debugging
                const lastDataPoint = initialData[initialData.length - 1];
                const newTime = lastDataPoint.time + 60 * 60 * 24;
                const newDatum: DataPoint = {
                    time: newTime as UTCTimestamp,
                    open: lastDataPoint.close,
                    high: lastDataPoint.close * 1.05,
                    low: lastDataPoint.close * 0.95,
                    close: lastDataPoint.close * (Math.random() * 0.1 + 0.95),
                };

                initialData.shift();
                initialData.push(newDatum);

                candleSeries.update(newDatum);

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