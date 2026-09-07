export function containsSkill(text: string, skill: string) {
  const escaped = skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    Boolean(escaped) &&
    new RegExp(
      '(^|[^\\p{L}\\p{N}])' + escaped + '(?=$|[^\\p{L}\\p{N}])',
      'iu',
    ).test(text)
  );
}
