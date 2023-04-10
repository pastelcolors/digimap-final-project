import { JSX, Show, Suspense, createEffect, createResource, createSignal, onCleanup } from 'solid-js';
import { fn$ } from 'thaler';

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
      setImageBuffer(file);
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
        <h1 class="text-center text-4xl font-semibold mb-6">Image Processing Demo</h1>
        <div class="flex justify-center items-center">
          <div class="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
            <div class="text-center mb-4">
              <label class="block text-gray-700 text-lg font-semibold">Upload an image</label>
            </div>
            <div class="flex justify-center items-center mb-4">
              <input 
                type="file"
                accept="image/*"
                onInput={handleImageUpload}
              />
            </div>
            <div class="flex flex-col justify-center items-center">
              <div
                class={imagePreview() ? 'block' : 'hidden'}
              >
                <h2>Input Image:</h2>
                <img 
                  src={imagePreview()}
                  alt="Uploaded image preview"
                />
              </div>
              <Show
                when={!isProcessing()}
                fallback={(
                  <div class="text-lg mt-2">
                    Processing image...
                  </div>
                )}
              >
                <div
                  class={imageProcessedPreview() ? 'block' : 'hidden'}
                >
                  <h2>Processed Image:</h2>
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