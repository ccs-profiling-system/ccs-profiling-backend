const DEPARTMENT_SCOPE_ALIASES: Record<string, string[]> = {
  'Computer Science': ['Computer Science', 'BS Computer Science'],
  'Information Technology': [
    'Information Technology',
    'BS Information Technology',
    'BS Information Systems',
  ],
  'Computer Engineering': ['Computer Engineering', 'BS Computer Engineering'],
};

export function getDepartmentScopeAliases(departmentId: string): string[] {
  return DEPARTMENT_SCOPE_ALIASES[departmentId] ?? [departmentId];
}

export function isDepartmentScopeMatch(
  approvalDepartmentId: string | null | undefined,
  departmentId: string
): boolean {
  if (!approvalDepartmentId) {
    return false;
  }

  return getDepartmentScopeAliases(departmentId).includes(approvalDepartmentId);
}
