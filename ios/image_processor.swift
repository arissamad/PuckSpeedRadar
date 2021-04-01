//
//  image_processor.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/14/21.
//

import Foundation
import Photos
import AVFoundation
import AVKit
import SwiftImage

@objc(ImageProcessor)
class ImageProcessor: NSObject {
  @objc var bridge: RCTBridge!
  
  var previousImage: Image<UInt8>?;
  var previousTime: CMTime?;
  var speeds: [Double];
  
  @objc func process(
    _ uri: String,
    fps fpsNS: NSNumber,
    duration durationNS: NSNumber,
    pixelsPerMeter pixelsPerMeterNS: NSNumber,
    x1 x1NS: NSNumber,
    y1 y1NS: NSNumber,
    x2 x2NS: NSNumber,
    y2 y2NS: NSNumber)
  {
    let fps = fpsNS as! Int;
    let duration = durationNS as! Double;
    let pixelsPerMeter = pixelsPerMeterNS as! Int;
    let x1 = x1NS as! Int;
    let y1 = y1NS as! Int;
    let x2 = x2NS as! Int;
    let y2 = y2NS as! Int;
    
    print("Starting image processing with " + uri, x1, y1, x2, y2);
    print("FPS:", fps);
    print("Duration:", duration);
    print("Pixels per meter:", pixelsPerMeter);
    
    let lastFrame = (duration * Double(fps)) - 3; // No need to consider the last few frames
    
    print("Last frame:", lastFrame);
    
    var timesAsNSValue = [NSNumber]();
    for i in stride(from: 0, to: lastFrame, by: 1) {
      let cmTime = CMTime(value: Int64(i), timescale: CMTimeScale(fps));
      let nsNumber = NSNumber(time: cmTime);
      timesAsNSValue.append(nsNumber);
    }
    
    previousImage = nil;
    previousTime = nil;
    speeds = [];
    
    let assetImageGenerator = self.prepareAssetImageGenerator(url: URL(string: uri)!)
    var i = 0;
    let timeStart = CFAbsoluteTimeGetCurrent();
    assetImageGenerator.generateCGImagesAsynchronously(forTimes: timesAsNSValue) { (requestedTime: CMTime, image: CGImage?, actualTime: CMTime, result: AVAssetImageGenerator.Result, error: Error?) in
      
      print("## image i=\(i) requestedTime = \(self.format(requestedTime.seconds)) actualTime \(self.format(actualTime.seconds))");
      
      self.processImage(cgImage: image!, i: i, pixelsPerMeter: pixelsPerMeter, time: actualTime, x1, y1, x2, y2);
      i += 1;
      let timeEnd = CFAbsoluteTimeGetCurrent();
      print("  current total runtime=\(self.format(timeEnd - timeStart))")
      
      if(i == Int(lastFrame) - 1) {
        var total: Double = 0;
        for speed in self.speeds {
          total += speed;
        }
        let avgSpeed = total / Double(self.speeds.count);
        
        print(" ");
        print("== DONE ==");
        print("AVG SPEED = \(self.format(avgSpeed))")
        print(" ");
        
        
        DispatchQueue.main.sync {
          let speedEventEmitter = self.bridge.module(for: SpeedEventEmitter.self) as? SpeedEventEmitter
          speedEventEmitter!.sendEvent(withName: "speed-available", body: self.format(avgSpeed));
        }
      }
    }
    
//    DispatchQueue.global(qos: .utility).async {
//      let timeStart = CFAbsoluteTimeGetCurrent();
//
//      for i in stride(from: 55, to: 63, by: 1) {
//        print("-------------");
//        print("NEW LOOP i=\(i)");
//
//        let cgImage = self.imageFromVideo(assetIG: assetImageGenerator, at: Int64(i));
//        self.processImage(cgImage: cgImage!, i: i);
//      } // for
//      let timeEnd = CFAbsoluteTimeGetCurrent();
//      print("we are done processing all frames. total runtime=\(timeEnd - timeStart)");
//    }
    print("Async job now running in separate thread. Main call done.");
  }
  
