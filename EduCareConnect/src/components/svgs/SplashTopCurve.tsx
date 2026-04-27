// file: src/components/svgs/SplashTopCurve.tsx
import React from "react";
// ĐẢM BẢO IMPORT ĐẦY ĐỦ CÁC THẺ: G, Defs, ClipPath, Rect, Path
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashTopCurve() {
  return (
    <Svg width={width} height={height / 2} viewBox="0 0 352 458" fill="none">
      <G clipPath="url(#clip0_2006_1394)">
        <Path
          d="M407.294 34.7645C407.294 34.7645 346.51 95.5484 271.529 170.529C196.549 245.509 196.549 367.078 271.529 442.058C271.529 442.058 210.745 381.274 135.765 306.294C60.7838 231.313 60.7845 109.745 135.765 34.7645C210.745 -40.2162 271.529 -101 407.294 34.7645Z"
          fill="white"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2006_1394">
          <Rect
            width="384"
            height="384"
            fill="white"
            transform="translate(271.529 -101) rotate(45)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
