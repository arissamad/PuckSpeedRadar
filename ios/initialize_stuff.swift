import Foundation
import AVFoundation

@objc(InitializeStuff)
class InitializeStuff: NSObject {
  
  @objc func initialize() {
    do {
      print("Configuring audio session....");
      try AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playback, mode: AVAudioSession.Mode.moviePlayback, options: AVAudioSession.CategoryOptions.mixWithOthers);
      print("Audio session configured.");
    } catch {
      print("An error occurred while trying to configure audio session.");
    }
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
