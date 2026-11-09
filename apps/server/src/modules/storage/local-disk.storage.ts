import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Injectable, Logger } from '@nestjs/common'

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
export const UPLOAD_PUBLIC_PREFIX = '/uploads'

export interface StoredFile {
  // 相对路径，不含主机名，便于以后换对象存储时不用改写已存的数据
  relativePath: string
}

export interface SaveOptions {
  directory: string
  extension: string
}

export interface FileStorage {
  save: (data: Buffer, options: SaveOptions) => Promise<StoredFile>
  /** 删除已保存的相对路径文件；ENOENT 视为已删，其他错误仅记日志不抛 */
  remove: (relativePath: string) => Promise<void>
}

export const FILE_STORAGE = Symbol('FILE_STORAGE')

@Injectable()
export class LocalDiskStorage implements FileStorage {
  private readonly logger = new Logger(LocalDiskStorage.name)

  async save(data: Buffer, options: SaveOptions): Promise<StoredFile> {
    const directory = path.resolve(UPLOAD_DIR, options.directory)

    // 限制落盘位置在 uploads 根目录内，避免 directory 被拼成越界路径
    const root = `${UPLOAD_DIR}${path.sep}`
    if (!directory.startsWith(root)) {
      throw new Error(`非法的存储目录：${options.directory}`)
    }

    await mkdir(directory, { recursive: true })

    const filename = `${randomUUID()}${options.extension}`
    await writeFile(path.join(directory, filename), data)

    return {
      relativePath: `${options.directory}/${filename}`,
    }
  }

  /**
   * WHY 只接受目录分隔路径（如 'avatars/xxx.jpg'）而不是完整 URL：
   *   库里的 avatar 字段存的就是 FileStorage.save 产出的相对路径，
   *   换成对象存储后新数据会是 https:// 绝对地址，那时按前缀过滤即可跳过，
   *   不经过磁盘。
   */
  async remove(relativePath: string): Promise<void> {
    const filePath = path.resolve(UPLOAD_DIR, relativePath)

    const root = `${UPLOAD_DIR}${path.sep}`
    if (!filePath.startsWith(root)) {
      throw new Error(`非法的存储路径：${relativePath}`)
    }

    try {
      await unlink(filePath)
    }
    catch (error) {
      // ENOENT：文件已被删过（旧头像可能从未落盘，或上次已清理），幂等即可
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`删除头像文件失败：${relativePath}`, error)
      }
    }
  }
}
