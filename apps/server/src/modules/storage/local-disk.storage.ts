import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Injectable } from '@nestjs/common'

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
}

export const FILE_STORAGE = Symbol('FILE_STORAGE')

@Injectable()
export class LocalDiskStorage implements FileStorage {
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
}