  func processImage(cgImage: CGImage, i: Int, pixelsPerMeter: Int, time: CMTime, _ x1: Int, _ y1: Int, _ x2: Int, _ y2: Int) {
    let croppedWidth = x2 - x1;
    let croppedHeight = y2 - y1;
    
    let t1 = CFAbsoluteTimeGetCurrent();
    
    let croppedCgImage = cgImage.cropping(to: CGRect(x: x1, y: y1, width: croppedWidth, height: croppedHeight));
    
    let t2 = CFAbsoluteTimeGetCurrent();
    
    var swiftImage = Image<RGBA<UInt8>>(cgImage: croppedCgImage!);
    
    let t3 = CFAbsoluteTimeGetCurrent();
    
    let grayImage = swiftImage.map({ $0.gray })
    let t4 = CFAbsoluteTimeGetCurrent();
    
    var newImageUrl: URL?;
    let blobLabeler: BlobLabeler = BlobLabeler();
    if(previousImage != nil) {
      var diffImage = Image<Bool>(width: croppedWidth, height: croppedHeight, pixel: false);
      for x in stride(from: 0, to: croppedWidth, by: 1) {
        for y in stride(from: 0, to: croppedHeight, by: 1) {
          let g: UInt8 = grayImage[x, y];
          let p: UInt8 = previousImage![x, y];
          var diff: UInt8;
          if(g > p) {
            diff = g-p;
          } else {
            diff = p-g;
          }
          
          if(diff > 20) { // 40 is conservative value, 20 is aggressive value.
            diffImage[x, y] = true;
          }
        }
      }
      newImageUrl = self.saveImage(diffImage.uiImage, name: "my_image_\(i)");
      
      blobLabeler.processImage(incomingBinaryData: diffImage, incomingWidth: diffImage.width, incomingHeight: diffImage.height)
      blobLabeler.filterBlobs();
      blobLabeler.printDebuggingInfo();
      
      let blobs = blobLabeler.getBlobs();
      for blob in blobs {
        let outerContour = blob.getOuterContour();
        
        let xPoints = outerContour.getXPoints();
        let yPoints = outerContour.getYPoints();
        for i in 0..<xPoints.count {
          let x = xPoints[i];
          let y = yPoints[i];
          
          var limitedPoint = self.limitCoordinate(BPoint(x, y), croppedWidth, croppedHeight);
          
          swiftImage[limitedPoint.getX(), limitedPoint.getY()] = RGBA<UInt8>(red: 255, green: 0, blue: 0);
        }
        
        let cog = blob.getCenterOfGravity();
        for x in 0..<50 {
          let pointToDraw = BPoint(cog.getX() + x - 25, cog.getY());
          let limitedPoint = self.limitCoordinate(pointToDraw, croppedWidth, croppedHeight);
          
          swiftImage[limitedPoint.getX(), limitedPoint.getY()] = RGBA<UInt8>(red: 0, green: 0, blue: 255);
        }
        for y in 0..<50 {
          let pointToDraw = BPoint(cog.getX(), cog.getY() + y - 25);
          let limitedPoint = self.limitCoordinate(pointToDraw, croppedWidth, croppedHeight);
          
          swiftImage[limitedPoint.getX(), limitedPoint.getY()] = RGBA<UInt8>(red: 0, green: 0, blue: 255);
        }
      }
      
      if(blobs.count == 2) {
        let cg1 = blobs[0].getCenterOfGravity();
        let cg2 = blobs[1].getCenterOfGravity();
        
        let xDistance = cg2.getX() - cg1.getX();
        let yDistance = cg2.getY() - cg1.getY();
        
        let distanceInPixels = Int(sqrt(Double(xDistance * xDistance + yDistance * yDistance)));
        let distanceInMeters = Double(distanceInPixels) / Double(pixelsPerMeter);
        
        let timeDiff = time - previousTime!;
        let speedInMetersPerSecond = distanceInMeters / timeDiff.seconds;
        print("  distanceInPixeles: \(distanceInPixels) distanceInMeters: \(self.format(distanceInMeters)) timeDiff: \(format(timeDiff.seconds))");
        
        print(String(format: "  --> Speed: %.5f", speedInMetersPerSecond));
        
        speeds.append(speedInMetersPerSecond);
      }

      newImageUrl = self.saveImage(swiftImage.uiImage, name: "my_blob_\(i)");
      
    } else {
      print("    - previousImage is nil");
      newImageUrl = self.saveImage(grayImage.uiImage, name: "my_image_\(i)");
    }
    let t5 = CFAbsoluteTimeGetCurrent();
      
    previousImage = grayImage;
    previousTime = time;
    
    let urlAsString = "\(newImageUrl!)";
    
    DispatchQueue.main.sync {
      let myEventEmitter = self.bridge.module(for: MyEventEmitter.self) as? MyEventEmitter
      myEventEmitter!.sendEvent(withName: "image-available", body: urlAsString);
    }
    let t6 = CFAbsoluteTimeGetCurrent();
    
    let d1 = t2-t1;
    let d2 = t3-t2;
    let d3 = t4-t3;
    let d4 = t5-t4;
    let d5 = t6-t5;
    let totalTime = t6 - t1;
    
    //print("d1=\(d1) d2=\(d2) d3=\(d3) d4=\(d4) d5=\(d5) total=\(totalTime)")
    
    //Thread.sleep(foimeInterval: 0.25)
  }
  
