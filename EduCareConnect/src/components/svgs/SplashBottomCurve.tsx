// file: src/components/svgs/SplashTopCurve.tsx
import React from "react";
// ĐẢM BẢO IMPORT ĐẦY ĐỦ CÁC THẺ: G, Defs, ClipPath, Rect, Path
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function SplashBottomCurve() {
  return (
    // Thay thế các thông số width, height, viewBox và thẻ Path bên dưới
    // bằng mã bạn copy từ Figma.
    // Lưu ý: Đổi thuộc tính width thành {width} để nó tràn viền màn hình
    <Svg width={width} height="270" viewBox="0 0 270 270" fill="none">
      <G clipPath="url(#clip0_2006_1396)">
        <Path
          d="M46.7337 33.2663C46.7337 33.2663 61.6273 103.335 79.9996 189.77C98.3717 276.204 183.335 331.38 269.769 313.008C269.769 313.008 199.699 327.902 113.266 346.274C26.8309 364.646 -58.132 309.47 -76.5041 223.036C-94.8763 136.601 -109.77 66.5322 46.7337 33.2663Z"
          fill="white"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2006_1396">
          <Rect
            width="320"
            height="320"
            fill="white"
            transform="translate(-109.77 66.5322) rotate(-12)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
