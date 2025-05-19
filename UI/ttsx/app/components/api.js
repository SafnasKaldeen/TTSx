export const preprocessText = async (inputText) => {
  const response = await fetch("http://localhost:8000/api/preprocess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: inputText }),
  });
  return response.json();
};

export const synthesizeAudio = async (preprocessed_text, speakerID) => {
  const response = await fetch("http://localhost:8000/api/infer-tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Set the content type to JSON
    },
    body: JSON.stringify({ preprocessed_text, speakerID }), // Send as JSON
  });

  const data = await response.json();
  //   console.log(data); // Log the response data for debugging
  return data;
};

export const cleanAudio = async (audioPath) => {
  //   console.log("Cleaning audio...", audioPath);
  const response = await fetch("http://localhost:8000/api/clean_audio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_path: audioPath }), // Send audio file path or audio data
  });

  const data = await response.json();
  //   console.log(data); // Log the response data for debugging
  return data;
};

export const cloneAudio = async ({ referenceWAV, targetWAV }) => {
  // Construct the body for the API request
  const requestData = {
    ReferenceWAV: referenceWAV,
    TargetWAV: targetWAV,
  };

  //   console.log("Cloning audio...", requestData);

  try {
    const response = await fetch("http://localhost:8000/api/Clone-tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    // console.log("body:", JSON.stringify(requestData));

    const data = await response.json();

    if (data.status === "error") {
      throw new Error(data.message || "Voice cloning failed.");
    }
    // console.log("Data from cloneAudio:", data);
    // If cloning is successful, return the download path (or other relevant data)
    return {
      download_path: data.audio_path, // Assuming the API response includes this field
      status: "success",
    };
  } catch (error) {
    console.error("Error cloning audio:", error);
    return { status: "error", message: error.message };
  }
};
