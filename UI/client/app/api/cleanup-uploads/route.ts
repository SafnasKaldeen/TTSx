import { NextResponse } from "next/server"
import { readdir, unlink } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const { filesToKeep = [] } = await request.json()
    
    // Get the uploads directory path
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    
    // Read all files in the directory
    const files = await readdir(uploadsDir)
    
    // Convert filesToKeep paths to just filenames
    const filenamesToKeep = filesToKeep.map((filePath: string) => {
      // Extract just the filename from paths like "/uploads/filename.wav"
      return filePath.split('/').pop()
    }).filter(Boolean)
    
    console.log("Files to keep:", filenamesToKeep)
    
    // Delete files that are not in the filesToKeep list
    const deletionPromises = files.map(async (file) => {
      if (!filenamesToKeep.includes(file)) {
        const filePath = path.join(uploadsDir, file)
        console.log(`Deleting file: ${filePath}`)
        try {
          await unlink(filePath)
          return { deleted: file }
        } catch (err) {
          console.error(`Error deleting file ${file}:`, err)
          return { error: file }
        }
      }
      return { kept: file }
    })
    
    const results = await Promise.all(deletionPromises)
    
    return NextResponse.json({
      success: true,
      results,
      deleted: results.filter(r => r.deleted).length,
      kept: results.filter(r => r.kept).length,
      errors: results.filter(r => r.error).length
    })
  } catch (error) {
    console.error("Error cleaning up uploads:", error)
    return NextResponse.json(
      {
        error: "Error cleaning up uploads",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
