export function getTitle(content: string) {
  for (const line of content.split('\n')) {
    if (line.trim().startsWith('# ')) {
      return line.replace('# ', '').trim();
    }
  }

  return '';
}

export function geFilterMdContent(content: string) {
  return content.replace(/<!--[\s\S]*?-->|```[\s\S]*?```|`[^`]*`/g, (text) => {
    return text.replace(/\S/g, ' ');
  })
}
