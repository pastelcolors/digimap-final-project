import Jimp from 'jimp';

export async function segment(imageBuffer: Uint8Array): Promise<Buffer> {
  const thresholdValues: { [key: number]: number } = {};
  const pixelsFrequency: number[] = Array(256).fill(0);

  function calcWeight(startPixel: number, endPixel: number): number {
    return pixelsFrequency.slice(startPixel, endPixel).reduce((acc, freq) => acc + freq, 0);
  }

  function calcVariance(startPixel: number, endPixel: number): number {
    const weight = calcWeight(startPixel, endPixel);
    const mean = weight !== 0
      ? pixelsFrequency.slice(startPixel, endPixel).reduce((acc, freq, i) => acc + (i + startPixel) * freq, 0) / weight
      : 0;

    const variance = pixelsFrequency.slice(startPixel, endPixel).reduce((acc, freq, i) => {
      const diff = (i + startPixel) - mean;
      return acc + (diff * diff) * freq;
    }, 0) / weight;

    return variance;
  }

  function threshold(pixelsFrequency: number[]): void {
    const nonzeroPixelsCount = pixelsFrequency.filter(pixel => pixel > 0).length;

    for (let pixelValue = 1; pixelValue < pixelsFrequency.length; pixelValue++) {
      const varianceBackground = calcVariance(0, pixelValue);
      const weightBackground = calcWeight(0, pixelValue) / nonzeroPixelsCount;

      const varianceForeground = calcVariance(pixelValue, pixelsFrequency.length);
      const weightForeground = calcWeight(pixelValue, pixelsFrequency.length) / nonzeroPixelsCount;

      const thresholdVariance = weightBackground * varianceBackground + weightForeground * varianceForeground;

      if (!isNaN(thresholdVariance)) {
        thresholdValues[pixelValue] = thresholdVariance;
      }
    }
  }

  const img = await Jimp.read(Buffer.from(imageBuffer));
  const imgGray = img.clone().greyscale();
  
  imgGray.scan(0, 0, imgGray.bitmap.width, imgGray.bitmap.height, (x, y, idx) => {
    const grayValue = imgGray.bitmap.data[idx];
    pixelsFrequency[grayValue]++;
  });

  threshold(pixelsFrequency);
  const opThres = Object.keys(thresholdValues).reduce((a, b) => (thresholdValues[+a] < thresholdValues[+b] ? +a : +b));

  const res = imgGray.clone();
  res.scan(0, 0, res.bitmap.width, res.bitmap.height, (x, y, idx) => {
    const grayValue = res.bitmap.data[idx]; // R channel
    const newColor = grayValue > opThres ? 0 : 255;

    res.bitmap.data[idx] = newColor; // R channel
    res.bitmap.data[idx + 1] = newColor; // G channel
    res.bitmap.data[idx + 2] = newColor; // B channel
  });

  return await res.getBufferAsync(Jimp.MIME_PNG);
}