import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { mkdir } from "fs/promises"

// Create the upload directory if it doesn't exist
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  try {
    await mkdir(uploadDir, { recursive: true })
    return uploadDir
  } catch (error) {
    console.error("Error creating upload directory:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // Log all available fields for debugging
    console.log("FormData fields:", [...formData.keys()])

    // Check if this is a reference audio or target audio upload
    const isReference = formData.get("isReference") === "true"
    const targetIndex = formData.get("targetIndex")
    
    // Check for file field
    const file = formData.get("file") || formData.get("audio")

    if (!file || !(file instanceof File)) {
      console.error("No valid file found in form data. Available fields:", [...formData.keys()])
      console.error("File type received:", file ? typeof file : "undefined")
      if (file) console.error("Is File instance:", file instanceof File)
      return NextResponse.json(
        {
          error: "No file provided",
          receivedFields: [...formData.keys()],
          fileType: file ? typeof file : "undefined",
        },
        { status: 400 },
      )
    }

    console.log("Received file:", file.name, file.type, file.size)

    // Get file data
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDir()

    // Create a filename based on whether it's reference or target
    let filename
    if (isReference) {
      filename = `reference-audio-${Date.now()}${path.extname(file.name)}`
    } else if (targetIndex) {
      filename = `target-audio${targetIndex}-${Date.now()}${path.extname(file.name)}`
    } else {
      // Default naming if no specific type is provided
      filename = `audio-${Date.now()}${path.extname(file.name)}`
    }
    
    const filePath = path.join(uploadDir, filename)

    // Write the file
    await writeFile(filePath, buffer)

    // Return the public URL path
    const publicPath = `E:/UOM/FYP/TTSx/UI/client/public/uploads/${filename}`

    console.log(`File saved at: ${filePath}`)
    console.log(`Public path: ${publicPath}`)

    return NextResponse.json({
      success: true,
      file_path: publicPath,
      isReference: isReference,
      targetIndex: targetIndex || null,
      originalName: file.name,
    })
  } catch (error) {
    console.error("Error handling file upload:", error)
    return NextResponse.json(
      {
        error: "Error uploading file",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
