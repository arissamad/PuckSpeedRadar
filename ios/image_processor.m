#import "React/RCTBridgeModule.h"
#import "React/RCTBridge.h"

@interface RCT_EXTERN_MODULE(ImageProcessor, NSObject)

RCT_EXTERN_METHOD(process:(NSString*)name callback: (RCTResponseSenderBlock *) callback)

@end
