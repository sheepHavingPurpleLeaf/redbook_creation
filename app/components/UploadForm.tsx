'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { UploadFormProps } from '../utils/types'

export default function UploadForm({ onGenerateStart, onGenerateComplete, onError }: UploadFormProps) {
    const [briefFile, setBriefFile] = useState<File | null>(null)
    const [images, setImages] = useState<File[]>([])
    const [generating, setGenerating] = useState(false)
    const [debugInfo, setDebugInfo] = useState<string | null>(null)

    const onBriefDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            console.log('文件已选择:', acceptedFiles[0].name, acceptedFiles[0].type)
            setBriefFile(acceptedFiles[0])
        }
    }

    const { getRootProps: getBriefRootProps, getInputProps: getBriefInputProps } = useDropzone({
        onDrop: onBriefDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1
    })

    const onImagesDrop = (acceptedFiles: File[]) => {
        console.log('已选择图片:', acceptedFiles.length, '张')
        setImages(prev => [...prev, ...acceptedFiles])
    }

    const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
        onDrop: onImagesDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxFiles: 9
    })

    const handleDownloadTemplate = () => {
        const link = document.createElement('a')
        link.href = '/brief_template.xlsx'
        link.download = 'brief_template.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // 用于调试Excel文件的函数
    const handleDebugExcel = async () => {
        if (!briefFile) {
            setDebugInfo('没有选择文件')
            return
        }

        try {
            setDebugInfo('正在检查文件和生成prompt...')
            const formData = new FormData()
            formData.append('brief', briefFile)

            const response = await axios.post('/api/preview-prompt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            setDebugInfo(JSON.stringify(response.data, null, 2))
        } catch (error) {
            console.error('调试Excel失败:', error)
            setDebugInfo('调试失败: ' + (axios.isAxiosError(error) && error.response ?
                JSON.stringify(error.response.data) :
                '未知错误'))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!briefFile) {
            onError('请上传商品介绍文档')
            return
        }

        setGenerating(true)
        setDebugInfo(null)
        onGenerateStart()
        console.log('开始生成文案，发送请求...')

        try {
            const formData = new FormData()
            formData.append('brief', briefFile)

            images.forEach((image, index) => {
                formData.append(`image_${index}`, image)
            })

            console.log('发送文件:', briefFile.name, briefFile.type, briefFile.size, 'bytes')
            console.log('发送图片数量:', images.length)

            const response = await axios.post('/api/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log('收到响应:', response.data)
            onGenerateComplete(response.data)
        } catch (error) {
            console.error('生成文案错误:', error)
            let errorMessage = '生成文案时出错'
            if (axios.isAxiosError(error) && error.response) {
                console.error('错误详情:', error.response.data)
                errorMessage = error.response.data.message || errorMessage
            }
            onError(errorMessage)
        } finally {
            setGenerating(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Brief file upload */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        商品介绍文档 (Brief)
                    </label>
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-sm text-primary-500 hover:text-primary-700 flex items-center transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        下载模板
                    </button>
                </div>
                <div
                    {...getBriefRootProps()}
                    className={`dropzone ${briefFile ? 'dropzone-active' : 'dropzone-idle'}`}
                >
                    <input {...getBriefInputProps()} />
                    {briefFile ? (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 mb-3 rounded-full bg-primary-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-primary-600 font-medium">{briefFile.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{(briefFile.size / 1024).toFixed(2)} KB</p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setBriefFile(null);
                                }}
                                className="mt-3 text-xs btn-ghost py-1 px-2 rounded-md"
                            >
                                移除
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium">拖拽文件到此处，或点击上传</p>
                            <p className="text-xs text-gray-400 mt-1">仅支持 .xlsx 格式的Excel文件</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Product images upload */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    商品图片 (最多9张)
                </label>
                <div
                    {...getImagesRootProps()}
                    className="dropzone dropzone-idle"
                >
                    <input {...getImagesInputProps()} />
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">拖拽图片到此处，或点击上传</p>
                        <p className="text-xs text-gray-400 mt-1">支持 .jpg, .jpeg, .png 格式</p>
                    </div>
                </div>

                {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((file, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Product image ${index + 1}`}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-4 space-y-3">
                <button
                    type="submit"
                    disabled={generating}
                    className="btn-primary w-full py-3 flex items-center justify-center shadow-button"
                >
                    {generating ? (
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            生成小红书文案
                        </>
                    )}
                </button>

                {briefFile && (
                    <button
                        type="button"
                        onClick={handleDebugExcel}
                        className="btn-secondary w-full py-2 text-sm flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        预览提取结果和Prompt
                    </button>
                )}
            </div>

            {debugInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-700 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            调试信息
                        </h4>
                        <button
                            type="button"
                            onClick={() => setDebugInfo(null)}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                            关闭
                        </button>
                    </div>
                    <pre className="text-xs overflow-auto max-h-60 p-3 bg-gray-100 rounded-lg">{debugInfo}</pre>
                </div>
            )}
        </form>
    )
} 