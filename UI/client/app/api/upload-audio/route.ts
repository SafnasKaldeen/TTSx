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
    const file = formData.get("file") as File
    console.log("Received file:", file)
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get file data
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDir()

    // Create a unique filename
    const filename = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, filename)

    // Write the file
    await writeFile(filePath, buffer)

    // Return the public URL path
    const publicPath = `/uploads/${filename}`

    console.log(`File saved at: ${filePath}`)
    console.log(`Public path: ${publicPath}`)

    return NextResponse.json({
      success: true,
      file_path: publicPath,
    })
  } catch (error) {
    console.error("Error handling file upload:", error)
    return NextResponse.json({ error: "Error uploading file" }, { status: 500 })
  }
}
