'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { UploadFormProps } from '../utils/types'

export default function UploadForm({ onGenerateStart, onGenerateComplete, onError }: UploadFormProps) {
    const [briefFile, setBriefFile] = useState<File | null>(null)
    const [images, setImages] = useState<File[]>([])
    const [generating, setGenerating] = useState(false)

    const onBriefDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setBriefFile(acceptedFiles[0])
        }
    }

    const { getRootProps: getBriefRootProps, getInputProps: getBriefInputProps } = useDropzone({
        onDrop: onBriefDrop,
        accept: {
            'text/plain': ['.txt'],
            'text/markdown': ['.md', '.markdown'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    })

    const onImagesDrop = (acceptedFiles: File[]) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!briefFile) {
            onError('请上传商品介绍文档')
            return
        }

        if (images.length === 0) {
            onError('请上传至少一张商品图片')
            return
        }

        setGenerating(true)
        onGenerateStart()

        try {
            const formData = new FormData()
            formData.append('brief', briefFile)

            images.forEach((image, index) => {
                formData.append(`image_${index}`, image)
            })

            const response = await axios.post('/api/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            onGenerateComplete(response.data)
        } catch (error) {
            let errorMessage = '生成文案时出错'
            if (axios.isAxiosError(error) && error.response) {
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
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    商品介绍文档 (Brief)
                </label>
                <div
                    {...getBriefRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${briefFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'
                        }`}
                >
                    <input {...getBriefInputProps()} />
                    {briefFile ? (
                        <div>
                            <p className="text-green-600 font-medium">{briefFile.name}</p>
                            <p className="text-sm text-gray-500">{(briefFile.size / 1024).toFixed(2)} KB</p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setBriefFile(null);
                                }}
                                className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                                移除
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-500">拖拽文件到此处，或点击上传</p>
                            <p className="text-xs text-gray-400 mt-1">支持 .txt, .md, .doc, .docx, .pdf 格式</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Product images upload */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    商品图片 (最多9张)
                </label>
                <div
                    {...getImagesRootProps()}
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition border-gray-300 hover:border-primary"
                >
                    <input {...getImagesInputProps()} />
                    <p className="text-gray-500">拖拽图片到此处，或点击上传</p>
                    <p className="text-xs text-gray-400 mt-1">支持 .jpg, .jpeg, .png 格式</p>
                </div>

                {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        {images.map((file, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Product image ${index + 1}`}
                                    className="h-24 w-24 object-cover rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={generating}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium ${generating ? 'bg-gray-400' : 'bg-primary hover:bg-red-600'
                        }`}
                >
                    {generating ? '生成中...' : '生成小红书文案'}
                </button>
            </div>
        </form>
    )
} 