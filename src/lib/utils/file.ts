import { RmOptions, existsSync } from 'fs'
import { rm } from 'fs/promises'

export default function isFileExist(path: string) {
  const exist = existsSync(path)

  return !!exist
}

export async function removeDirectory(location: string, options?: RmOptions) {
  const exist = isFileExist(location)
  if (!exist) return

  return rm(location, options)
}
