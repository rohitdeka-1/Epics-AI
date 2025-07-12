import chokidar from "chokidar";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';
import path from "path";
import os from "os";
import dotenv from "dotenv";

//-------------------------------------------------------------------------------------

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

//-------------------------------------------------------------------------------------

const imagesPath = path.join(process.cwd(), "Images");
console.log("IMAGE PATH : ",imagesPath)
const watcher = chokidar.watch(imagesPath);


console.log("Current working directory:", process.cwd());
console.log("Watching directory:", imagesPath);
console.log("Platform:", os.platform());

if (!fs.existsSync(imagesPath)) {
    console.error("Images directory does not exist at:", imagesPath);
    fs.mkdir(process.cwd(),"Images")
    console.log("Directory Created")
}

//-------------------------------------------------------------------------------------

watcher.on("ready",()=>{
    console.log("Scanned Success, Watching for changes..")
    console.log("Ready to upload images from:", imagesPath);
})

watcher.on("add",async filePath=>{
    
    console.log("NEW FILE: ",filePath);

    try{
        const data = await cloudinary.uploader.upload(filePath,{
            resource_type: "image"
        })
        console.log("Upload successful:", data.secure_url);
        if(data){
            fs.unlinkSync(filePath);
            console.log("Deleted : ", filePath)
        }
        return data;
    }
    catch(err){
        console.error("Error Uploading : ", err);
    }

})

//-------------------------------------------------------------------------------------
