/**
 * คำนวณ Levenshtein distance ระหว่าง 2 สตริง
 * รองรับ Unicode/ภาษาไทย (ใช้ Array.from สำหรับ multibyte characters)
 */
export function levenshtein(a, b) {
  const arrA = Array.from(a);
  const arrB = Array.from(b);
  const lenA = arrA.length;
  const lenB = arrB.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  const prev = Array.from({ length: lenB + 1 }, (_, i) => i);

  for (let i = 1; i <= lenA; i++) {
    const curr = [i];
    for (let j = 1; j <= lenB; j++) {
      const cost = arrA[i - 1] === arrB[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    prev.splice(0, prev.length, ...curr);
  }

  return prev[lenB];
}

/**
 * ตรวจสอบว่าชื่อเปลี่ยนมากเกินไปหรือไม่
 * @param {string} oldName ชื่อเดิม
 * @param {string} newName ชื่อใหม่
 * @param {number} maxDistance ระยะห่างสูงสุดที่อนุญาต (default: 5)
 * @returns {{ isValid: boolean, distance: number }}
 */
export function checkNameChange(oldName, newName, maxDistance = 5) {
  const distance = levenshtein(oldName.trim(), newName.trim());
  return {
    isValid: distance <= maxDistance,
    distance,
  };
}
