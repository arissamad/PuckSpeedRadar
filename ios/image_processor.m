#import "React/RCTBridgeModule.h"
#import "React/RCTBridge.h"

@interface RCT_EXTERN_MODULE(ImageProcessor, NSObject)

RCT_EXTERN_METHOD(
                  process: (NSString*) name
                  x1: (nonnull NSNumber) x1
                  y1: (nonnull NSNumber) y1
                  x2: (nonnull NSNumber) x2
                  y2: (nonnull NSNumber) y2
)

@end
