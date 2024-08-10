'use client';

import { SessionProvider } from 'next-auth/react';
import CrashProvider from './CrashProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <CrashProvider>
                {children}
            </CrashProvider>
        </SessionProvider>
    );
}