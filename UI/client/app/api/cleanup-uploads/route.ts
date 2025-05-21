import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Use regular fs instead of fs/promises
const fsPromises = {
  readdir: (path: string) => {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, (err, files) => {
        if (err) reject(err)
        else resolve(files)
      })
    })
  },
  stat: (path: string) => {
    return new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) reject(err)
        else resolve(stats)
      })
    })
  },
  unlink: (path: string) => {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  },
}

export async function POST(request: Request) {
  try {
    const { filesToKeep = [] } = await request.json()

    // Get the uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads")

    // Read all files in the directory
    const files = await fsPromises.readdir(uploadsDir)

    console.log("Files in uploads directory:", files)
    console.log("Files to keep:", filesToKeep)

    // Track deleted files and any errors
    const deletedFiles = []
    const errors = []

    // Delete each file that's not in the filesToKeep array
    for (const file of files) {
      const filePath = path.join(uploadsDir, file)

      // Check if this file should be kept
      const shouldKeep = filesToKeep.some((keepPath) => {
        // Convert relative path to filename for comparison
        const keepFilename = path.basename(keepPath)
        return keepFilename === file
      })

      if (!shouldKeep) {
        try {
          // Get file stats to make sure it's a file, not a directory
          const stats = await fsPromises.stat(filePath)

          if (stats.isFile()) {
            await fsPromises.unlink(filePath)
            deletedFiles.push(file)
            console.log(`Deleted file: ${file}`)
          }
        } catch (err) {
          console.error(`Error deleting file ${file}:`, err)
          errors.push({ file, error: err instanceof Error ? err.message : String(err) })
        }
      } else {
        console.log(`Keeping file: ${file}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedFiles.length} files from uploads directory`,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error in cleanup-uploads API route:", error)
    return NextResponse.json(
      {
        error: "Error cleaning up uploads directory",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
