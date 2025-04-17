import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import * as xlsx from 'xlsx'
import { read } from 'xlsx'
import { readFileSync } from 'node:fs'
import { join } from 'path'

export async function GET(req: NextRequest) {
    try {
        const templatePath = path.join(process.cwd(), 'public', 'brief_template.xlsx')

        // 读取Excel文件
        const workbook = xlsx.readFile(templatePath)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 'A' })

        // 构建列名与值的映射
        const columnMappings: Record<string, string> = {}
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
                    foundHeader = true
                    break
                }
            }

            if (foundHeader) {
                headerRow = i
                break
            }
        }

        // 找到全部表头和示例数据
        const headerMapping: Record<string, string> = {}

        if (headerRow !== -1) {
            const headerRowData = jsonData[headerRow] as Record<string, any>

            // 获取所有列名
            for (const key in headerRowData) {
                const columnName = String(headerRowData[key] || '')
                if (columnName) {
                    headerMapping[key] = columnName
                }
            }

            // 如果有示例行，获取示例数据
            if (headerRow + 1 < jsonData.length) {
                const valueRowData = jsonData[headerRow + 1] as Record<string, any>

                // 建立列名与值的映射
                for (const key in headerRowData) {
                    const columnName = String(headerRowData[key] || '')
                    if (columnName && valueRowData && key in valueRowData) {
                        columnMappings[columnName] = String(valueRowData[key] || '')
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            headers: headerMapping,
            exampleValues: columnMappings,
            headerRow
        })
    } catch (error) {
        console.error('读取模板文件失败:', error)
        return NextResponse.json(
            { success: false, message: '读取模板文件失败' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // const file = await request.formData().then((formData) => formData.get('file') as File)
        const workbook = read(readFileSync(join(process.cwd(), 'public', 'brief_template.xlsx')), { type: 'buffer' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 'A' })

        // 构建列名与值的映射
        const columnMappings: Record<string, string> = {}
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
                    foundHeader = true
                    break
                }
            }

            if (foundHeader) {
                headerRow = i
                break
            }
        }

        // 找到全部表头和示例数据
        const headerMapping: Record<string, string> = {}

        if (headerRow !== -1) {
            const headerRowData = jsonData[headerRow] as Record<string, any>

            // 获取所有列名
            for (const key in headerRowData) {
                const columnName = String(headerRowData[key] || '')
                if (columnName) {
                    headerMapping[key] = columnName
                }
            }

            // 如果有示例行，获取示例数据
            if (headerRow + 1 < jsonData.length) {
                const valueRowData = jsonData[headerRow + 1] as Record<string, any>

                // 建立列名与值的映射
                for (const key in headerRowData) {
                    const columnName = String(headerRowData[key] || '')
                    if (columnName && valueRowData && key in valueRowData) {
                        columnMappings[columnName] = String(valueRowData[key] || '')
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            headers: headerMapping,
            exampleValues: columnMappings,
            headerRow
        })
    } catch (error) {
        console.error('读取模板文件失败:', error)
        return NextResponse.json(
            { success: false, message: '读取模板文件失败' },
            { status: 500 }
        )
    }
} 