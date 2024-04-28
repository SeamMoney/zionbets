export const baseGreenOutline = `outline outline-green-500 outline-offset-2 outline-4`;
export const QuestBase = `
    flex flex-row m-10
    rounded-xl
    p-6
    justify-between
    ${baseGreenOutline}
    shadow-[10px_10px_rgba(0,_158,_90,_0.5),_10px_10px_rgba(0,_158,_90,_0.5),_15px_15px_rgba(0,_158,_90,_0.5),_20px_20px_rgba(0,_158,_90,_0.5),_25px_25px_rgba(0,_158,_90,_0.5)]
`;
export const referralContainer = ` 
    text-white p-4  m-4 rounded-xl
    ${baseGreenOutline}
`;

export const statsContainer = `m-4 rounded-xl 
    flex flex-col justify-center items-center
`;
export const statContainer = `flex flex-col justify-center items-center w-1/3 h-80 p-6 m-6`;

export const statsText = `text-white text-2xl font-bold text-green-400`;
export const statsTextSmall = `text-white text-md font-bold opacity-60`;

export const iconButton ="h-10 w-10 p-2";

export const copyButton = `bg-green-500 rounded-lg p-2 m-4 cursor-pointer h-10 w-10 hover:bg-opacity-50 items-center content-center justify-center`;
export const gradientGlowBox = `-inset-2 rounded-lg bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-red-600 via-fuchsia-600 to-gray-600 opacity-50 blur-2xl>`;