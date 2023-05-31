'use client';
import './globals.css'
import { Inter } from 'next/font/google'

import { ThirdwebProvider, ChainId } from '@thirdweb-dev/react'

const currentChainId = ChainId.SolanaDevnet;

const inter = Inter({ subsets: ['latin'] })

// export const metadata = {
//   title: '🤓 Superteach Starter',
//   description: 'dApp de ejemplo para el curso de Superteach',
// }

export default function RootLayout({ children }) {
  return (
    <ThirdwebProvider chainId={currentChainId}>
      <html lang="es">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ThirdwebProvider>
  )
}
