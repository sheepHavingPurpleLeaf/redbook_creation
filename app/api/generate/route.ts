import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { writeFile } from 'fs/promises'
import axios from 'axios'
import * as xlsx from 'xlsx'

// 火山引擎API配置
const VOLCANO_ENGINE_API_URL = process.env.VOLCANO_ENGINE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const VOLCANO_ENGINE_API_KEY = process.env.VOLCANO_ENGINE_API_KEY || ''
const VOLCANO_MODEL_ID = process.env.VOLCANO_MODEL_ID || 'ep-20250302190857-bwfd8'

// 创建临时文件夹用于保存上传的文件
const getTempDirectory = () => {
    return path.join(process.cwd(), 'tmp')
}

// 确保临时目录存在
const ensureTempDirectory = async () => {
    const tempDir = getTempDirectory()
    try {
        await fs.access(tempDir)
    } catch {
        try {
            await fs.mkdir(tempDir, { recursive: true })
            // 确保目录有正确的权限
            await fs.chmod(tempDir, 0o777)
        } catch (error) {
            console.error('创建临时目录失败:', error)
            throw new Error(`无法创建临时目录: ${error}`)
        }
    }
    return tempDir
}

// 处理multipart/form-data上传
async function handleFormData(req: NextRequest) {
    console.log('开始处理表单数据')
    const formData = await req.formData()

    // 打印所有表单键值，帮助调试
    console.log('表单键值:')
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`- ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`)
        } else {
            console.log(`- ${key}: ${value}`)
        }
    }

    // 处理brief文件
    const briefFile = formData.get('brief') as File
    if (!briefFile) {
        console.error('表单中没有brief文件字段')
        throw new Error('没有提供商品介绍文档')
    }

    if (!(briefFile instanceof File)) {
        console.error(`brief不是File对象: ${typeof briefFile}`, briefFile)
        throw new Error('提供的商品介绍文档无效')
    }

    console.log('收到brief文件:', briefFile.name, briefFile.type, briefFile.size, 'bytes')

    // 检查文件类型
    if (!briefFile.name.endsWith('.xlsx')) {
        throw new Error('只支持Excel (.xlsx)格式的商品介绍文档')
    }

    // 读取Excel文件
    let columnMappings: Record<string, string> = {}
    let keyContents: Record<string, string[]> = {};  // 新增关键词内容映射
    let briefContent = '品牌简介：\n\n'

    try {
        console.log('开始从内存读取Excel数据')
        const arrayBuffer = await briefFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 使用xlsx从缓冲区读取数据
        const workbook = xlsx.read(buffer, { type: 'buffer' })
        console.log('工作表名称:', workbook.SheetNames)

        if (workbook.SheetNames.length === 0) {
            throw new Error('Excel文件中没有工作表')
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        console.log('正在解析Excel数据')

        const rawRange = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        console.log('表格范围:', worksheet['!ref'])

        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 'A' })
        console.log('读取到', jsonData.length, '行数据')

        // 定义要查找的关键词映射
        const keywordMap: Record<string, string> = {
            "品牌介绍": "brandIntro",
            "产品名称": "productName",
            "产品卖点": "productSellingPoints",
            "核心卖点": "productSellingPoints", // 兼容"核心卖点"
            "辅助卖点": "secondarySellingPoints", // 新增辅助卖点
            "产品痛点切入": "productPainPoints"
        };

        // 记录所有的列键
        const allKeys: string[] = [];
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as Record<string, any>;
            for (const key in row) {
                if (!allKeys.includes(key)) {
                    allKeys.push(key);
                }
            }
        }
        allKeys.sort(); // 确保列名按字母顺序排序
        console.log('表格所有列:', allKeys);

        // 查找包含关键词的单元格，并提取该行右侧的所有单元格内容
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as Record<string, any>;
            let foundKeyword = false;
            let keyword = "";
            let keyColumn = "";

            // 首先查找是否有包含关键词的单元格
            for (const key in row) {
                const cellValue = String(row[key] || '');
                for (const keywordText in keywordMap) {
                    if (cellValue.includes(keywordText)) {
                        foundKeyword = true;
                        keyword = keywordText;
                        keyColumn = key;
                        console.log(`在第 ${i + 1} 行找到关键词 "${keywordText}" 在列 ${key}`);
                        break;
                    }
                }

                if (foundKeyword) break;
            }

            // 如果找到关键词，提取右侧的内容
            if (foundKeyword && keyword && keyColumn) {
                const mappedKey = keywordMap[keyword];
                const rightContent: string[] = [];

                // 获取当前行右侧的所有单元格内容
                const colIndex = keyColumn.charCodeAt(0) - 'A'.charCodeAt(0);
                for (let j = colIndex + 1; j < allKeys.length; j++) {
                    const nextColKey = String.fromCharCode('A'.charCodeAt(0) + j);
                    if (nextColKey in row) {
                        const content = String(row[nextColKey] || '').trim();
                        if (content) {
                            rightContent.push(content);
                        }
                    }
                }

                if (rightContent.length > 0) {
                    keyContents[mappedKey] = rightContent;
                    console.log(`提取到 "${keyword}" 右侧内容:`, rightContent);

                    // 同时将内容添加到briefContent
                    briefContent += `${keyword}: ${rightContent.join(' ')}\n`;
                }
            }
        }

        // 构建列名与值的映射 (保留原来的逻辑为了兼容)
        const specificColumns = ['品牌名称', '产品名称', '核心卖点 1', '核心卖点 2', '核心卖点 3', '目标用户', '价格']

        // 查找列名所在的行和对应的值
        let headerRow = -1

        // 找到包含列名的行
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as Record<string, any>
            let foundHeader = false

            for (const key in row) {
                const cellValue = String(row[key] || '')
                if (specificColumns.includes(cellValue)) {
                    console.log(`在第 ${i + 1} 行找到列标题 "${cellValue}"`)
                    foundHeader = true
                    break
                }
            }

            if (foundHeader) {
                headerRow = i
                break
            }
        }

        console.log('表头行索引:', headerRow)

        if (headerRow !== -1) {
            const headerRowData = jsonData[headerRow] as Record<string, any>
            const valueRowData = jsonData[headerRow + 1] as Record<string, any>

            console.log('表头行数据:', headerRowData)
            console.log('数据行:', valueRowData ? '找到' : '未找到')

            // 建立列名与值的映射
            for (const key in headerRowData) {
                const columnName = String(headerRowData[key] || '')
                if (specificColumns.includes(columnName) && valueRowData && key in valueRowData) {
                    const value = String(valueRowData[key] || '')
                    columnMappings[columnName] = value
                    console.log(`匹配列: ${columnName} = ${value}`)
                }
            }
        }

        console.log('找到的列映射:', columnMappings)
        console.log('找到的关键词内容:', keyContents)

        // 如果没有找到关键词内容，且没有找到特定列，回退到原来的解析方法
        if (Object.keys(keyContents).length === 0 && Object.keys(columnMappings).length === 0) {
            console.log('未找到特定内容，使用备用方法')
            if (jsonData.length > 0) {
                const data = jsonData[0] as Record<string, any>

                for (const key in data) {
                    if (data[key]) {
                        briefContent += `${key}: ${data[key]}\n`
                    }
                }
            } else {
                throw new Error('Excel文件中没有数据')
            }
        }
    } catch (excelError) {
        console.error('Excel解析错误:', excelError)
        throw new Error(`Excel文件解析失败: ${excelError}`)
    }

    // 处理产品图片
    const tempDir = await ensureTempDirectory()
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

    console.log('收到', imageFiles.length, '张图片')

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
        imageFiles,
        columnMappings, // 返回特定列的映射数据
        keyContents // 新增：返回关键词内容映射
    }
}

