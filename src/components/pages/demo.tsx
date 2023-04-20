import { JSX, Show, Suspense, createEffect, createResource, createSignal, onCleanup } from 'solid-js';
import { fn$ } from 'thaler';
import composeClassnames from '../../utils/composeClassnames';

export default function Demo(): JSX.Element {
  const [imageBuffer, setImageBuffer] = createSignal<File | null>(null);
  const [imagePreview, setImagePreview] = createSignal<string | undefined>();
  const [imageProcessedPreview, setImageProcessedPreview] = createSignal<string | undefined>();
  const [isProcessing, setIsProcessing] = createSignal(false);

  const processImage = fn$<File, Uint8Array | undefined>(async (buffer) => {
    const { segment } = await import('../../utils/process');

    try {
      const result = await segment(new Uint8Array(await buffer.arrayBuffer()));

      return new Uint8Array(result);
    } catch (error) {
      console.error(error);
    }
  });

  const [data] = createResource(imageBuffer, async (value) => {
    setIsProcessing(true);
    const img = await processImage(value);
    setIsProcessing(false);

    return img;
  });

  const handleImageUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      // 1mb limit
      if(file.size > 1048576 ){
        event.preventDefault();
        event.stopImmediatePropagation();
        alert("File is too big! Please upload a file smaller than 1MB.");
     } else {
       setImageBuffer(file);
     };
    }
  };

  // Set the image preview
  createEffect(() => {
    const buffer = imageBuffer();

    if (buffer) {
      const src = URL.createObjectURL(new Blob([buffer]));

      setImagePreview(src);
    }
  })

  // Set the processed image preview
  createEffect(() => {
    const buffer = data();

    if (buffer) {
      const src = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));

      setImageProcessedPreview(src);
    }
  })

  onCleanup(() => {
    const src = imagePreview();

    if (src) {
      URL.revokeObjectURL(src);
    }
  });

  return (
    <div class="bg-gray-100 min-h-screen">
      <div class="container mx-auto py-12">
        <div class="flex justify-center items-center">
          <div class="container max-w-4xl w-full bg-white p-6 rounded-lg shadow-md">
            <div class="container px-3 py-4 text-center mb-4 bg-yellow-300 rounded-md flex-col">
              <div class="flex justify-start items-center gap-2">
                <span class="block text-gray-900 text-base font-bold">Image segmentation using Otsu's Thresholding.</span>
                <a href="https://mrinaltyagi24.medium.com/image-segmentation-part-1-9f3db1ac1c50" target="_blank" class='inline underline text-sm'>
                  Want to learn more about it?
                </a>
              </div>
              {/* <span class="text-gray-500 text-sm">
                (PNG or JPG, 1MB max)
              </span> */}
            </div>
            <div class='flex items-start gap-4'>
              <div class='flex flex-col'>
                <span class='text-sm text-gray-600'>
                <span class="text-lg font-bold text-gray-900">What?</span> Image segmentation is the process of separating a digital image into multiple regions, where each region corresponds to a different part of the image.
                </span>
                <span class='text-sm text-gray-600'>

                <span class="text-lg font-bold text-gray-900">Why?</span> The goal of image segmentation is to change the representation of an image that is easier to analyze.
                </span>
              </div>
              <span class='text-sm text-gray-600'>
              <span class="text-lg font-bold text-gray-900">How?</span> Done by identifying regions of interest within the image, separating them from the background or noise, and grouping them into different categories based on their characteristics.
              </span>
            </div>
            <div class="flex justify-center items-center mb-4 mt-4">
              <input 
                type="file"
                accept="image/png,image/jpeg"
                onInput={handleImageUpload}
              />
            </div>
            <div class="flex justify-center items-cente gap-4">
                <div
                  class={
                    composeClassnames(
                      imagePreview() ? 'block' : 'hidden',
                      'bg-gray-200 p-4 rounded-md'
                    )
                  }
                >
                  <h2 class="text-center text-md">Input Image:</h2>
                  <img 
                    src={imagePreview()}
                    alt="Uploaded image preview"
                  />
                </div>
              <Show
                when={!isProcessing()}
                fallback={(
                  <div class="text-lg font-medium text-gray-800 mt-4">
                    Processing image...
                  </div>
                )}
              >
                <div
                  class={
                    composeClassnames(
                      imageProcessedPreview() ? 'block' : 'hidden',
                      'bg-gray-200 p-4 rounded-md'
                    )
                  }
                >
                  <h2 class="text-center text-md">Processed Image:</h2>
                  <img
                    src={imageProcessedPreview()}
                    alt="Processed image preview"
                  />
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}