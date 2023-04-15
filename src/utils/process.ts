import Jimp from 'jimp';

export async function segment(imageBuffer: Uint8Array): Promise<Buffer> {
  const thresholdValues: { [key: number]: number } = {};
  const pixelsFrequency: number[] = [1];

  function calcWeight(startPixel: number, endPixel: number): number {
    return pixelsFrequency.slice(startPixel, endPixel).reduce((a, b) => a + b, 0);
  }

  function calcVariance(startPixel: number, endPixel: number): number {
    const weight = calcWeight(startPixel, endPixel);
    const mean = weight === 0
      ? 0
      : pixelsFrequency
          .slice(startPixel, endPixel)
          .map((val, i) => (i + startPixel) * val)
          .reduce((a, b) => a + b, 0) / weight;

    const variance = pixelsFrequency
      .slice(startPixel, endPixel)
      .map((val, i) => ((i + startPixel) - mean) ** 2 * val)
      .reduce((a, b) => a + b, 0) / weight;

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

  const image = await Jimp.read(imageBuffer);
  const grayImage = image.clone().greyscale();

  const histogram = new Array(256).fill(0);
  grayImage.scan(0, 0, grayImage.bitmap.width, grayImage.bitmap.height, (x, y, idx) => {
    const pixelValue = grayImage.bitmap.data[idx];
    histogram[pixelValue]++;
  });

  threshold(histogram);
  const opThres = Object.keys(thresholdValues).reduce((a, b) => (thresholdValues[a] < thresholdValues[b] ? a : b));

  grayImage.scan(0, 0, grayImage.bitmap.width, grayImage.bitmap.height, (x, y, idx) => {
    grayImage.bitmap.data[idx] = grayImage.bitmap.data[idx] > Number(opThres) ? 255 : 0;
  });

  return await grayImage.getBufferAsync(Jimp.MIME_PNG);
}