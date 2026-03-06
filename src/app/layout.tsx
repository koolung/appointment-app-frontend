import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Salon Booking Platform',
  description: 'Book your salon appointments online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
