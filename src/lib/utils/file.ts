import { existsSync } from 'fs'

export default function isFileExist(path: string) {
  const exist = existsSync(path)

  return !!exist
}
