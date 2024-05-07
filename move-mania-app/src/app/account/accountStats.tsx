import { getLpInfo } from '@/lib/aptos';
import React, { useState, useEffect } from 'react';
import { baseGreenOutline, gradientGlowBox, statContainer, statsContainer, statsText, statsTextSmall } from '../TailwindBase';

export default function AccountStats(account: any) {
    const [stats, setStats] = useState({
        bettingVolume: 0,
        totalBets: 0,
        totalAddedLiquidity: 0,
    });

    // useEffect(() => {
    //     async function fetchStats() {
    //         try {
    //             // Replace 'API_URL' with the actual API endpoint.
    //             // const response = await fetch('API_URL');
    //             const data = getLpInfo();
    //             // const data = await response.json();
    //             setStats({
    //                 // bettingVolume: data.bettingVolume||0,
    //                 // totalBets: data.totalBets||0,
    //                 // totalAddedLiquidity: data.totalAddedLiquidity||0,
                    
    //             });
    //         } catch (error) {
    //             console.error('Error fetching account stats:', error);
    //         }
    //     }

    //     fetchStats();
    // }, []);


      

    

    const stat_lst = [
        {title: "Betting Volume", value: `${stats.bettingVolume.toFixed(2)}`},
        {title: "Total Bets", value: stats.totalBets},
        {title: "Added Liquidity", value: stats.totalAddedLiquidity.toFixed(2)}
    ];

    return (
        <div>
        <div className={` text-white p-4 rounded-lg`}>
            
            <h1 className="text-xl font-bold mb-4 text-center">Account Stats</h1>
            <div className="flex justify-between items-center text-center">
               {stat_lst.map((stat, index) => <StatsItem key={index} title={stat.title} value={stat.value.toString()} />)}
            </div>
            </div>
        </div>
    );
};

function StatsItem({ title, value }: { title: string; value: string }) {
    return (
        <div className={statContainer}>
            <div className={statsText}>{value}</div>
            <div className={statsTextSmall}>{title}</div>
        </div>
    );
}