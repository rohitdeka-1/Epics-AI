# Raspberry Pi Boot Cron Setup

This project includes a boot launcher script:
- start-on-boot.sh

## 1) Make script executable

Run on Raspberry Pi:

chmod +x /home/rhdpi/AI/RaspberryPi_Uploader/start-on-boot.sh

## 2) Add cron @reboot entry

Open user crontab:

crontab -e

Add this line (single line):

@reboot /bin/bash /home/rhdpi/AI/RaspberryPi_Uploader/start-on-boot.sh

## 3) Reboot and verify

After reboot:
- server log: /home/rhdpi/AI/RaspberryPi_Uploader/logs/server.log
- uploader log: /home/rhdpi/AI/RaspberryPi_Uploader/logs/uploader.log
- boot log with IP: /home/rhdpi/AI/RaspberryPi_Uploader/logs/boot.log

The boot log writes the phone URL as:
http://<raspberry-pi-ip>:3000

## 4) UI location

UI files are in:
- public/index.html
- public/styles.css
- public/app.js

Express serves this folder in server.js using express.static("public").
