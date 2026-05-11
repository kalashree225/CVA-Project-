from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
import cv2
import time
import numpy as np

router = APIRouter()

class VideoCamera:
    def __init__(self):
        try:
            self.video = cv2.VideoCapture(0)
            self.is_active = self.video.isOpened()
        except Exception:
            self.is_active = False
        
    def __del__(self):
        if hasattr(self, 'video'):
            self.video.release()
        
    def get_frame(self):
        if not self.is_active:
            # Generate a "SIGNAL LOST" diagnostic frame
            img = np.zeros((480, 640, 3), np.uint8)
            cv2.putText(img, "SENTINEL // SIGNAL LOST", (100, 240), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.putText(img, "HARDWARE SYNC FAILURE", (150, 280), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            # Add some noise
            noise = np.random.randint(0, 50, (480, 640, 3), dtype='uint8')
            img = cv2.add(img, noise)
            ret, jpeg = cv2.imencode('.jpg', img)
            return jpeg.tobytes()

        success, image = self.video.read()
        if not success:
            return None
        
        # Add some "Sentinel Intelligence" overlays to make it look CVA
        height, width, _ = image.shape
        
        # Draw a scanning line
        scan_y = int((time.time() * 100) % height)
        cv2.line(image, (0, scan_y), (width, scan_y), (0, 255, 0), 1)
        
        # Draw some corners
        length = 40
        thickness = 2
        # Top Left
        cv2.line(image, (20, 20), (20 + length, 20), (255, 255, 255), thickness)
        cv2.line(image, (20, 20), (20, 20 + length), (255, 255, 255), thickness)
        # Top Right
        cv2.line(image, (width - 20, 20), (width - 20 - length, 20), (255, 255, 255), thickness)
        cv2.line(image, (width - 20, 20), (width - 20, 20 + length), (255, 255, 255), thickness)
        
        # Add text
        cv2.putText(image, "SENTINEL ACTIVE // HARDWARE SYNC", (40, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        ret, jpeg = cv2.imencode('.jpg', image)
        return jpeg.tobytes()

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')
        else:
            time.sleep(0.1)

@router.get("/stream")
async def video_feed():
    return StreamingResponse(gen(VideoCamera()),
                    media_type='multipart/x-mixed-replace; boundary=frame')
