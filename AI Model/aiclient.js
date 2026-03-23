import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function sendImageToAI(imagePath, publicId) {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      "http://localhost:5000/predict-file",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    return {
      public_id: publicId,
      prediction: response.data.prediction,
    };
  } catch (error) {
    console.error("AI request failed:", error.message);

    return {
      public_id: publicId,
      prediction: "ERROR",
    };
  }
}
