import chokidar from "chokidar";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';
import path from "path";
import os from "os";
import dotenv from "dotenv";
import chalk from "chalk";
import connectDB from "./utils/db.js";
import Image from "./models/Image.js";

//-------------------------------------------------------------------------------------

dotenv.config();
await connectDB(); 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

//-------------------------------------------------------------------------------------

const imagesPath = path.join(process.cwd(), "Images");
console.log("IMAGE PATH : ",imagesPath)


console.log("Current working directory:", process.cwd());
console.log("Watching directory:", imagesPath);
console.log(chalk.bgGray("Platform:", os.platform()));

if (!fs.existsSync(imagesPath)) {
    console.error("Images directory does not exist at:", imagesPath);
    fs.mkdirSync(imagesPath, { recursive: true });
    
    console.log("Directory Created")
}

const watcher = chokidar.watch(imagesPath);

//-------------------------------------------------------------------------------------

watcher.on("ready",()=>{
    console.log("Scanned Success, Watching for changes..")
    console.log(chalk.yellowBright("Ready to upload images from:", imagesPath));
})

watcher.on("add",async filePath=>{
    
    console.log("NEW FILE: ",filePath);

    try{
        const data = await cloudinary.uploader.upload(filePath,{
            resource_type: "image"
        })
        console.log(chalk.bgGreen("Upload successful:", data.secure_url));

        await Image.create({
            filename: path.basename(filePath),
            cloudinaryUrl: data.secure_url,
            status: "pending",  
          });

          
        if(data){
            fs.unlinkSync(filePath);
            console.log(chalk.bgCyanBright("Deleted : ", filePath))
        }
        return data;
    }
    catch(err){
        console.error(chalk.red("Error Uploading : ", err));
    }

})

//-------------------------------------------------------------------------------------
