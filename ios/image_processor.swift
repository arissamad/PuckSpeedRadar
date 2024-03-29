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
  
  var firstImage: Image<UInt8>?;
  var previousImage: Image<UInt8>?;
  
  var previousBlob: Blob?;
  var previousTime: CMTime?;
  var speeds: [Double] = [];
  
  var numFramesFoundSpeed = 0;
  
  var fps: Int = 0;
  var duration: Double = 0;
  var pixelsPerMeter: Int = 0;
  var x1: Int = 0;
  var y1: Int = 0;
  var x2: Int = 0;
  var y2: Int = 0;
  
  var currIndex: Int = 0;
  
  let speechSynthesizer = AVSpeechSynthesizer();
  
  @objc func process(
    _ uri: String,
    fps fpsNS: NSNumber,
    duration durationNS: NSNumber,
    pixelsPerMeter pixelsPerMeterNS: NSNumber,
    x1 x1NS: NSNumber,
    y1 y1NS: NSNumber,
    x2 x2NS: NSNumber,
    y2 y2NS: NSNumber,
    startIndex startIndexNS: NSNumber,
    endIndex endIndexNS: NSNumber,
    sleepSPerFrame sleepSPerFrameNS: NSNumber,
    callback successCallback: @escaping RCTResponseSenderBlock)
  {
    fps = fpsNS as! Int;
    duration = durationNS as! Double;
    pixelsPerMeter = pixelsPerMeterNS as! Int;
    x1 = x1NS as! Int;
    y1 = y1NS as! Int;
    x2 = x2NS as! Int;
    y2 = y2NS as! Int;
    let startIndex = startIndexNS as! Int;
    let requestedEndIndex = endIndexNS as! Int;
    let sleepSPerFrame = sleepSPerFrameNS as! Int;
    
    print("Starting image processing with " + uri, x1, y1, x2, y2);
    print("FPS:", fps);
    print("Duration:", duration);
    print("Pixels per meter:", pixelsPerMeter);
    print("Sleep Seconds per frame:", sleepSPerFrame);
    
    let lastFrame = Int((duration * Double(fps)) - 3); // No need to consider the last few frames
    
    var analyzeSpecificFrames = false;
    
    var endIndex: Int;
    if(requestedEndIndex < 0) {
      endIndex = lastFrame;
    } else {
      endIndex = requestedEndIndex;
      analyzeSpecificFrames = true;
    }
    
    firstImage = nil;
    previousBlob = nil;
    previousImage = nil;
    previousTime = nil;
    let timeStart = CFAbsoluteTimeGetCurrent();
    
    let assetImageGenerator = self.prepareAssetImageGenerator(url: URL(string: uri)!)
    let broadSearchStepSize = 10;
    
    if(!analyzeSpecificFrames) {
      // Do a broad search first.
      print("---- INITIATING BROAD SEARCH ---- endIndex: \(endIndex)")
      var alreadyFoundFrame = false;
      let broadSearchFrameTimes = calculateFrameTimes(startIndex: 0, endIndex: endIndex, step: broadSearchStepSize)
      currIndex = 0;
       
      assetImageGenerator.generateCGImagesAsynchronously(forTimes: broadSearchFrameTimes) { (requestedTime: CMTime, image: CGImage?, actualTime: CMTime, result: AVAssetImageGenerator.Result, error: Error?) in
        let convertedTime = requestedTime.convertScale(Int32(self.fps), method: CMTimeRoundingMethod.roundHalfAwayFromZero);
        let calculatedIndex = convertedTime.value;
        
        if(alreadyFoundFrame) {
          //print("CONTINUING TO PROCESS FRAMES, but already canceled!");
          return;
        }
        
        if(image == nil) {
          print("Something wrong, image is nil");
          print("error is", error);
          return;
        }
        
        let blobs = self.processImage(cgImage: image!, time: actualTime);
        
        if(blobs.count == 0) {
          if(calculatedIndex > endIndex - broadSearchStepSize) {
            successCallback([false, 0]);
          }
          return;
        }
        
        alreadyFoundFrame = true;
        assetImageGenerator.cancelAllCGImageGeneration();
        
        let narrowedStartIndex = Int(requestedTime.value) - broadSearchStepSize + 1;
        var narrowedEndIndex = Int(requestedTime.value) + 30; // We don't expect more than 30 frames for the puck to travel
        if(narrowedEndIndex > lastFrame) {
          narrowedEndIndex = lastFrame;
        }
        
        print("---- INITIATING NARROWED SEARCH window=[\(narrowedStartIndex), \(narrowedEndIndex)] ----")
        self.speechSynthesizer.speak(AVSpeechUtterance(string: "Found shot. Analyzing."));
      
        self.speeds = [];
        self.previousBlob = nil;
        self.previousImage = nil;
        self.previousTime = nil;
        self.numFramesFoundSpeed = 0;
        
        let narrowFrameTimes = self.calculateFrameTimes(startIndex: narrowedStartIndex, endIndex: narrowedEndIndex, step: 1);
        self.currIndex = narrowedStartIndex;
        
        var firstBlobFound = false;
        
        var alreadyCompletedAnalysis = false;
        assetImageGenerator.generateCGImagesAsynchronously(forTimes: narrowFrameTimes) { (requestedTime: CMTime, image: CGImage?, actualTime: CMTime, result: AVAssetImageGenerator.Result, error: Error?) in
          if(alreadyCompletedAnalysis) {
            //print("CONTINUING TO PROCESS FRAMES, but already completed analysis!");
            return;
          }
          
          let blobs = self.processImage(cgImage: image!, time: actualTime);
          if(blobs.count > 0) {
            firstBlobFound = true;
          }
          var terminateAnalysis = self.processBlobs(blobs: blobs, time: actualTime);
        
          if(self.currIndex == Int(narrowedEndIndex)) {
            terminateAnalysis = true;
            print("Terminating analysis as we are at the end of the narrowed window");
          }
          
          if(terminateAnalysis) {
            print("speeds: ", self.speeds, self.numFramesFoundSpeed);
            alreadyCompletedAnalysis = true;
            assetImageGenerator.cancelAllCGImageGeneration();
            
            let timeEnd = CFAbsoluteTimeGetCurrent();
            print("  current total runtime=\(self.format(timeEnd - timeStart))")
            
            
            let foundSpeed = self.numFramesFoundSpeed > 3;
            
            if(foundSpeed) {
              let speed = self.calculateAndTransmitSpeed(speeds: self.speeds)
              successCallback([true, speed]);
            } else {
              self.speechSynthesizer.speak(AVSpeechUtterance(string: "No shot found."));
              successCallback([true, 0]);
            }
          }
          
          if(firstBlobFound && sleepSPerFrame > 0) {
            sleep(UInt32(sleepSPerFrame));
          }
        }
      }
    } else {
      print("---- INITIATING SPECIFIC FRAMES ANALYSIS ----")
      speeds = [];
      currIndex = startIndex;
      let specificFrameTimes = calculateFrameTimes(startIndex: startIndex, endIndex: lastFrame, step: 1)
      assetImageGenerator.generateCGImagesAsynchronously(forTimes: specificFrameTimes) { (requestedTime: CMTime, image: CGImage?, actualTime: CMTime, result: AVAssetImageGenerator.Result, error: Error?) in
        _ = self.processImage(cgImage: image!, time: actualTime);
        
        sleep(1);
        
        if(self.currIndex == Int(endIndex)) {
          let timeEnd = CFAbsoluteTimeGetCurrent();
          print("  current total runtime=\(self.format(timeEnd - timeStart))")
          let speed = self.calculateAndTransmitSpeed(speeds: self.speeds)
          
          successCallback([true, speed]);
        }
      }
    }
    
    print("Async job now running in separate thread. Main call done.");
  }
  
  func calculateFrameTimes(startIndex: Int, endIndex: Int, step: Int) -> [NSValue] {
    var timesAsNSValue = [NSNumber]();
    
    for i in stride(from: startIndex, to: endIndex, by: step) {
      let cmTime = CMTime(value: Int64(i), timescale: CMTimeScale(fps));
      let nsNumber = NSNumber(time: cmTime);
      timesAsNSValue.append(nsNumber);
    }
    
    return timesAsNSValue;
  }
  
  func processBlobs(blobs: [Blob], time: CMTime) -> Bool {
    if(blobs.count > 2) { // So this could be the stick, the puck, and a bunch of blobs of the target when it is hit
      print("Terminating analysis as more than 2 blobs found");
      return true;
    }
    
    let croppedWidth = x2 - x1;
    var selectedBlob: Blob?;
    
    if(blobs.count == 1) {
      selectedBlob = blobs[0];
    } else if(blobs.count == 2) {
      // This could be the stick and the puck
      print(" -- found 2 blobs, maybe stick and puck");
      var leftBlob: Blob;
      var rightBlob: Blob;
      if(blobs[0].getCenterOfGravity().getX() < blobs[1].getCenterOfGravity().getX()) {
        leftBlob = blobs[0];
        rightBlob = blobs[1];
      } else {
        leftBlob = blobs[1];
        rightBlob = blobs[0];
      }
      if(Double(leftBlob.getCenterOfGravity().getX()) < 0.1 * Double(croppedWidth)) {
        if(previousBlob != nil && rightBlob.getCenterOfGravity().getX() > previousBlob!.getCenterOfGravity().getX() ||
            previousBlob == nil && Double(rightBlob.getCenterOfGravity().getX()) > 0.2 * Double(croppedWidth)) {
            // Good to go! WE are assuming the stick is the left blob.
            print(" -- Using the right blob, assuming the left blob is the stick");
            selectedBlob = rightBlob;
        }
      }
    }
    
    var foundSpeed = false;
    if(selectedBlob != nil) {
      if(previousBlob != nil) {
        if(selectedBlob!.getCenterOfGravity().getX() < previousBlob!.getCenterOfGravity().getX()) {
          print("Terminating analysis because puck is moving backwards.");
          return true;
        }
        
        let speed = getSpeedFromTwoBlobs(blob1: previousBlob!, blob2: selectedBlob!, time: time);
        speeds.append(speed);
        foundSpeed = true;
      }
      
      previousBlob = selectedBlob;
      previousTime = time;
    } else {
      previousBlob = nil;
    }
    
    if(foundSpeed) {
      numFramesFoundSpeed += 1;
    }
    
    if(!foundSpeed && numFramesFoundSpeed > 4) {
      print("Terminating analysis as speed in this frame could not be detected, but we already have enough data.");
      return true;
    }
    
    return false;
  }
  
  func calculateAndTransmitSpeed(speeds: [Double]) -> Double {
    var avgSpeed: Double = 0;
    
    if(self.speeds.count > 0) {
      
      // Exclude the lowest and highest readings, if they are off by more than 10% of the average of the rest
      var lowest: Double = 10000;
      var lowestIndex = -1;
      var highest: Double = 0;
      var highestIndex = -1;
      
      for (index, speed) in self.speeds.enumerated() {
        if(speed < lowest) {
          lowest = speed;
          lowestIndex = index;
        }
        if(speed > highest) {
          highest = speed;
          highestIndex = index;
        }
      }
      
      var countWithoutLowest: Int = 0;
      var totalWithoutLowest: Double = 0;
      
      var countWithoutHighest: Int = 0;
      var totalWithoutHighest: Double = 0;
      
      for (index, speed) in self.speeds.enumerated() {
        if(index != lowestIndex) {
          totalWithoutLowest += speed;
          countWithoutLowest += 1;
        }
        
        if(index != highestIndex) {
          totalWithoutHighest += speed;
          countWithoutHighest += 1;
        }
      }
      
      let avgWithoutLowest = totalWithoutLowest / Double(countWithoutLowest);
      let avgWithoutHighest = totalWithoutHighest / Double(countWithoutHighest);
      
      var indexesToRemove: [Int] = [];
      let lowerBoundary = avgWithoutLowest - (0.1 * avgWithoutLowest);
      if(lowest < lowerBoundary) {
        indexesToRemove.append(lowestIndex);
      }
      
      let higherBoundary = avgWithoutHighest + (0.1 * avgWithoutHighest);
      if(highest > higherBoundary) {
        indexesToRemove.append(highestIndex);
      }
      
      print("avgWithoutLowest: \(avgWithoutLowest) lowestIndex: \(lowestIndex) lowest value: \(lowest) lower boundary: \(lowerBoundary)");
      print("avgWithoutHighest: \(avgWithoutHighest) highestIndex: \(highestIndex) highest value: \(highest) highest boundary: \(higherBoundary)");
      print("Indexes to remove: \(indexesToRemove)");
      
      print("prior to removal: ", self.speeds);
      
      if(indexesToRemove.count > 1 && indexesToRemove[0] < indexesToRemove[1]) {
        indexesToRemove = [indexesToRemove[1], indexesToRemove[0]];
      }
      
      for index in indexesToRemove {
        self.speeds.remove(at: index);
      }
      
      print("after removal: ", self.speeds);
      
      var total: Double = 0;
      for speed in self.speeds {
        total += speed;
      }
      avgSpeed = total / Double(self.speeds.count);
    }
    
    print(" ");
    print("== DONE ==");
    print("Num speed readings:", self.speeds.count);
    print("Speed readings: \(self.speeds)");
    print("Average speed: \(self.format(avgSpeed))");
    print(" ");
    
    if(avgSpeed < 1) {
      self.speechSynthesizer.speak(AVSpeechUtterance(string: "No shot found."));
      return 0;
    }
    
    let speedInMilesPerHour = avgSpeed * 2.23694;
    let roundedSpeed = String(format: "%.f", speedInMilesPerHour)
    print("Speed MPH = \(roundedSpeed)")
    
    self.speechSynthesizer.speak(AVSpeechUtterance(string: "Shot speed is \(roundedSpeed) miles per hour."));
    let secondUtterance =  AVSpeechUtterance(string: "\(roundedSpeed)");
    secondUtterance.rate = 0.25;
    self.speechSynthesizer.speak(secondUtterance);
    self.speechSynthesizer.speak(AVSpeechUtterance(string: "miles per hour."));
    
    DispatchQueue.main.sync {
      let speedEventEmitter = self.bridge.module(for: SpeedEventEmitter.self) as? SpeedEventEmitter
      speedEventEmitter!.sendEvent(withName: "speed-available", body: self.format(speedInMilesPerHour));
    }
    
    return speedInMilesPerHour;
  }
  
  func processImage(cgImage: CGImage, time: CMTime) -> [Blob] {
    let convertedTime = time.convertScale(Int32(fps), method: CMTimeRoundingMethod.roundHalfAwayFromZero);
    let calculatedIndex = convertedTime.value;
    print("## image currIndex=\(currIndex) calculatedIndex=\(calculatedIndex) time=\(format(time.seconds))");
    
    let croppedWidth = x2 - x1;
    let croppedHeight = y2 - y1;
    let croppedCgImage = cgImage.cropping(to: CGRect(x: x1, y: y1, width: croppedWidth, height: croppedHeight));
    
    var swiftImage = Image<RGBA<UInt8>>(cgImage: croppedCgImage!);
    let grayImage = swiftImage.map({ $0.gray })
    
    var newImageUrl: URL?;
    let blobLabeler: BlobLabeler = BlobLabeler();
    var blobs: [Blob] = [];
    
    if(firstImage != nil) {
      var diffImage = Image<Bool>(width: croppedWidth, height: croppedHeight, pixel: false);
      for x in stride(from: 0, to: croppedWidth, by: 1) {
        for y in stride(from: 0, to: croppedHeight, by: 1) {
          let g: UInt8 = grayImage[x, y];
          let p: UInt8 = firstImage![x, y];
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
      newImageUrl = self.saveImage(diffImage.uiImage, name: "my_image_\(currIndex)");
      
      blobLabeler.processImage(incomingBinaryData: diffImage, incomingWidth: diffImage.width, incomingHeight: diffImage.height)
      blobLabeler.filterBlobs();
      blobLabeler.printDebuggingInfo();
      
      blobs = blobLabeler.getBlobs();
      for blob in blobs {
        let outerContour = blob.getOuterContour();
        
        let xPoints = outerContour.getXPoints();
        let yPoints = outerContour.getYPoints();
        for i in 0..<xPoints.count {
          let x = xPoints[i];
          let y = yPoints[i];
          
          let limitedPoint = self.limitCoordinate(BPoint(x, y), croppedWidth, croppedHeight);
          
          swiftImage[limitedPoint.getX(), limitedPoint.getY()] = RGBA<UInt8>(red: 255, green: 0, blue: 0);
        }
        
        let cog = blob.getCenterOfGravity();
        drawCrossHairs(swiftImage: &swiftImage, cog: cog, width: croppedWidth, height: croppedHeight);
      }
      
      if(previousBlob != nil) {
        drawCrossHairs(swiftImage: &swiftImage, cog: previousBlob!.getCenterOfGravity(), width: croppedWidth, height: croppedHeight);
      }
      
      newImageUrl = self.saveImage(swiftImage.uiImage, name: "my_blob_\(currIndex)");
    } else {
      print("    - previousImage is nil");
      newImageUrl = self.saveImage(grayImage.uiImage, name: "my_image_\(currIndex)");
    }
    
    if(firstImage == nil) {
      firstImage = grayImage;
    }
    previousImage = grayImage;
    
    let urlAsString = "\(newImageUrl!)";
    
    DispatchQueue.main.sync {
      let myEventEmitter = self.bridge.module(for: MyEventEmitter.self) as? MyEventEmitter
      myEventEmitter!.sendEvent(withName: "image-available", body: urlAsString);
    }
    currIndex += 1;
    
    return blobs;
  }
  
  func drawCrossHairs(swiftImage: inout Image<RGBA<UInt8>>, cog: BPoint, width: Int, height: Int) {
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
  
  func getSpeedFromTwoBlobs(blob1: Blob, blob2: Blob, time: CMTime) -> Double {
    let cg1 = blob1.getCenterOfGravity();
    let cg2 = blob2.getCenterOfGravity();
    
    let xDistance = cg2.getX() - cg1.getX();
    let yDistance = cg2.getY() - cg1.getY();
    
    let distanceInPixels = Int(sqrt(Double(xDistance * xDistance + yDistance * yDistance)));
    let distanceInMeters = Double(distanceInPixels) / Double(pixelsPerMeter);
    
    print("time: \(time.seconds) previousTime: \(previousTime!.seconds)")
    
    let timeDiff = time - previousTime!;
    let speedInMetersPerSecond = distanceInMeters / timeDiff.seconds;
    print("  distanceInPixeles: \(distanceInPixels) distanceInMeters: \(self.format(distanceInMeters)) timeDiff: \(format(timeDiff.seconds))");
    
    print(String(format: "  --> Speed: %.5f", speedInMetersPerSecond));
    return speedInMetersPerSecond;
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
