import argparse
import os
import subprocess
import time
from datetime import datetime


def parse_args():
    parser = argparse.ArgumentParser(description="Capture images with libcamera-still")
    parser.add_argument("duration", type=int, help="Capture duration in seconds")
    parser.add_argument("output_dir", type=str, help="Output directory path")
    parser.add_argument("--interval", type=int, default=2, help="Interval between captures")
    return parser.parse_args()


def validate_duration(duration):
    if duration < 10 or duration % 10 != 0:
        raise ValueError("duration must be >= 10 and a multiple of 10")


def main():
    args = parse_args()
    validate_duration(args.duration)

    interval = args.interval
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)

    start = time.time()
    end = start + args.duration
    captures = 0

    print(f"START duration={args.duration}s interval={interval}s output={output_dir}", flush=True)

    while time.time() < end:
        timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S_%f")
        filename = os.path.join(output_dir, f"image_{timestamp}.jpg")

        result = subprocess.run(
            [
                "libcamera-still",
                "-o",
                filename,
                "--nopreview",
                "--width",
                "1280",
                "--height",
                "720",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"ERROR capture_failed file={filename} details={result.stderr.strip()}", flush=True)
            raise RuntimeError("libcamera-still failed")

        captures += 1
        print(f"CAPTURED file={filename}", flush=True)

        remaining = end - time.time()
        if remaining <= 0:
            break
        time.sleep(min(interval, remaining))

    print(f"DONE captures={captures}", flush=True)


if __name__ == "__main__":
    main()