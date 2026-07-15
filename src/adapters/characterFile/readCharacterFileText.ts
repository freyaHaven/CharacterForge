export async function readCharacterFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('read-failed'))
    }

    reader.onerror = () => {
      reject(new Error('read-failed'))
    }

    reader.readAsText(file, 'UTF-8')
  })
}
