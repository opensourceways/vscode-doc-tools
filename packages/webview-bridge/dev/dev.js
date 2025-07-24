const dev = document.getElementById('dev').contentWindow;
const vscode = acquireVsCodeApi();

/**
 * 获取base64资源
 * @param {string} url 资源地址
 * @returns 
 */
function fetchResource(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(res => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          resolve(e.target.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

window.addEventListener('message', async (evt) => {
  const message = evt.data;
  if (message.source === 'client') {
    vscode.postMessage(message);
  } else if (message.source === 'server') {
    dev.postMessage(message, '*');
  }
});
