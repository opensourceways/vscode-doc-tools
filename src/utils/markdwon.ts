export function getTitle(content: string) {
  for (const line of content.split('\n')) {
    if (line.trim().startsWith('# ')) {
      return line.replace('# ', '').trim();
    }
  }

  return '';
}
