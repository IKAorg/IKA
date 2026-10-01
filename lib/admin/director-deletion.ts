type DirectorDeletionInput = {
  targetId: string;
  currentDirectorId: string;
  targetIsActive: boolean;
  activeDirectorCount: number;
};

export function validateDirectorDeletion(input: DirectorDeletionInput) {
  if (!input.targetId) {
    return "Falta el admin que quieres eliminar.";
  }

  if (input.targetId === input.currentDirectorId) {
    return "No puedes eliminar la identidad PIN con la que estas conectado.";
  }

  if (input.targetIsActive && input.activeDirectorCount <= 1) {
    return "No puedes eliminar el ultimo admin activo.";
  }

  return null;
}
