import React from 'react';
import Image from "next/image";
import CrashChart from "../components/CrashChart.client";
import CandlestickChart from '@/components/CandlestickChart.client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {/* <CrashChart startAnimation={true} crashPoint={50} /> */}
      {/* <CandlestickChart /> */}
    </main>
  );
}
