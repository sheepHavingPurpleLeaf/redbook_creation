import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
    req: NextRequest,
    { params }: { params: { name: string } }
) {
    try {
        const imageName = params.name
        const tempDir = path.join(process.cwd(), 'tmp')
        const imagePath = path.join(tempDir, imageName)

        // 读取文件
        const fileBuffer = await fs.readFile(imagePath)

        // 确定图片类型
        let contentType = 'image/jpeg'
        if (imageName.endsWith('.png')) {
            contentType = 'image/png'
        } else if (imageName.endsWith('.gif')) {
            contentType = 'image/gif'
        }

        // 返回图片
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            }
        })
    } catch (error) {
        console.error('获取图片失败:', error)
        return NextResponse.json(
            { success: false, message: '图片不存在或已过期' },
            { status: 404 }
        )
    }
} 