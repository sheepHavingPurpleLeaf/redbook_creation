import React from 'react'
import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
    title: '小红书文案生成器',
    description: '为商家自动生成小红书文案的工具',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh">
            <body>
                <div className="flex flex-col min-h-screen">
                    <header className="bg-primary text-white p-4">
                        <div className="container mx-auto">
                            <h1 className="text-2xl font-bold">小红书文案生成器</h1>
                        </div>
                    </header>
                    <main className="flex-grow container mx-auto p-4">
                        {children}
                    </main>
                    <footer className="bg-gray-100 p-4">
                        <div className="container mx-auto text-center text-gray-500 text-sm">
                            © {new Date().getFullYear()} 小红书文案生成器
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    )
} 