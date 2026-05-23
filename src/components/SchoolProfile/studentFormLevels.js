/** Terms / levels for a selected curriculum class. */
export function levelsForClass(allLevels, classId) {
  if (!classId) return [];
  return (allLevels || [])
    .filter((l) => String(l.curriculum_class_id) === String(classId))
    .sort((a, b) => (Number(a.level_order) || 0) - (Number(b.level_order) || 0) || String(a.name).localeCompare(String(b.name)));
}

export function studentLevelIdFromRow(row) {
  return row?.curriculum_class_level_id ?? row?.curriculum_class_level?.id ?? "";
}
