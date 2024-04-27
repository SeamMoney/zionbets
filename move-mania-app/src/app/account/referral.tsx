//create a small section that shows the user their referral code and how many people they have referred

import { copyButton, referralContainer } from "../TailwindBase";
// import copy icon from react-icons        
//allow them to easily copy their referral code to the clipboard
import { FaCopy } from "react-icons/fa";
export default function ReferralSection({referralCode,referralCount}: {referralCode: string, referralCount: number}) {
    return (
        <div className={referralContainer}>
            <h1 className="text-xl font-bold mb-4">Referral Stats</h1>
            <div className="flex justify-between items-center">
                <div className="flex flex-row justify-between">
                <div>
                    <p className="text-sm uppercase">Referral Code</p>
                    <p className="text-lg font-medium">{referralCode}</p>
                </div>
                <div onClick={() => navigator.clipboard.writeText(referralCode)} className={copyButton}>
                    <FaCopy />
                </div>
                </div>
                <div>
                    <p className="text-sm uppercase">Referrals</p>
                    <p className="text-lg font-medium">{referralCount}</p>
                </div>
            </div>
        </div>
    );

}
