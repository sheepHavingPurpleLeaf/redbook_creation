'use client'

import { useState } from 'react'
import { ContentPreviewProps } from '../utils/types'

export default function ContentPreview({ content, onRegenerate }: ContentPreviewProps) {
    const { title, content: bodyText, tags, images, briefData, keyContents } = content
    const [feedback, setFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 从briefData中提取核心卖点
    const corePoints = briefData ?
        Object.entries(briefData)
            .filter(([key]) => key.includes('核心卖点'))
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) :
        [];

    // 处理关键词内容
    const hasKeyContents = keyContents && Object.keys(keyContents).length > 0;

    // 关键词映射表
    const keywordDisplayNames: Record<string, string> = {
        brandIntro: "品牌介绍",
        productName: "产品名称",
        productSellingPoints: "产品卖点",
        secondarySellingPoints: "辅助卖点",
        productPainPoints: "产品痛点切入"
    };

    // 将所有提取的内容合并为一个数组，便于直接展示
    const allExtractedContent: { label: string, content: string }[] = [];

    if (keyContents) {
        // 按照以下顺序展示内容
        const orderedKeys = [
            "brandIntro",
            "productName",
            "productSellingPoints",
            "secondarySellingPoints",
            "productPainPoints"
        ];

        // 首先按照指定顺序添加
        for (const key of orderedKeys) {
            if (key in keyContents) {
                const values = keyContents[key];
                const displayName = keywordDisplayNames[key] || key;

                values.forEach(value => {
                    allExtractedContent.push({
                        label: displayName,
                        content: value
                    });
                });
            }
        }

        // 然后添加其他未在指定顺序中的内容
        for (const [key, values] of Object.entries(keyContents)) {
            if (!orderedKeys.includes(key)) {
                const displayName = keywordDisplayNames[key] || key;

                values.forEach(value => {
                    allExtractedContent.push({
                        label: displayName,
                        content: value
                    });
                });
            }
        }
    }

    const handleDownload = () => {
        const element = document.createElement('a')
        const fileContent = `标题：${title}\n\n${bodyText}\n\n${tags.join(' ')}`
        const file = new Blob([fileContent], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = '小红书文案.txt'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    const handleCopy = () => {
        const textToCopy = `${title}\n\n${bodyText}\n\n${tags.join(' ')}`
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('文案已复制到剪贴板！')
            })
            .catch(() => {
                alert('复制失败，请手动复制')
            })
    }

    const handleRegenerate = () => {
        if (!feedback.trim()) {
            alert('请输入修改意见')
            return
        }

        if (onRegenerate) {
            setIsSubmitting(true)
            try {
                onRegenerate(feedback)
            } catch (error) {
                console.error('重新生成失败:', error)
                alert('重新生成失败，请稍后再试')
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <div className="space-y-6">
            {corePoints.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
                        <h3 className="text-lg font-medium text-primary-700 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            产品核心卖点
                        </h3>
                    </div>
                    <div className="p-6 bg-white">
                        <div className="space-y-4">
                            {corePoints.map(([key, value], index) => (
                                <div key={key} className="flex items-start">
                                    <div className="h-8 w-8 rounded-full bg-primary-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                        {index + 1}
                                    </div>
                                    <div className="ml-4 bg-gray-50 p-4 rounded-lg border border-gray-100 flex-grow">
                                        <p className="text-gray-800">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="p-6">
                    <h3 className="text-2xl font-bold text-dark mb-6 pb-4 border-b border-gray-100">
                        {title}
                    </h3>
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed mb-6">
                        {bodyText}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-block bg-primary-50 px-3 py-1 rounded-full text-sm text-primary-600 border border-primary-100"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {images && images.length > 0 && (
                    <div className="border-t border-gray-100 p-6 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-600 mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            推荐使用的图片
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((imageUrl, index) => (
                                <div key={index} className="aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
                                    <img
                                        src={imageUrl}
                                        alt={`产品图片 ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {onRegenerate && (
                <div className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
                        <h3 className="text-lg font-medium text-amber-700 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            修改意见
                        </h3>
                    </div>
                    <div className="p-6 bg-white">
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm">对生成的内容不满意？请输入您的修改意见，我们将为您重新生成。</p>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px]"
                                placeholder="例如：希望文案更吸引年轻人、更加突出产品的性价比、增加更多关于产品功效的描述等"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                            <button
                                onClick={handleRegenerate}
                                disabled={isSubmitting || !feedback.trim()}
                                className="btn-primary py-3 px-6 flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        根据意见重新生成
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={handleCopy}
                    className="btn-primary flex-1 py-3 flex items-center justify-center shadow-button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    复制文案
                </button>
                <button
                    onClick={handleDownload}
                    className="btn-secondary flex-1 py-3 flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载文案
                </button>
            </div>
        </div>
    )
} 