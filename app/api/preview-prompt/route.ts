import { NextRequest, NextResponse } from 'next/server'
import * as xlsx from 'xlsx'
import path from 'path'
import { promises as fs } from 'fs'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        // 处理brief文件
        const briefFile = formData.get('brief') as File
        if (!briefFile) {
            return NextResponse.json(
                { success: false, message: '没有提供文件' },
                { status: 400 }
            )
        }

        console.log('收到文件:', briefFile.name, briefFile.type, briefFile.size, 'bytes')

        // 检查文件类型
        if (!briefFile.name.endsWith('.xlsx')) {
            return NextResponse.json(
                { success: false, message: '只支持Excel (.xlsx)格式的文件' },
                { status: 400 }
            )
        }

        // 直接从内存中读取文件，不写入磁盘
        try {
            // 1. 读取Excel数据
            console.log('开始从内存读取Excel数据')
            const arrayBuffer = await briefFile.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // 使用xlsx从缓冲区读取数据
            const workbook = xlsx.read(buffer, { type: 'buffer' })

            if (workbook.SheetNames.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'Excel文件中没有工作表' },
                    { status: 400 }
                )
            }

            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 'A' })

            // 2. 提取Excel内容
            // 定义要查找的关键词映射
            const keywordMap: Record<string, string> = {
                "产品名称": "productName",
                "核心卖点": "coreSellingPoint",
                "辅助卖点": "secondarySellingPoints",
                "产品痛点切入": "productPainPoints",
                "使用方法": "usageMethod",
                "目标受众": "targetAudience",
                "功效": "efficacy",
                "使用场景": "usageScenario"
            };

            // 定义中文显示名称
            const keywordDisplayNames: Record<string, string> = {
                productName: "产品名称",
                coreSellingPoint: "核心卖点",
                secondarySellingPoints: "辅助卖点",
                productPainPoints: "产品痛点切入",
                usageMethod: "使用方法",
                targetAudience: "目标受众",
                efficacy: "功效",
                usageScenario: "使用场景"
            };

            // 定义结果对象
            interface ExtractedContent {
                [key: string]: string;
            }

            // 保存提取的内容
            const extractedContents: ExtractedContent = {};

            // 特殊处理核心卖点
            const coreSellingPoints: Record<string, string> = {};

            console.log("开始提取Excel内容...");

            // 遍历每一行数据
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i] as Record<string, any>;

                // 遍历每个单元格
                for (const cellKey in row) {
                    const cellValue = String(row[cellKey] || '').trim();
                    if (!cellValue) continue;

                    // 确定下一个单元格的键名
                    const colIndex = cellKey.charCodeAt(0) - 'A'.charCodeAt(0);
                    const nextColKey = String.fromCharCode('A'.charCodeAt(0) + colIndex + 1);

                    // 判断单元格是否包含核心卖点
                    if (cellValue.includes('核心卖点')) {
                        // 提取核心卖点的数字或标识
                        const match = cellValue.match(/\d+/);
                        const pointId = match ? match[0] : '';
                        const coreKey = `核心卖点${pointId}`;

                        // 提取右侧单元格内容
                        if (nextColKey in row) {
                            const nextCellValue = String(row[nextColKey] || '').trim();
                            if (nextCellValue) {
                                coreSellingPoints[coreKey] = nextCellValue;
                                console.log(`提取到核心卖点 ${coreKey}: ${nextCellValue}`);
                            }
                        }
                        continue;
                    }

                    // 精确匹配其他关键词
                    for (const keyword in keywordMap) {
                        // 精确匹配关键词，使用更严格的匹配条件
                        if (
                            cellValue === keyword ||
                            cellValue === `${keyword}:` ||
                            cellValue === `${keyword}：`
                        ) {
                            // 获取关键词对应的映射键
                            const mappedKey = keywordDisplayNames[keywordMap[keyword]];

                            // 提取右侧单元格内容
                            if (nextColKey in row) {
                                const nextCellValue = String(row[nextColKey] || '').trim();
                                if (nextCellValue) {
                                    extractedContents[mappedKey] = nextCellValue;
                                    console.log(`提取到 ${mappedKey}: ${nextCellValue}`);
                                }
                            }
                            break;
                        }
                    }
                }
            }

            // 合并核心卖点到提取的内容中
            Object.assign(extractedContents, coreSellingPoints);

            // 检查提取结果
            console.log("提取完成，内容如下:");
            console.log(extractedContents);

            // 4. 构建brief内容
            let briefContent = '品牌简介：\n\n';

            for (const [displayName, content] of Object.entries(extractedContents)) {
                briefContent += `${displayName}: ${content}\n`;
            }

            // 5. 读取小红书审核要求
            let reviewRequirements = '';
            try {
                reviewRequirements = await fs.readFile(path.join(process.cwd(), 'public', 'docs', 'review_requirements.txt'), 'utf-8');
            } catch (err) {
                console.warn('无法读取小红书审核要求文件，将使用默认规则');
                reviewRequirements = '避免使用超链接、联系方式和营销用语';
            }

            // 6. 构建Prompt
            const systemPrompt = `你是一个专业的小红书内容创作专家，擅长根据商品信息生成符合小红书平台风格的文案。
请严格遵守以下小红书内容审核要求：
${reviewRequirements}`;

            const userPrompt = `我需要你帮我根据以下商品信息生成一篇小红书风格的产品推广帖子：

商品信息：
${briefContent}

请按照以下格式生成内容：
1. 标题：（有吸引力的标题，不超过20字）
2. 正文：（详细的正文内容，500-800字左右，包含个人体验和感受）
3. 标签：（5-8个相关话题标签，每个标签以#开头）`;

            // 7. 返回结果
            return NextResponse.json({
                success: true,
                excelData: {
                    extractedContents: extractedContents,
                    rawData: jsonData.slice(0, 3) // 仅返回前3行示例数据
                },
                promptInfo: {
                    systemPrompt: systemPrompt,
                    userPrompt: userPrompt,
                    briefContent: briefContent,
                    reviewRequirements: reviewRequirements
                }
            });

        } catch (excelError) {
            console.error('Excel解析错误:', excelError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Excel文件解析失败',
                    error: String(excelError)
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('调试Excel失败:', error);
        return NextResponse.json(
            { success: false, message: String(error) },
            { status: 500 }
        );
    }
} 