'use client';

import { getCrashCalculationEvents, getDeposits, getExtracts, getLPCoinSupply, getLockedLPCoinSupply, getLocks, getPoolAptSupply, getPuts, getWithdrawals } from "@/lib/aptos";
import { CrosshairMode, createChart } from "lightweight-charts";
import { useEffect, useRef } from "react";

export default function PoolGraph() {

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    if (!chartContainerRef.current) return;

    const newChart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        layout: {
            background: { color: '#000' },
            textColor: '#22c55e',
            fontFamily: "'Roboto Mono', sans-serif",
        },
        grid: {
            vertLines: { color: '#333333' },
            horzLines: { color: '#333333' },
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
            borderColor: '#333333',
            barSpacing: 15,
            
        },
        rightPriceScale: {  
            borderColor: '#333333',

            scaleMargins: {
                bottom: 0,
            }
            // visible: false,
        },
        handleScale: false, 
        handleScroll: false

    });

    const areaSeries = newChart.addAreaSeries({
        topColor: '#AC2F57',
        bottomColor: 'black',
        lineColor: '#AC2F57',
        lineWidth: 2,
    });    

    // Create some dummy data showing the zAPT supply of the pool over the last two months. Show the 
    // supply increasing over time, with a few dips here and there. Not a regular pattern, but a
    // general upward trend.
    const data = [];
    let value = 0;
    for (let i = 0; i < 100; i++) {
        const time = new Date(Date.now() - (100 - i) * 1000 * 60 * 60 * 24);
        data.push({ time: time.toISOString().split('T')[0], value });
        value += Math.random() * 10 - 2;
    }

    areaSeries.setData(data);

    

    // Set timeout to update the chart every 100ms with the next data point
    const interval = setInterval(() => {
        
    }, 100);

    return () => clearInterval(interval);
}, [])

  useEffect(() => {
    getDeposits().then((deposits) => {
    });

    getWithdrawals().then((withdrawals) => {
    });

    getExtracts().then((extracts) => {
    });

    getPuts().then((puts) => {
    });

    getLocks().then((locks) => {
    });

    getPoolAptSupply().then((supply) => {
    });

    getLPCoinSupply().then((supply) => {
    });

    getLockedLPCoinSupply().then((supply) => {
    });

    getCrashCalculationEvents().then((events) => {
    });
  })

  return <div ref={chartContainerRef} className="h-[300px] w-full border-b border-neutral-700 overflow-hidden" />
}