// 调用大模型API生成内容
async function generateContent(briefContent: string, reviewRequirements: string, feedback?: string) {
    try {
        console.log('开始调用生成API')

        // 准备用户消息内容
        let userMessage = `我需要你帮我根据以下商品信息生成一篇小红书风格的产品推广帖子：

商品信息：
${briefContent}

请按照以下格式生成内容：
1. 标题：（有吸引力的标题，不超过20字）
2. 正文：（详细的正文内容，500-800字左右，包含个人体验和感受）
3. 标签：（5-8个相关话题标签，每个标签以#开头）`

        // 如果有修改意见，添加到用户消息中
        if (feedback && feedback.trim()) {
            userMessage += `\n\n请注意以下修改意见：
${feedback}`
        }

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
                    content: userMessage
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
        console.log('生成API响应成功')

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
        console.log('接收到POST请求到 /api/generate')

        // 检查是否是修改请求
        const url = new URL(req.url)
        const isRegenerate = url.searchParams.get('regenerate') === 'true'
        console.log('是否是重新生成请求:', isRegenerate)

        if (isRegenerate) {
            const feedback = url.searchParams.get('feedback') || ''
            console.log('修改意见:', feedback)

            // 打印请求头信息
            console.log('请求头:')
            const headers: Record<string, string> = {}
            req.headers.forEach((value, key) => {
                headers[key] = value
                console.log(`- ${key}: ${value}`)
            })
        }

        // 处理表单数据
        console.log('开始处理表单数据...')
        const { briefContent, reviewRequirements, images, columnMappings, keyContents } = await handleFormData(req)
        console.log('表单数据处理完成')

        // 获取修改意见（如果有）
        let feedback = ''
        if (isRegenerate) {
            const contentType = req.headers.get('content-type') || ''

            if (contentType.includes('application/json')) {
                try {
                    const jsonData = await req.json()
                    feedback = jsonData.feedback || ''
                    console.log('从JSON正文获取修改意见:', feedback)
                } catch (error) {
                    console.error('解析修改意见失败:', error)
                }
            } else {
                // 从URL参数中获取修改意见
                feedback = url.searchParams.get('feedback') || ''
                console.log('从URL参数获取修改意见:', feedback)
            }
        }

        // 调用API生成内容
        console.log('开始调用大模型API生成内容...')
        const generatedContent = await generateContent(briefContent, reviewRequirements, feedback)
        console.log('内容生成完成')

        // 准备返回数据
        const responseData = {
            title: generatedContent.title,
            content: generatedContent.content,
            tags: generatedContent.tags,
            images: images,
            briefData: columnMappings, // 在响应中包含特定列的数据
            keyContents: keyContents // 新增：返回关键词内容映射
        }

        console.log('生成成功，返回数据:', {
            title: responseData.title,
            contentLength: responseData.content.length,
            tagsCount: responseData.tags.length,
            imagesCount: responseData.images.length,
            briefDataKeys: Object.keys(responseData.briefData || {}),
            hasKeyContents: Object.keys(responseData.keyContents || {}).length > 0
        })

        // 返回结果
        return NextResponse.json(responseData)
    } catch (error: any) {
        console.error('生成文案时出错:', error)
        return NextResponse.json(
            { success: false, message: error.message || '处理请求时出错' },
            { status: 400 }
        )
    }
} 