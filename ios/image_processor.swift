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
  
  // 1070x210
  let x1=830;
  let x2=1900;
  let y1=390;
  let y2=600;
  let width = 1900 - 830;
  let height = 600 - 390;
  
  var previousImage: Image<UInt8>?;
  
  @objc func process(_ uri: String, callback successCallback: @escaping RCTResponseSenderBlock) {
    print("Starting image processing with " + uri)
    
    var timesAsNSValue = [NSNumber]();
    for i in stride(from: 55, to: 63, by: 1) {
      let cmTime = CMTime(value: Int64(i), timescale: 60);
      let nsNumber = NSNumber(time: cmTime);
      timesAsNSValue.append(nsNumber);
    }
    
    previousImage = nil;
    
    let assetImageGenerator = self.prepareAssetImageGenerator(url: URL(string: uri)!)
    var i = 0;
    let timeStart = CFAbsoluteTimeGetCurrent();
    assetImageGenerator.generateCGImagesAsynchronously(forTimes: timesAsNSValue) { (requestedTime: CMTime, image: CGImage?, actualTime: CMTime, result: AVAssetImageGenerator.Result, error: Error?) in
      print("Got async image requestedTime = \(requestedTime.seconds) at actual time \(actualTime.seconds)");
      
      self.processImage(cgImage: image!, i: i);
      i += 1;
      let timeEnd = CFAbsoluteTimeGetCurrent();
      print("current total runtime=\(timeEnd - timeStart)")
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
  
  func processImage(cgImage: CGImage, i: Int) {
    let t1 = CFAbsoluteTimeGetCurrent();
    
    
    let t2 = CFAbsoluteTimeGetCurrent();
    
    let croppedCgImage = cgImage.cropping(to: CGRect(x: x1, y: y1, width: width, height: height));
    
    let t3 = CFAbsoluteTimeGetCurrent();
    
    print("  1. retrieved image with dimensions (\(croppedCgImage!.width), \(croppedCgImage!.height))");
    
    var swiftImage = Image<RGBA<UInt8>>(cgImage: croppedCgImage!);
    
    let t4 = CFAbsoluteTimeGetCurrent();
    print("  2. processed uiImage into originalImage");
    
    let grayImage = swiftImage.map({ $0.gray })
    let t5 = CFAbsoluteTimeGetCurrent();
    print("  3. cropped image and converted to grayscale");
    
    var newImageUrl: URL?;
    let blobLabeler: BlobLabeler = BlobLabeler();
    if(previousImage != nil) {
      print("    - previousImage is available");
      print("grayImage dimensions: \(grayImage.width), \(grayImage.height)");
      print("previousImage dimensions: \(previousImage!.width), \(previousImage!.height)");
      var diffImage = Image<Bool>(width: width, height: height, pixel: false);
      for x in stride(from: 0, to: width, by: 1) {
        for y in stride(from: 0, to: height, by: 1) {
          let g: UInt8 = grayImage[x, y];
          let p: UInt8 = previousImage![x, y];
          var diff: UInt8;
          if(g > p) {
            diff = g-p;
            //diffImage[x, y] = g-p;
          } else {
            diff = p-g;
            //diffImage[x, y] = p-g;
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
      
      for blob in blobLabeler.getBlobs() {
        let outerContour = blob.getOuterContour();
        
        let xPoints = outerContour.getXPoints();
        let yPoints = outerContour.getYPoints();
        for i in 0..<xPoints.count {
          let x = xPoints[i];
          let y = yPoints[i];
          
          swiftImage[x, y] = RGBA<UInt8>(red: 255, green: 0, blue: 0);
        }
        
        let cog = blob.getCenterOfGravity();
        for x in 0..<50 {
          let pointToDraw = BPoint(cog.getX() + x - 25, cog.getY());
          let limitedPoint = self.limitCoordinate(pointToDraw, width, height);
          
          swiftImage[limitedPoint.getX(), limitedPoint.getY()] = RGBA<UInt8>(red: 0, green: 0, blue: 255);
        }
        for y in 0..<50 {
          let pointToDraw = BPoint(cog.getX(), cog.getY() + y - 25);
          let limitedPoint = self.limitCoordinate(pointToDraw, width, height);
          
          swiftImage[limitedPoint.getX(), limitedPoint.getY()] = RGBA<UInt8>(red: 0, green: 0, blue: 255);
        }
      }

      newImageUrl = self.saveImage(swiftImage.uiImage, name: "my_blob_\(i)");
      
    } else {
      print("    - previousImage is nil");
      newImageUrl = self.saveImage(grayImage.uiImage, name: "my_image_\(i)");
    }
    let t6 = CFAbsoluteTimeGetCurrent();
      
    previousImage = grayImage;
    
    print("  5. saved image URL is \(newImageUrl!)");
    let urlAsString = "\(newImageUrl!)";
    
//        print("about to callback");
//        //successCallback([urlAsString]);
//        print("called back! Now dispatching event.");
    
    DispatchQueue.main.sync {
      let myEventEmitter = self.bridge.module(for: MyEventEmitter.self) as? MyEventEmitter
      myEventEmitter!.sendEvent(withName: "image-available", body: urlAsString);
      print("  6. (main queue) Sent event to JS.");
    }
    let t7 = CFAbsoluteTimeGetCurrent();
    
    let d1 = t2-t1;
    let d2 = t3-t2;
    let d3 = t4-t3;
    let d4 = t5-t4;
    let d5 = t6-t5;
    let d6 = t7-t6;
    let totalTime = t7 - t1;
    
    print("d1=\(d1) d2=\(d2) d3=\(d3) d4=\(d4) d5=\(d5) d6=\(d6) total=\(totalTime)")
    
    print("  7. Now sleeping.");
  
    //Thread.sleep(foimeInterval: 0.25)
  }
  
  func limitCoordinate(_ point: BPoint, _ width: Int, _ height: Int) -> BPoint {
    var x = point.getX();
    var y = point.getY();
    
    if(x > width - 1) {
      x = width-1;
    }
    if(x < 0) {
      x = 0;
    }
    if(y > height-1) {
      y = height;
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
  
  func imageFromVideo(assetIG: AVAssetImageGenerator, at time: CMTimeValue) -> CGImage? {
    let cmTime = CMTime(value: time, timescale: 60)
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
