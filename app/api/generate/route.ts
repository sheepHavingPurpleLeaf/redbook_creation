import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { writeFile } from 'fs/promises'
import axios from 'axios'

// 火山引擎API配置
const VOLCANO_ENGINE_API_URL = process.env.VOLCANO_ENGINE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const VOLCANO_ENGINE_API_KEY = process.env.VOLCANO_ENGINE_API_KEY || ''
const VOLCANO_MODEL_ID = process.env.VOLCANO_MODEL_ID || 'ep-20250302190857-bwfd8'

// 创建临时文件夹用于保存上传的文件
const getTempDirectory = () => {
    const tempDir = path.join(process.cwd(), 'tmp')
    return tempDir
}

// 确保临时目录存在
const ensureTempDirectory = async () => {
    const tempDir = getTempDirectory()
    try {
        await fs.access(tempDir)
    } catch {
        await fs.mkdir(tempDir, { recursive: true })
    }
    return tempDir
}

// 处理multipart/form-data上传
async function handleFormData(req: NextRequest) {
    const formData = await req.formData()
    const tempDir = await ensureTempDirectory()

    // 处理brief文件
    const briefFile = formData.get('brief') as File
    if (!briefFile) {
        throw new Error('没有提供商品介绍文档')
    }

    const briefPath = path.join(tempDir, briefFile.name)
    const briefArrayBuffer = await briefFile.arrayBuffer()
    await writeFile(briefPath, Buffer.from(briefArrayBuffer))

    // 处理产品图片
    const images: string[] = []
    const imageFiles: File[] = []

    for (let [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
            imageFiles.push(value)

            const imagePath = path.join(tempDir, value.name)
            const imageArrayBuffer = await value.arrayBuffer()
            await writeFile(imagePath, Buffer.from(imageArrayBuffer))

            // 在实际环境中，这里可能需要将图片上传到CDN或者其他存储服务
            // 现在我们只是保存在本地，并返回一个临时URL供预览
            images.push(`/api/images/${value.name}`)
        }
    }

    if (imageFiles.length === 0) {
        throw new Error('没有提供产品图片')
    }

    // 读取brief文件内容
    const briefContent = await fs.readFile(briefPath, 'utf-8')

    // 读取小红书审核要求（假设存储在public目录下）
    let reviewRequirements = ''
    try {
        reviewRequirements = await fs.readFile(path.join(process.cwd(), 'public', 'docs', 'review_requirements.txt'), 'utf-8')
    } catch (err) {
        console.warn('无法读取小红书审核要求文件，将使用默认规则')
        reviewRequirements = '避免使用超链接、联系方式和营销用语'
    }

    return {
        briefContent,
        reviewRequirements,
        images,
        tempDir,
        imageFiles
    }
}

// 调用大模型API生成内容
async function generateContent(briefContent: string, reviewRequirements: string) {
    try {
        // 使用火山引擎的chat completions接口
        const response = await axios.post(VOLCANO_ENGINE_API_URL, {
            model: VOLCANO_MODEL_ID,
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的小红书内容创作专家，擅长根据商品信息生成符合小红书平台风格的文案。
请严格遵守以下小红书内容审核要求：
${reviewRequirements}`
                },
                {
                    role: "user",
                    content: `我需要你帮我根据以下商品信息生成一篇小红书风格的产品推广帖子：

商品信息：
${briefContent}

请按照以下格式生成内容：
1. 标题：（有吸引力的标题，不超过20字）
2. 正文：（详细的正文内容，500-800字左右，包含个人体验和感受）
3. 标签：（5-8个相关话题标签，每个标签以#开头）`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${VOLCANO_ENGINE_API_KEY}`,
                'Content-Type': 'application/json',
                'x-is-encrypted': 'true' // 开启推理会话应用层加密
            }
        });

        // 解析模型返回的内容
        const generatedText = response.data.choices[0].message.content;

        // 简单的内容解析，实际项目中可能需要更复杂的解析逻辑
        const titleMatch = generatedText.match(/标题[：:]\s*(.+)/);
        const title = titleMatch ? titleMatch[1].trim() : '新品分享';

        // 提取正文内容，去除标题和标签部分
        let content = generatedText
            .replace(/标题[：:]\s*.+\n/, '')
            .replace(/标签[：:]\s*(.+)/, '')
            .trim();

        // 提取标签
        const tagsMatch = generatedText.match(/标签[：:]\s*(.+)/);
        const tagsText = tagsMatch ? tagsMatch[1] : '#小红书 #好物分享';
        const tags = tagsText.split(/\s+/).map((tag: string) => {
            return tag.startsWith('#') ? tag : `#${tag}`;
        });

        return {
            title,
            content,
            tags
        };
    } catch (error) {
        console.error('调用大模型API失败:', error);
        throw new Error('生成内容失败，请稍后再试');
    }
}

export async function POST(req: NextRequest) {
    try {
        // 处理表单数据
        const { briefContent, reviewRequirements, images } = await handleFormData(req)

        // 调用API生成内容
        const generatedContent = await generateContent(briefContent, reviewRequirements)

        // 返回结果
        return NextResponse.json({
            title: generatedContent.title,
            content: generatedContent.content,
            tags: generatedContent.tags,
            images: images
        })
    } catch (error: any) {
        console.error('生成文案时出错:', error)
        return NextResponse.json(
            { success: false, message: error.message || '处理请求时出错' },
            { status: 400 }
        )
    }
} 