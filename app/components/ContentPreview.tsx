'use client'

import { ContentPreviewProps } from '../utils/types'

export default function ContentPreview({ content }: ContentPreviewProps) {
    const { title, content: bodyText, tags, images } = content

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

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <div className="p-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <div className="mt-4 whitespace-pre-line text-gray-700">
                        {bodyText}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-block bg-secondary px-3 py-1 rounded-full text-sm text-primary"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {images && images.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">推荐使用的图片</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {images.map((imageUrl, index) => (
                                <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`产品图片 ${index + 1}`}
                                    className="w-full h-24 object-cover rounded"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex space-x-4">
                <button
                    onClick={handleCopy}
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
                >
                    复制文案
                </button>
                <button
                    onClick={handleDownload}
                    className="flex-1 bg-white text-primary border border-primary py-2 px-4 rounded-md hover:bg-secondary transition"
                >
                    下载文案
                </button>
            </div>
        </div>
    )
} 