  func limitCoordinate(_ point: BPoint, _ width: Int, _ height: Int) -> BPoint {
    var x = point.getX();
    var y = point.getY();
    
    if(x > width - 1) {
      x = width - 1;
    }
    if(x < 0) {
      x = 0;
    }
    if(y > height-1) {
      y = height - 1;
    }
    if(y < 0) {
      y = 0;
    }
    return BPoint(x, y);
  }
  
  func prepareAssetImageGenerator(url: URL) -> AVAssetImageGenerator {
    let asset = AVURLAsset(url: url);
    
    let assetIG = AVAssetImageGenerator(asset: asset);
    
    assetIG.appliesPreferredTrackTransform = true
    assetIG.apertureMode = AVAssetImageGenerator.ApertureMode.encodedPixels
    assetIG.requestedTimeToleranceAfter = CMTime.zero;
    assetIG.requestedTimeToleranceBefore = CMTime.zero;
    
    return assetIG;
  }
  
  func imageFromVideo(assetIG: AVAssetImageGenerator, atFrame time: CMTimeValue, fps: CMTimeScale) -> CGImage? {
    let cmTime = CMTime(value: time, timescale: fps)
    let thumbnailImageRef: CGImage
    do {
      var actualTime: CMTime = CMTime();
      thumbnailImageRef = try assetIG.copyCGImage(at: cmTime, actualTime: &actualTime);
    } catch let error {
      print("Error: \(error)")
      return nil
    }
    return thumbnailImageRef;
  }
  
  // saves an image, if save is successful, returns its URL on local storage, otherwise returns nil
  func saveImage(_ image: UIImage, name: String) -> URL? {
    guard let imageData = image.jpegData(compressionQuality: 1) else {
      return nil
    }
    do {
      let imageURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!.appendingPathComponent(name)
      try imageData.write(to: imageURL)
      return imageURL
    } catch {
      return nil
    }
  }
  
  func getUrl() {
    let options = PHFetchOptions()
    options.sortDescriptors = [ NSSortDescriptor(key: "creationDate", ascending: true) ]
    options.predicate = NSPredicate(format: "mediaType = %d", PHAssetMediaType.video.rawValue)
    let photos = PHAsset.fetchAssets(with: options)
    
    let photo = photos[0];
    print(photo);
    print(photo.duration);
    print(photo.pixelWidth);
    print(photo.pixelHeight);
    
    print(photo.mediaType.rawValue);
    print(photo.playbackStyle.rawValue);
    
    print("M1");
    let videoRequestOptions = PHVideoRequestOptions();
    videoRequestOptions.version = .original;
    
    PHImageManager.default().requestAVAsset(forVideo: photo, options: videoRequestOptions) { (asset: AVAsset?, audioMix: AVAudioMix?, theHash: [AnyHashable : Any]?) -> Void in
      print("M2");
      let urlAsset = asset as? AVURLAsset;
      if(urlAsset != nil) {
        print("URL is \(urlAsset.unsafelyUnwrapped.url)");
      }
    }
  }
  func format(_ num: Double) -> String {
    return String(format: "%.005f", num);
  }
  
//  func drawLines(sImage: UnsafeMutablePointer<Image<RGBA<UInt8>>>, x1: Int, x2: Int, y1: Int, y2: Int, x: Int, y: Int) -> Void {
//    for y in stride(from: 0, to: 1080, by: 1) {
//      sImage[x1, y] = RGBA<UInt8>(red: 0, green: 0, blue: 0);
//      sImage[x1+1, y] = RGBA<UInt8>(red: 0, green: 0, blue: 0);
//    }
//
//    for x in stride(from: 830, to: 1919, by: 1) {
//      sImage[x, y1] = RGBA<UInt8>(red: 0, green: 0, blue: 0);
//      sImage[x, y1+1] = RGBA<UInt8>(red: 0, green: 0, blue: 0);
//
//      sImage[x, y2] = RGBA<UInt8>(red: 0, green: 0, blue: 0);
//      sImage[x, y2+1] = RGBA<UInt8>(red: 0, green: 0, blue: 0);
//    }
//  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
