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
            <section className="bg-secondary rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">上传商品信息</h2>
                <UploadForm
                    onGenerateStart={() => setIsLoading(true)}
                    onGenerateComplete={handleContentGeneration}
                    onError={handleError}
                />
            </section>

            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="ml-3 text-gray-600">正在生成文案，请稍候...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p><strong>生成失败:</strong> {error}</p>
                </div>
            )}

            {generatedContent && !isLoading && (
                <section className="bg-white rounded-lg p-6 shadow border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">生成的小红书文案</h2>
                    <ContentPreview content={generatedContent} />
                </section>
            )}
        </div>
    )
} 