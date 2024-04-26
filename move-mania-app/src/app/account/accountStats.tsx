import { getLpInfo } from '@/lib/aptos';
import React, { useState, useEffect } from 'react';

export default function AccountStats(account: any) {
    const [stats, setStats] = useState({
        bettingVolume: 0,
        totalBets: 0,
        totalAddedLiquidity: 0,
    });
    // const add

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

    return (
        <div className="bg-purple-900 text-white p-4 rounded-lg">
            <h1 className="text-xl font-bold mb-4">Account Stats</h1>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-sm uppercase">Betting Volume</div>
                    <div className="text-lg font-medium">{`$${stats.bettingVolume.toFixed(2)}`}</div>
                </div>
                <div>
                    <div className="text-sm uppercase">Total Bets</div>
                    <div className="text-lg font-medium">{stats.totalBets}</div>
                </div>
                <div>
                    <div className="text-sm uppercase">Total Added Liquidity</div>
                    <div className="text-lg font-medium">{`$${stats.totalAddedLiquidity.toFixed(2)}`}</div>
                </div>
            </div>
        </div>
    );
};
