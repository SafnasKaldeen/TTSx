import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import axios from "axios"

// Use regular fs instead of fs/promises
const fsPromises = {
  access: (path: string) => {
    return new Promise<void>((resolve, reject) => {
      fs.access(path, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  },
}

export async function POST(request: Request) {
  try {
    const { referenceAudioPath, targetAudioPath } = await request.json()

    if (!referenceAudioPath || !targetAudioPath) {
      return NextResponse.json(
        {
          error: "Missing required paths",
          details: "Both referenceAudioPath and targetAudioPath are required",
        },
        { status: 400 },
      )
    }

    console.log("Received paths for cloning:", { referenceAudioPath, targetAudioPath })

    // Convert relative paths to absolute paths for the external API
    // This assumes the files are in the public directory
    const publicDir = path.join(process.cwd(), "public")
    const absoluteReferencePath = path.join(publicDir, referenceAudioPath.replace(/^\//, ""))
    const absoluteTargetPath = path.join(publicDir, targetAudioPath.replace(/^\//, ""))

    console.log("Absolute paths:", { absoluteReferencePath, absoluteTargetPath })

    // Check if files exist
    try {
      await fsPromises.access(absoluteReferencePath)
      await fsPromises.access(absoluteTargetPath)
    } catch (error) {
      console.error("File access error:", error)
      return NextResponse.json(
        {
          error: "File not found",
          details: "One or both of the audio files could not be accessed",
          paths: { absoluteReferencePath, absoluteTargetPath },
        },
        { status: 404 },
      )
    }

    // Make request to the external voice cloning API
    const response = await axios.post(
      "http://127.0.0.1:8000/api/Clone-tts",
      {
        ReferenceWAV: absoluteReferencePath,
        TargetWAV: absoluteTargetPath,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 120000, // 2 minutes timeout for long processing
      },
    )

    console.log("Cloning API response:", response.data)

    // Return the response from the cloning API
    return NextResponse.json({
      success: true,
      message: "Voice cloning completed successfully",
      data: response.data,
      clonedAudioUrl: `/Audios/ClonedAudio.wav`, // Relative path to the cloned audio
    })
  } catch (error) {
    console.error("Error in clone-tts API route:", error)
    return NextResponse.json(
      {
        error: "Error processing voice cloning request",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
