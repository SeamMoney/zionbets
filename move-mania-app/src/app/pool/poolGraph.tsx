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

    // Set timeout to update the chart every 100ms with the next data point
    const interval = setInterval(() => {
        
    }, 100);

    return () => clearInterval(interval);
}, [])

  useEffect(() => {
    getDeposits().then((deposits) => {
      console.log('deposits: ', deposits);
    });

    getWithdrawals().then((withdrawals) => {
      console.log('withdrawals: ', withdrawals);
    });

    getExtracts().then((extracts) => {
      console.log('extracts: ', extracts);
    });

    getPuts().then((puts) => {
      console.log('puts: ', puts);
    });

    getLocks().then((locks) => {
      console.log('locks: ', locks);
    });

    getPoolAptSupply().then((supply) => {
      console.log('supply: ', supply);
    });

    getLPCoinSupply().then((supply) => {
      console.log('lp coin supply: ', supply);
    });

    getLockedLPCoinSupply().then((supply) => {
      console.log('locked lp coin supply: ', supply);
    });

    getCrashCalculationEvents().then((events) => {
      console.log('events: ', events);
    });
  })

  return <div ref={chartContainerRef} className="h-[300px] lg:h-[500px] w-full border-b border-neutral-700 overflow-hidden" />
}