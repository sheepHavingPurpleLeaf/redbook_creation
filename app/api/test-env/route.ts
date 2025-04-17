import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'
import os from 'os'

export async function GET(req: NextRequest) {
    try {
        // 收集系统信息
        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            memory: os.totalmem(),
            freeMemory: os.freemem(),
            tempdir: os.tmpdir(),
            homedir: os.homedir(),
            cwd: process.cwd(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                // 添加其他需要的环境变量
            }
        }

        // 检查tmp目录
        const tmpDir = path.join(process.cwd(), 'tmp')
        let tmpDirInfo: any = {}

        try {
            const stats = await fs.stat(tmpDir)
            tmpDirInfo = {
                exists: true,
                isDirectory: stats.isDirectory(),
                permissions: stats.mode.toString(8),
                size: stats.size,
                atime: stats.atime,
                mtime: stats.mtime,
                ctime: stats.ctime
            }

            // 尝试列出目录内容
            const files = await fs.readdir(tmpDir)
            tmpDirInfo.files = files

            // 尝试创建临时文件
            const testFile = path.join(tmpDir, `test_${Date.now()}.txt`)
            await writeFile(testFile, 'Hello World')
            tmpDirInfo.writeTest = 'success'

            // 读取测试文件
            const content = await fs.readFile(testFile, 'utf-8')
            tmpDirInfo.readTest = content

            // 删除测试文件
            await fs.unlink(testFile)
            tmpDirInfo.deleteTest = 'success'

        } catch (error) {
            tmpDirInfo = {
                error: String(error),
                stack: (error as Error).stack
            }
        }

        // 检查public目录
        const publicDir = path.join(process.cwd(), 'public')
        let publicDirInfo: any = {}

        try {
            const stats = await fs.stat(publicDir)
            publicDirInfo = {
                exists: true,
                isDirectory: stats.isDirectory(),
                permissions: stats.mode.toString(8),
                size: stats.size
            }

            // 查找模板文件
            const templatePath = path.join(publicDir, 'xx品牌KOC达人brief表.xlsx')
            try {
                const templateStats = await fs.stat(templatePath)
                publicDirInfo.templateExists = true
                publicDirInfo.templateSize = templateStats.size
            } catch (error) {
                publicDirInfo.templateExists = false
                publicDirInfo.templateError = String(error)
            }

        } catch (error) {
            publicDirInfo = {
                error: String(error)
            }
        }

        return NextResponse.json({
            success: true,
            systemInfo,
            tmpDir: tmpDirInfo,
            publicDir: publicDirInfo,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('测试环境失败:', error)
        return NextResponse.json(
            {
                success: false,
                message: String(error),
                stack: (error as Error).stack
            },
            { status: 500 }
        )
    }
} 