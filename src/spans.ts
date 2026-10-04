export function validSpan(text: string, start: number, end: number): boolean {
  const boundary = (index: number): boolean => {
    if (index <= 0 || index >= text.length) return true;
    const before = text.charCodeAt(index - 1),
      after = text.charCodeAt(index);
    return !(before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff);
  };
  return (
    Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    start >= 0 &&
    start < end &&
    end <= text.length &&
    boundary(start) &&
    boundary(end)
  );
}

export function sourceOffset(text: string, displayedOffset: number): number {
  if (!Number.isSafeInteger(displayedOffset) || displayedOffset < 0)
    throw new Error("Invalid displayed offset");
  let original = 0;
  for (let displayed = 0; displayed < displayedOffset; displayed++) {
    if (original >= text.length) throw new Error("Displayed offset exceeds source");
    if (text[original] === "\r" && text[original + 1] === "\n") original++;
    original++;
  }
  return original;
}
