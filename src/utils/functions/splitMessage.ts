export const splitMessage = (text: string, maxLength = 1900): string[] => {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let current = '';

  for (const line of text.split('\n')) {
    if (current.length + line.length + 1 > maxLength) {
      if (current) chunks.push(current.trim());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
