import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
    try {
        const templatePath = path.join(process.cwd(), 'public', 'brief_template.xlsx')
        const fileBuffer = await fs.readFile(templatePath)

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="brief_template.xlsx"',
                'Cache-Control': 'no-cache'
            }
        })
    } catch (error) {
        console.error('获取模板文件失败:', error)
        return NextResponse.json(
            { success: false, message: '模板文件不存在' },
            { status: 404 }
        )
    }
} 