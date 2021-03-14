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

@objc(ImageProcessor)
class ImageProcessor: NSObject {
  @objc var bridge: RCTBridge!
  
  @objc func process(_ uri: String, callback successCallback: @escaping RCTResponseSenderBlock) {
    print("Starting image processing with " + uri)
    
    var index: CMTimeValue = 5;
    var timeInterval = 0.0;
    for i in stride(from: 0.0, to:1.0, by: 0.1) {
      imageFromVideo(url: URL(string: uri)!, at: index) { image in
        print("here we are, retrieving the image \(image!.size.width) at \(index)");
        
        let newImageUrl = self.saveImage(image!, name: "my_image_\(index)");
        index = index + 1;
        print("saved image URL is \(newImageUrl!)");
        let urlAsString = "\(newImageUrl!)";
        
//        print("about to callback");
//        //successCallback([urlAsString]);
//        print("called back! Now dispatching event.");
        
        let myEventEmitter = self.bridge.module(for: MyEventEmitter.self) as? MyEventEmitter
        myEventEmitter!.sendEvent(withName: "image-available", body: urlAsString);
        print("Done dispatching");
      }
      sleep(1);
    }
  }
  
  func imageFromVideo(url: URL, at time: CMTimeValue, completion: @escaping (UIImage?) -> Void) {
    DispatchQueue.global(qos: .background).async {
      let asset = AVURLAsset(url: url)
      
      let assetIG = AVAssetImageGenerator(asset: asset)
      assetIG.appliesPreferredTrackTransform = true
      assetIG.apertureMode = AVAssetImageGenerator.ApertureMode.encodedPixels
      assetIG.requestedTimeToleranceAfter = CMTime.zero;
      assetIG.requestedTimeToleranceBefore = CMTime.zero;
      
      let cmTime = CMTime(value: time, timescale: 10)
      print("cmTime seconds is \(cmTime.seconds)");
      let thumbnailImageRef: CGImage
      do {
        var actualTime: CMTime = CMTime();
        thumbnailImageRef = try assetIG.copyCGImage(at: cmTime, actualTime: &actualTime);
        print("Actual time is \(actualTime.seconds)")
      } catch let error {
        print("Error: \(error)")
        return completion(nil)
      }
      
      DispatchQueue.main.async {
        completion(UIImage(cgImage: thumbnailImageRef))
      }
    }
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
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
