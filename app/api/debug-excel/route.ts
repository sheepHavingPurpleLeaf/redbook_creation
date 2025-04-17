import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'
import * as xlsx from 'xlsx'

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
            console.log('开始从内存读取Excel数据')
            const arrayBuffer = await briefFile.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // 使用xlsx从缓冲区读取数据
            const workbook = xlsx.read(buffer, { type: 'buffer' })
            console.log('工作表名称:', workbook.SheetNames)

            if (workbook.SheetNames.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'Excel文件中没有工作表' },
                    { status: 400 }
                )
            }

            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]

            if (!worksheet) {
                return NextResponse.json(
                    { success: false, message: '无法读取工作表' },
                    { status: 400 }
                )
            }

            // 尝试不同方式解析数据
            console.log('开始解析Excel数据')
            const rawRange = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1')
            console.log('表格范围:', worksheet['!ref'])

            // 方法1: header作为A, B, C...
            const jsonData1 = xlsx.utils.sheet_to_json(worksheet, { header: 'A' })

            // 方法2: 使用第一行作为header
            const jsonData2 = xlsx.utils.sheet_to_json(worksheet, { raw: true })

            // 寻找核心卖点相关列
            const allKeys: string[] = []
            const potentialHeaders: string[] = []
            const keyContents: Record<string, string[]> = {};
            const keywordMap: Record<string, string> = {
                "产品名称": "productName",
                "产品卖点": "productSellingPoints",
                "核心卖点": "productSellingPoints", // 兼容"核心卖点"
                "辅助卖点": "secondarySellingPoints", // 新增辅助卖点
                "产品痛点切入": "productPainPoints"
            };

            // 查找包含关键词的单元格，并提取该行右侧的所有单元格内容
            for (let i = 0; i < jsonData1.length; i++) {
                const row = jsonData1[i] as Record<string, any>;
                let foundKeyword = false;
                let keyword = "";
                let keyColumn = "";

                // 首先查找是否有包含关键词的单元格
                for (const key in row) {
                    if (!allKeys.includes(key)) {
                        allKeys.push(key);
                    }

                    const cellValue = String(row[key] || '');
                    for (const keywordText in keywordMap) {
                        if (cellValue.includes(keywordText)) {
                            foundKeyword = true;
                            keyword = keywordText;
                            keyColumn = key;
                            potentialHeaders.push(cellValue);
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
                    }
                }
            }

            // 尝试构建列名和值的映射
            const specificColumns = ['品牌名称', '产品名称', '核心卖点 1', '核心卖点 2', '核心卖点 3', '目标用户', '价格']
            const columnMappings: Record<string, string> = {}

            // 查找列名所在的行和对应的值
            let headerRow = -1

            // 找到包含列名的行
            for (let i = 0; i < jsonData1.length; i++) {
                const row = jsonData1[i] as Record<string, any>
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
                const headerRowData = jsonData1[headerRow] as Record<string, any>
                const valueRowData = jsonData1[headerRow + 1] as Record<string, any>

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

            return NextResponse.json({
                success: true,
                fileName: briefFile.name,
                fileSize: briefFile.size,
                sheets: workbook.SheetNames,
                range: worksheet['!ref'],
                rowCount: rawRange.e.r - rawRange.s.r + 1,
                columnCount: rawRange.e.c - rawRange.s.c + 1,
                sampleData1: jsonData1.slice(0, 5),
                sampleData2: jsonData2.slice(0, 5),
                allKeys,
                potentialHeaders,
                columnMappings,
                keyContents,
                headerRow,
                rawData: Array.from({ length: Math.min(10, rawRange.e.r + 1) }, (_, i) => {
                    const rowData: Record<string, any> = {}
                    for (let j = 0; j <= rawRange.e.c; j++) {
                        const cellRef = xlsx.utils.encode_cell({ r: i, c: j })
                        const cell = worksheet[cellRef]
                        if (cell) {
                            rowData[xlsx.utils.encode_col(j)] = xlsx.utils.format_cell(cell)
                        }
                    }
                    return rowData
                })
            })
        } catch (excelError) {
            console.error('Excel解析错误:', excelError)
            return NextResponse.json(
                {
                    success: false,
                    message: 'Excel文件解析失败',
                    error: String(excelError)
                },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('调试Excel失败:', error)
        return NextResponse.json(
            { success: false, message: String(error) },
            { status: 500 }
        )
    }
} 