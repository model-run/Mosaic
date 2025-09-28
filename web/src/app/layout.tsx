import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ModelRun.io - 模型运行参数生成与部署助手',
  description: '在不同显卡、推理引擎下，快速生成 Docker 启动命令，并展示模型的最小运行规格、CUDA 版本要求及推荐配置。',
  keywords: ['AI模型', 'Docker', 'GPU', '推理引擎', 'vLLM', 'TensorRT', 'LLaMA', 'ChatGLM'],
  authors: [{ name: 'ModelRun.io Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'ModelRun.io - 模型运行参数生成与部署助手',
    description: '快速生成 AI 模型的 Docker 启动命令，支持多种 GPU 和推理引擎',
    type: 'website',
    locale: 'zh_CN',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
