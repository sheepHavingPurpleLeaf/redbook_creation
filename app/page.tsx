'use client'

import { useState } from 'react'
import UploadForm from './components/UploadForm'
import ContentPreview from './components/ContentPreview'
import { ContentData } from './utils/types'

export default function Home() {
    const [generatedContent, setGeneratedContent] = useState<ContentData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleContentGeneration = (content: ContentData) => {
        setGeneratedContent(content)
        setIsLoading(false)
        setError(null)
    }

    const handleError = (errorMessage: string) => {
        setError(errorMessage)
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col space-y-8">
            <section className="max-w-4xl mx-auto w-full mb-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-primary-700 text-transparent bg-clip-text">
                        小红书AI文案生成器
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        基于先进的人工智能技术，一键生成符合小红书风格的营销文案和标题。提升转化率，让您的产品脱颖而出！
                    </p>
                </div>

                <div className="card overflow-visible">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            上传商品信息
                        </h2>
                    </div>

                    <div className="p-6">
                        <UploadForm
                            onGenerateStart={() => setIsLoading(true)}
                            onGenerateComplete={handleContentGeneration}
                            onError={handleError}
                        />
                    </div>
                </div>
            </section>

            {isLoading && (
                <div className="card p-8 flex justify-center items-center max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="inline-flex rounded-md bg-primary-50 p-4 mb-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-opacity-50 border-t-primary-500"></div>
                        </div>
                        <p className="text-lg font-medium text-gray-700">AI正在创作中，请稍候...</p>
                        <p className="text-gray-500 mt-2">我们正在根据您的商品信息生成优质文案</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="card p-6 max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold">生成失败</p>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {generatedContent && !isLoading && (
                <section className="card max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            生成的小红书文案
                        </h2>
                    </div>
                    <div className="p-6">
                        <ContentPreview content={generatedContent} />
                    </div>
                </section>
            )}
        </div>
    )
} 