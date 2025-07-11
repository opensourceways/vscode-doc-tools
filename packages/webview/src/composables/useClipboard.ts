import Clipboard from 'clipboard';

interface ClipboardJSExtended extends ClipboardJS {
  onClick: (event: MouseEvent) => void;
}

export const useClipboard = (options: { text: string; target: MouseEvent; success?: (e: Clipboard.Event) => void; error?: (e: Clipboard.Event) => void }) => {
  const clipboard = new Clipboard(options.target.currentTarget as Element, {
    text: () => options.text,
  }) as ClipboardJSExtended;

  clipboard.on('success', (e) => {
    if (options?.success) {
      options.success(e);
    }

    clipboard.destroy();
  });

  clipboard.on('error', (e) => {
    if (options?.error) {
      options.error(e);
    }

    clipboard.destroy();
  });

  clipboard.onClick(options.target);
};
