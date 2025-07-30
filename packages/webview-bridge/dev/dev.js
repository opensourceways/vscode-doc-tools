const dev = document.getElementById('dev').contentWindow;
const vscode = acquireVsCodeApi();

window.addEventListener('message', async (evt) => {
  const message = evt.data;
  if (message.source === 'client') {
    vscode.postMessage(message);
  } else if (message.source === 'server') {
    dev.postMessage(message, '*');
  }
});
