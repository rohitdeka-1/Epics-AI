 
import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  filename: String,
  cloudinaryUrl: String,
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, default: "pending" },
  
  gps: {
    lat: Number,
    lon: Number
  }
});

const Image = mongoose.model("Image", ImageSchema);
export default Image;
