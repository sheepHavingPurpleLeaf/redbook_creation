import React from 'react'
import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
    title: '小红书文案生成器',
    description: '基于AI的小红书文案智能生成工具',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh">
            <body className="antialiased">
                <div className="flex flex-col min-h-screen">
                    <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
                        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-semibold text-dark">小红书AI文案</h1>
                            </div>
                            <nav className="hidden md:flex space-x-6">
                                <a href="#" className="text-gray-600 hover:text-primary-500 font-medium">首页</a>
                                <a href="#" className="text-gray-600 hover:text-primary-500 font-medium">使用文档</a>
                                <a href="#" className="text-gray-600 hover:text-primary-500 font-medium">关于我们</a>
                            </nav>
                            <div className="flex items-center">
                                <a href="#" className="btn-ghost py-1 px-3 text-sm">登录</a>
                                <a href="#" className="btn-primary py-1 px-3 text-sm">注册</a>
                            </div>
                        </div>
                    </header>
                    <main className="flex-grow bg-gray-50 py-8">
                        <div className="container mx-auto px-4">
                            {children}
                        </div>
                    </main>
                    <footer className="bg-white border-t border-gray-100 py-6">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row justify-between items-center">
                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-800 font-medium">小红书AI文案</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-1">基于人工智能的小红书文案生成助手</p>
                                </div>
                                <div className="flex flex-col md:flex-row md:space-x-8 items-center">
                                    <div className="flex space-x-4 mb-4 md:mb-0">
                                        <a href="#" className="text-gray-500 hover:text-primary-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                                            </svg>
                                        </a>
                                        <a href="#" className="text-gray-500 hover:text-primary-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                                            </svg>
                                        </a>
                                    </div>
                                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} 小红书AI文案 版权所有</p>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    )
} 