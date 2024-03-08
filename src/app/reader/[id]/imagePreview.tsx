"use client";

import React, { useEffect, useState } from "react";
import { PhotoSlider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export function ImagePreview() {
  const [visible, setVisible] = useState(false);
  const [images, setImages] = useState<{ src: string; key: string }[]>([]);

  useEffect(() => {
    window.$$openImagePreview = (image) => {
      setImages([{ src: image, key: image }]);
      setVisible(true);
    };

    return () => {
      window.$$openImagePreview = undefined;
    };
  }, []);

  return (
    <PhotoSlider
      visible={visible}
      images={images}
      maskOpacity={0.8}
      onClose={() => setVisible(false)}
    />
  );
}
